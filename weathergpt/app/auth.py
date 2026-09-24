import os
import random
import re
import time
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request

from .models import db, Farmer

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

OTP_TTL = 300          # seconds
MAX_TRIES = 5
_otps = {}             # phone -> {"otp", "exp", "tries"}; memory only, fine for the demo
PHONE_RE = re.compile(r"^[6-9]\d{9}$")   # 10-digit Indian mobile number


def _phone(value):
    digits = re.sub(r"\D", "", str(value or ""))
    return digits[-10:] if len(digits) >= 10 else digits


def _profile(f):
    return {"id": f.id, "name": f.name, "phone": f.phone, "state": f.state,
            "district": f.district, "village": f.village, "postal_code": f.postal_code,
            "latitude": f.latitude, "longitude": f.longitude,
            "crop": f.crop, "language": f.language}


def make_token(farmer_id):
    payload = {"sub": str(farmer_id),
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify(error="Login required"), 401
        try:
            data = jwt.decode(header[7:], current_app.config["SECRET_KEY"],
                              algorithms=["HS256"])
        except jwt.PyJWTError:
            return jsonify(error="Invalid or expired token"), 401
        farmer = db.session.get(Farmer, int(data["sub"]))
        if not farmer:
            return jsonify(error="Farmer not found"), 401
        g.farmer = farmer
        return fn(*args, **kwargs)
    return wrapper


@auth_bp.post("/register")
def register():
    d = request.get_json(silent=True) or {}
    phone, name = _phone(d.get("phone")), (d.get("name") or "").strip()
    if not name or not PHONE_RE.match(phone):
        return jsonify(error="Name and a valid 10-digit mobile number are required"), 400
    if Farmer.query.filter_by(phone=phone).first():
        return jsonify(error="This number is already registered. Please log in."), 409

    f = Farmer(name=name, phone=phone,
               state=(d.get("state") or "").strip(),
               district=(d.get("district") or "").strip().title(),
               crop=(d.get("crop") or "").strip(),
               language=d.get("language") or "en")
    db.session.add(f)
    db.session.commit()
    return jsonify(message="Registered", farmer=_profile(f)), 201


@auth_bp.post("/login/request")
def login_request():
    phone = _phone((request.get_json(silent=True) or {}).get("phone"))
    if not Farmer.query.filter_by(phone=phone).first():
        return jsonify(error="This number is not registered"), 404

    otp = f"{random.SystemRandom().randint(0, 999999):06d}"
    _otps[phone] = {"otp": otp, "exp": time.time() + OTP_TTL, "tries": 0}
    print(f"[DEMO OTP] {phone}: {otp}")

    resp = {"message": "OTP sent"}
    if os.getenv("OTP_MODE", "demo") == "demo":
        resp["demo_otp"] = otp            # never do this in production
    return jsonify(resp)


@auth_bp.post("/login/verify")
def login_verify():
    d = request.get_json(silent=True) or {}
    phone, otp = _phone(d.get("phone")), str(d.get("otp", "")).strip()

    entry = _otps.get(phone)
    if not entry or time.time() > entry["exp"]:
        return jsonify(error="OTP expired. Request a new one."), 401
    if entry["otp"] != otp:
        entry["tries"] += 1
        if entry["tries"] >= MAX_TRIES:
            del _otps[phone]
        return jsonify(error="Wrong OTP"), 401

    del _otps[phone]
    farmer = Farmer.query.filter_by(phone=phone).first()
    return jsonify(token=make_token(farmer.id), farmer=_profile(farmer))


@auth_bp.get("/me")
@auth_required
def me():
    return jsonify(_profile(g.farmer))


@auth_bp.put("/me")
@auth_required
def update_me():
    d = request.get_json(silent=True) or {}
    for field in ("name", "state", "district", "village", "postal_code", "crop", "language", "fcm_token"):
        if field in d:
            value = str(d[field]).strip()
            setattr(g.farmer, field, value.title() if field == "district" else value)
    if "latitude" in d and "longitude" in d:
        try:
            lat, lon = float(d["latitude"]), float(d["longitude"])
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                raise ValueError
            g.farmer.latitude, g.farmer.longitude = lat, lon
        except (TypeError, ValueError):
            return jsonify(error="Invalid map coordinates"), 400
    db.session.commit()
    return jsonify(_profile(g.farmer))
