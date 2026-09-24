"""Helpers for tying a farmer's saved crop records to their selected place."""
import hashlib

from .models import CropField


def location_values(profile):
    return {
        "village": (getattr(profile, "village", None) or "").strip(),
        "district": (getattr(profile, "district", None) or "").strip(),
        "state": (getattr(profile, "state", None) or "").strip(),
        "postal_code": (getattr(profile, "postal_code", None) or "").strip(),
        "latitude": getattr(profile, "latitude", None),
        "longitude": getattr(profile, "longitude", None),
    }


def location_key(profile):
    values = location_values(profile)
    identity = "|".join([
        values["village"].casefold(), values["district"].casefold(),
        values["state"].casefold(), values["postal_code"],
        "" if values["latitude"] is None else f"{float(values['latitude']):.5f}",
        "" if values["longitude"] is None else f"{float(values['longitude']):.5f}",
    ])
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


def location_label(profile):
    values = location_values(profile)
    parts = [values["village"], values["district"], values["state"]]
    label = ", ".join(dict.fromkeys(part for part in parts if part))
    if values["postal_code"]:
        label = f"{label} (PIN {values['postal_code']})" if label else f"PIN {values['postal_code']}"
    return label or "your saved location"


def current_crop_fields(profile):
    return (CropField.query.filter_by(farmer_id=profile.id, location_key=location_key(profile))
            .order_by(CropField.id.asc()).all())


def serialize_crop_field(field):
    return {"id": field.id, "crop": field.crop, "area": field.area,
            "area_unit": field.area_unit, "village": field.village,
            "district": field.district, "state": field.state,
            "postal_code": field.postal_code}
