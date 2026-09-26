import requests
from pathlib import Path
from flask import Blueprint, current_app, g, jsonify, request, send_file

from .auth import auth_required
from .field_records import current_crop_fields, location_key, location_label, location_values, serialize_crop_field
from .logic import crop_fit
from .models import AlertLog, CropField, RegionCrop, SoilHealth, db
from .openmeteo import DistrictNotFound, search_locations
from .soil import build_card
from .weather import get_weather

api = Blueprint("api", __name__, url_prefix="/api")


@api.get("/nutrients")
def nutrient_dashboard():
    """Read Soil Health Card counts and map points from the project workbook."""
    path = Path(current_app.root_path).parent / "data" / "agri_data.xlsx"
    try:
        from openpyxl import load_workbook

        workbook = load_workbook(path, data_only=True, read_only=True)
        required = {"NUTRIENTS", "NUTRIENT_SUMMARY"}
        if not required.issubset(workbook.sheetnames):
            workbook.close()
            return jsonify(error="Nutrient sheets are missing from data/agri_data.xlsx"), 503

        state_sheet = workbook["NUTRIENTS"]
        headers = [str(value or "").strip() for value in next(state_sheet.iter_rows(min_row=1, max_row=1, values_only=True))]
        states = []
        for values in state_sheet.iter_rows(min_row=2, values_only=True):
            raw = {header: value for header, value in zip(headers, values) if header}
            if not raw.get("State"):
                continue
            row = {key.lower().replace(" ", "_"): value for key, value in raw.items()}
            state_key = str(raw["State"]).strip()
            row.update(state=state_key.title(), state_key=state_key.upper(),
                       coordinates=[float(raw["Map_Longitude"]), float(raw["Map_Latitude"])])
            states.append(row)

        metric_prefix = {
            "nitrogen (n)": "n", "phosphorus (p)": "p", "potassium (k)": "k",
            "organic carbon (oc)": "oc", "ph": "p_h",
            "electrical conductivity (ec)": "ec", "sulfur (s)": "s", "iron (fe)": "fe",
            "zinc (zn)": "zn", "copper (cu)": "cu", "boron (b)": "b", "manganese (mn)": "mn",
        }
        category_keys = {"non-saline": "non_saline", "sufficient": "sufficient", "deficient": "deficient"}
        national = {}
        summary_sheet = workbook["NUTRIENT_SUMMARY"]
        summary_rows = summary_sheet.iter_rows(min_row=2, values_only=True)
        for metric, category, count, _cycle, _scheme, _source in summary_rows:
            if not metric:
                continue
            prefix = metric_prefix.get(str(metric).strip().lower())
            if not prefix:
                continue
            category = str(category).strip().lower()
            suffix = category_keys.get(category, category.replace("-", "_").replace(" ", "_"))
            if prefix == "p_h":
                key = "p_h_" + suffix
            else:
                key = prefix + "_" + suffix
            national[key] = count
        workbook.close()
        return jsonify(source={"scheme": states[0]["scheme"] if states else "Soil Health Card RKVY",
                               "cycle": states[0]["cycle"] if states else "2026-27",
                               "note": "NUTRIENTS has state-level sample counts and approximate map points. NUTRIENT_SUMMARY has all-India counts from the supplied PDF."},
                       states=states, national_pdf=national)
    except (OSError, ValueError, KeyError, StopIteration) as error:
        current_app.logger.exception("Could not read nutrient sheets from %s", path)
        return jsonify(error="Nutrient dashboard data is unavailable from data/agri_data.xlsx"), 503


@api.get("/nutrients/download")
def download_nutrient_workbook():
    path = Path(current_app.root_path).parent / "data" / "agri_data.xlsx"
    if not path.is_file():
        return jsonify(error="Project workbook is unavailable"), 404
    return send_file(path, as_attachment=True, download_name="agri_data.xlsx",
                     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@api.get("/crops/fields")
@auth_required
def crop_fields():
    profile = g.farmer
    return jsonify(location=location_label(profile),
                   results=[serialize_crop_field(field) for field in current_crop_fields(profile)])


@api.post("/crops/fields")
@auth_required
def save_crop_field():
    profile = g.farmer
    values = location_values(profile)
    if not values["district"]:
        return jsonify(error="Choose a village or district before saving crop details."), 400
    data = request.get_json(silent=True) or {}
    crop = str(data.get("crop") or "").strip()
    try:
        area = float(data.get("area"))
    except (TypeError, ValueError):
        return jsonify(error="Enter the crop area as a number."), 400
    unit = str(data.get("area_unit") or "acres").strip().lower()
    if not crop or len(crop) > 60:
        return jsonify(error="Enter a crop name up to 60 characters."), 400
    if not (0 < area <= 1_000_000):
        return jsonify(error="Crop area must be greater than zero."), 400
    if unit not in {"acres", "hectares"}:
        return jsonify(error="Choose acres or hectares."), 400
    field = CropField(farmer_id=profile.id, location_key=location_key(profile),
                      village=values["village"], district=values["district"],
                      state=values["state"], postal_code=values["postal_code"],
                      latitude=values["latitude"], longitude=values["longitude"],
                      crop=crop, area=area, area_unit=unit)
    db.session.add(field)
    db.session.commit()
    return jsonify(field=serialize_crop_field(field)), 201


@api.delete("/crops/fields/<int:field_id>")
@auth_required
def delete_crop_field(field_id):
    field = CropField.query.filter_by(id=field_id, farmer_id=g.farmer.id,
                                      location_key=location_key(g.farmer)).first()
    if not field:
        return jsonify(error="Crop record not found at this location."), 404
    AlertLog.query.filter_by(crop_field_id=field.id).update({"crop_field_id": None})
    db.session.delete(field)
    db.session.commit()
    return jsonify(message="Crop record removed")


def _weather_or_error(district, lat=None, lon=None, location_name=None):
    try:
        return get_weather(district, lat, lon, location_name), None
    except DistrictNotFound as e:
        return None, (str(e), 404)
    except requests.HTTPError:
        return None, ("Weather service error. Try again in a minute.", 502)
    except (requests.RequestException, RuntimeError) as e:
        return None, (str(e) or "Weather service unavailable", 502)


@api.get("/weather/<district>")
def weather(district):
    try:
        lat = float(request.args["lat"]) if "lat" in request.args else None
        lon = float(request.args["lon"]) if "lon" in request.args else None
        if (lat is None) != (lon is None) or (lat is not None and not (-90 <= lat <= 90 and -180 <= lon <= 180)):
            raise ValueError
    except ValueError:
        return jsonify(error="Invalid map coordinates"), 400
    data, err = _weather_or_error(district, lat, lon, request.args.get("name"))
    if err:
        return jsonify(error=err[0]), err[1]
    return jsonify(data)


@api.get("/locations/search")
def location_search():
    q = request.args.get("q", "").strip()
    if len(q) < 2:
        return jsonify(results=[])
    try:
        return jsonify(results=search_locations(q))
    except requests.RequestException:
        return jsonify(error="Location search is temporarily unavailable"), 502


@api.get("/crops/search")
def crop_search():
    q = request.args.get("q", "").strip()
    state = request.args.get("state", "").strip()
    district = request.args.get("district", "").strip()
    if not q or not district:
        return jsonify(error="q and district are required"), 400

    query = RegionCrop.query.filter(RegionCrop.crop.ilike(f"%{q}%"))
    if state:
        query = query.filter(RegionCrop.state.ilike(state))
    crops = query.limit(5).all()
    if not crops:
        return jsonify(error=f"No data for '{q}' yet", results=[]), 404

    weather, err = _weather_or_error(district)
    if err:
        return jsonify(error=err[0]), err[1]

    soil = (SoilHealth.query.filter_by(district=district.title())
            .order_by(SoilHealth.updated_at.desc()).first())

    results = []
    for c in crops:
        results.append({
            "crop": c.crop, "state": c.state, "region": c.region,
            "ideal": {"temp": [c.t_min, c.t_max], "rain_5d_min": c.rain_min,
                      "ph": [c.ph_min, c.ph_max]},
            "irrigation": c.irrigation, "tips": c.tips,
            "fit": crop_fit(c, weather, soil),
        })
    return jsonify(district=district.title(), weather=weather, results=results)


@api.get("/soil")
def soil_all():
    rows = SoilHealth.query.all()
    out = []
    for s in rows:
        card = build_card(s)
        out.append({"district": s.district, "rating": card["rating"],
                    "score": card["score"], "max_score": card["max_score"]})
    return jsonify(out)


@api.get("/soil/<district>")
def soil_card(district):
    soil = (SoilHealth.query.filter(SoilHealth.district.ilike(district.strip()))
            .order_by(SoilHealth.updated_at.desc()).first())
    if not soil:
        return jsonify(error=f"No soil data for {district} yet"), 404

    card = build_card(soil)
    if soil.ph is not None:
        q = RegionCrop.query.filter(RegionCrop.ph_min <= soil.ph,
                                    RegionCrop.ph_max >= soil.ph)
        if soil.state:
            q = q.filter(RegionCrop.state.ilike(soil.state))
        card["suitable_crops"] = sorted({c.crop for c in q.limit(5).all()})
    return jsonify(card)
