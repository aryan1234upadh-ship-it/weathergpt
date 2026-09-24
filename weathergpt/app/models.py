from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(15), unique=True, nullable=False)
    state = db.Column(db.String(50))
    district = db.Column(db.String(60))
    village = db.Column(db.String(100))
    postal_code = db.Column(db.String(12))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    crop = db.Column(db.String(60))
    language = db.Column(db.String(10), default="en")
    fcm_token = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey("farmer.id"), nullable=False)
    role = db.Column(db.String(10), nullable=False)      # "user" or "assistant"
    message = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SoilHealth(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    district = db.Column(db.String(60), nullable=False, index=True)
    state = db.Column(db.String(50))
    ph = db.Column(db.Float)
    n = db.Column(db.Float)
    p = db.Column(db.Float)
    k = db.Column(db.Float)
    moisture = db.Column(db.Float)
    source = db.Column(db.String(10), default="manual")  # "gov", "manual" or "soilgrids"
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Modelled estimates from SoilGrids (filled by fetch_soilgrids.py)
    sg_ph = db.Column(db.Float)
    organic_carbon = db.Column(db.Float)                 # percent
    clay = db.Column(db.Float)                           # percent
    sand = db.Column(db.Float)                           # percent
    silt = db.Column(db.Float)                           # percent
    sg_updated = db.Column(db.DateTime)


class RegionCrop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    region = db.Column(db.String(30), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    crop = db.Column(db.String(60), nullable=False, index=True)
    t_min = db.Column(db.Float)
    t_max = db.Column(db.Float)
    rain_min = db.Column(db.Float)
    ph_min = db.Column(db.Float)
    ph_max = db.Column(db.Float)
    irrigation = db.Column(db.Text)
    tips = db.Column(db.Text)


class CropField(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey("farmer.id"), nullable=False, index=True)
    location_key = db.Column(db.String(64), nullable=False, index=True)
    village = db.Column(db.String(100))
    district = db.Column(db.String(60))
    state = db.Column(db.String(50))
    postal_code = db.Column(db.String(12))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    crop = db.Column(db.String(60), nullable=False)
    area = db.Column(db.Float, nullable=False)
    area_unit = db.Column(db.String(12), nullable=False, default="acres")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class AlertLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey("farmer.id"), nullable=False)
    event_type = db.Column(db.String(30), nullable=False)
    message = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(10))                   # sms | push | in_app
    crop_field_id = db.Column(db.Integer, db.ForeignKey("crop_field.id"))
    crop_name = db.Column(db.String(60))
    crop_area = db.Column(db.Float)
    crop_area_unit = db.Column(db.String(12))
    location = db.Column(db.String(255))
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)


class WeatherCache(db.Model):
    district = db.Column(db.String(60), primary_key=True)
    data_json = db.Column(db.Text, nullable=False)
    cached_at = db.Column(db.DateTime, default=datetime.utcnow)
