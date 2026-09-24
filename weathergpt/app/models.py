from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    phone = db.Column(db.String(15), unique=True, nullable=False)
    state = db.Column(db.String(50))
    district = db.Column(db.String(60))
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
    ph = db.Column(db.Float)
    n = db.Column(db.Float)
    p = db.Column(db.Float)
    k = db.Column(db.Float)
    moisture = db.Column(db.Float)
    source = db.Column(db.String(10), default="manual")  # "gov" or "manual"
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


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


class AlertLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey("farmer.id"), nullable=False)
    event_type = db.Column(db.String(30), nullable=False)
    message = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(10))                   # sms | push | in_app
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)


class WeatherCache(db.Model):
    district = db.Column(db.String(60), primary_key=True)
    data_json = db.Column(db.Text, nullable=False)
    cached_at = db.Column(db.DateTime, default=datetime.utcnow)