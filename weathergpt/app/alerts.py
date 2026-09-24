import os
from datetime import datetime, timedelta

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Blueprint, g, jsonify, request

from .ai import ask_ai
from .auth import auth_required
from .chat import LANGUAGES
from .field_records import current_crop_fields, location_label
from .models import db, AlertLog, Farmer
from .weather import get_weather

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api")

DEDUP_HOURS = 12

# Starting thresholds. Tune them with your team or an agriculture officer.
def detect_events(w):
    events = []
    if w["rain_24h"] >= 65:
        events.append("HEAVY_RAIN")
    if w["temp_max_5d"] >= 40:
        events.append("HEATWAVE")
    if w["temp_min_5d"] <= 4:
        events.append("COLD_FROST")
    if w["wind_max_kmh"] >= 50:
        events.append("STRONG_WIND")
    if w["rain_5d"] < 2:
        events.append("DRY_SPELL")
    return events


# Crop match: every crop is HARMED by default. HELP and SKIP lists are simple examples
# for your team to review. Names are matched as text inside the farmer's crop name.
EFFECTS = {
    "HEAVY_RAIN":  {"HELP": ["rice", "paddy"]},
    "HEATWAVE":    {},
    "COLD_FROST":  {"SKIP": ["wheat", "mustard"]},   # winter crops handle cold
    "STRONG_WIND": {},
    "DRY_SPELL":   {},
}


def crop_effect(event, crop):
    c = (crop or "").lower()
    rules = EFFECTS[event]
    if any(k in c for k in rules.get("SKIP", [])):
        return None
    if any(k in c for k in rules.get("HELP", [])):
        return "HELP"
    return "HARM"


TEMPLATES = {
    ("HEAVY_RAIN", "HARM"): "Heavy rain expected ({rain_24h} mm in 24 hours). Protect your {crop_area} at {location}: harvest ripe produce, keep drainage channels clear and delay spraying or fertilizer.",
    ("HEAVY_RAIN", "HELP"): "Good rain expected ({rain_24h} mm in 24 hours). This may help your {crop_area} at {location}. Plan transplanting or sowing and keep field drainage open.",
    ("HEATWAVE", "HARM"): "Very hot weather expected (up to {temp_max_5d} \u00b0C). Protect your {crop_area} at {location}: irrigate early morning or evening, mulch the soil and avoid spraying in the afternoon.",
    ("COLD_FROST", "HARM"): "Cold weather expected (as low as {temp_min_5d} \u00b0C). Protect your {crop_area} at {location}: light evening irrigation and covering young plants can reduce frost damage.",
    ("STRONG_WIND", "HARM"): "Strong winds expected (gusts up to {wind_max_kmh} km/h). Protect your {crop_area} at {location}: support tall crops, delay spraying and secure covers.",
    ("DRY_SPELL", "HARM"): "Almost no rain in the next 5 days ({rain_5d} mm). Plan irrigation for your {crop_area} at {location} and use mulch to save soil moisture.",
}


def build_message(farmer, event, effect, w, crop_field=None):
    crop = crop_field.crop if crop_field else farmer.crop
    crop = crop or "crop"
    crop_area = (f"{crop} ({crop_field.area:g} {crop_field.area_unit})"
                 if crop_field else f"{crop} crop")
    text = TEMPLATES[(event, effect)].format(
        crop=crop, crop_area=crop_area,
        location=location_label(crop_field or farmer), **w)
    lang = farmer.language or "en"
    if lang != "en" and lang in LANGUAGES and os.getenv("AI_PROVIDER", "mock") != "mock":
        try:
            system = (f"Rewrite this farming alert in {LANGUAGES[lang]}. Keep the meaning "
                      "and every number exactly the same. Use simple words, under 60 words. "
                      "Output only the message.")
            out = ask_ai(system, [{"role": "user", "content": text}])
            if out:
                return out
        except (requests.RequestException, RuntimeError):
            pass
    return text


def _already_sent(farmer_id, event, crop_field_id=None):
    since = datetime.utcnow() - timedelta(hours=DEDUP_HOURS)
    query = AlertLog.query.filter(AlertLog.farmer_id == farmer_id,
                                  AlertLog.event_type == event,
                                  AlertLog.sent_at >= since)
    query = query.filter(AlertLog.crop_field_id.is_(None) if crop_field_id is None
                         else AlertLog.crop_field_id == crop_field_id)
    return query.first() is not None


def _send_push(farmer, message):
    print(f"[PUSH demo, not really sent] to farmer {farmer.id}: {message[:60]}")   # TODO: FCM


def _send_sms(farmer, message):
    print(f"[SMS demo, not really sent] to {farmer.phone}: {message[:60]}")        # TODO: SMS gateway


def deliver(farmer, event, message, crop_field=None):
    db.session.add(AlertLog(
        farmer_id=farmer.id, event_type=event, message=message, channel="in_app",
        crop_field_id=crop_field.id if crop_field else None,
        crop_name=crop_field.crop if crop_field else farmer.crop,
        crop_area=crop_field.area if crop_field else None,
        crop_area_unit=crop_field.area_unit if crop_field else None,
        location=location_label(crop_field or farmer)))
    db.session.commit()
    _send_push(farmer, message)
    _send_sms(farmer, message)


def run_check(district_filter=None, overrides=None, dedup=True):
    sent = []
    farmers = Farmer.query.filter(Farmer.district.isnot(None), Farmer.district != "").all()
    for farmer in farmers:
        district = farmer.district
        if district_filter and district.casefold() != district_filter.strip().casefold():
            continue
        fields = current_crop_fields(farmer)
        crop_records = fields or ([None] if farmer.crop else [])
        if not crop_records:
            continue
        try:
            weather = get_weather(district, farmer.latitude, farmer.longitude,
                                  location_label(farmer) if farmer.village else None)
        except (requests.RequestException, RuntimeError):
            continue
        if overrides:
            weather = {**weather, **overrides}
        for event in detect_events(weather):
            for crop_field in crop_records:
                crop = crop_field.crop if crop_field else farmer.crop
                effect = crop_effect(event, crop)
                field_id = crop_field.id if crop_field else None
                if not effect or (dedup and _already_sent(farmer.id, event, field_id)):
                    continue
                message = build_message(farmer, event, effect, weather, crop_field)
                deliver(farmer, event, message, crop_field)
                sent.append({
                    "farmer": farmer.name, "crop": crop,
                    "area": crop_field.area if crop_field else None,
                    "area_unit": crop_field.area_unit if crop_field else None,
                    "location": location_label(crop_field or farmer),
                    "event": event, "effect": effect, "message": message,
                })
    return sent


def start_scheduler(app):
    sched = BackgroundScheduler(daemon=True)

    def job():
        with app.app_context():
            try:
                print("[alerts] check finished:", len(run_check()), "alert(s)")
            except Exception as e:
                print("[alerts] check failed:", e)

    sched.add_job(job, "interval", minutes=30, id="weather-alerts")
    sched.start()
    return sched


@alerts_bp.get("/alerts")
@auth_required
def my_alerts():
    rows = (AlertLog.query.filter_by(farmer_id=g.farmer.id, channel="in_app")
            .order_by(AlertLog.id.desc()).limit(30).all())
    return jsonify([{"event": r.event_type, "message": r.message,
                     "crop": r.crop_name, "crop_area": r.crop_area,
                     "crop_area_unit": r.crop_area_unit, "location": r.location,
                     "at": r.sent_at.isoformat()} for r in rows])


NUMERIC = {"rain_24h", "rain_5d", "temp", "temp_max_5d", "temp_min_5d", "wind_max_kmh"}


@alerts_bp.post("/alerts/simulate")
@auth_required
def simulate():
    """Demo only: run the alert check with made-up weather."""
    if os.getenv("ALERT_SIM", "off") != "on":
        return jsonify(error="Simulation is disabled"), 403
    d = request.get_json(silent=True) or {}
    try:
        overrides = {k: float(v) for k, v in (d.get("weather") or {}).items() if k in NUMERIC}
    except (TypeError, ValueError):
        return jsonify(error="Weather values must be numbers"), 400
    sent = run_check(d.get("district") or g.farmer.district, overrides,
                     dedup=not d.get("ignore_dedup"))
    return jsonify(count=len(sent), sent=sent)