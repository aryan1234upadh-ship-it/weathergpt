import json
import logging
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests

from . import openmeteo
from .models import db, WeatherCache

CACHE_MINUTES = 30
logger = logging.getLogger(__name__)


def _fetch_from_api(district, lat=None, lon=None, location_name=None):
    if lat is None or lon is None:
        lat, lon = openmeteo.geocode(district)
    data = openmeteo.parse_forecast(openmeteo.fetch_forecast(lat, lon), district)
    data["latitude"], data["longitude"] = lat, lon
    data["location_name"] = location_name or district
    data["fetched_at"] = datetime.utcnow().isoformat()
    return data


def _mock(district):
    coords = openmeteo.KNOWN.get(district.strip().lower())
    now = datetime.now(ZoneInfo("Asia/Kolkata")).replace(minute=0, second=0, microsecond=0)
    demo_chances = [5, 5, 10, 10, 15, 20, 35, 45, 55, 45, 35, 25,
                    20, 15, 10, 10, 15, 25, 35, 30, 20, 15, 10, 5]
    return {
        "district": district,
        "latitude": coords[0] if coords else None,
        "longitude": coords[1] if coords else None,
        "temp": 27.5,
        "humidity": 68,
        "description": "scattered clouds (MOCK DATA)",
        "wind_kmh": 12.0,
        "temp_max_5d": 33.0,
        "temp_min_5d": 21.0,
        "rain_24h": 4.0,
        "rain_probability_today": 20,
        "rain_probability_by_hour": [
            {"time": (now + timedelta(hours=i)).isoformat(timespec="minutes"), "probability": chance}
            for i, chance in enumerate(demo_chances)
        ],
        "rain_5d": 45.0,
        "wind_max_kmh": 28.0,
        "fetched_at": datetime.utcnow().isoformat(),
        "cached": False,
        "mock": True,
    }


def _with_coordinates(data, district):
    if data.get("latitude") is not None and data.get("longitude") is not None:
        return data
    try:
        data["latitude"], data["longitude"] = openmeteo.geocode(district)
    except (requests.RequestException, RuntimeError):
        pass  # Weather remains usable if the map geocoder is unavailable.
    return data


def get_weather(district, lat=None, lon=None, location_name=None):
    district = district.strip().title()
    cache_key = district if lat is None or lon is None else f"{district}:{lat:.4f},{lon:.4f}"
    if os.getenv("WEATHER_MODE") == "mock":
        data = _with_coordinates(_mock(district), district) if lat is None or lon is None else _mock(district)
        if lat is not None and lon is not None:
            data["latitude"], data["longitude"] = lat, lon
        data["location_name"] = location_name or district
        return data

    row = db.session.get(WeatherCache, cache_key)
    if row and datetime.utcnow() - row.cached_at < timedelta(minutes=CACHE_MINUTES):
        data = json.loads(row.data_json)
        # Refresh older cache entries once so newly added forecast fields arrive.
        if "rain_probability_today" in data and "rain_probability_by_hour" in data:
            if lat is not None and lon is not None:
                data["latitude"], data["longitude"] = lat, lon
            else:
                data = _with_coordinates(data, district)
            data["location_name"] = location_name or data.get("location_name") or district
            data["cached"] = True
            return data

    try:
        data = _fetch_from_api(district, lat, lon, location_name)
    except requests.RequestException as exc:
        if row:
            data = _with_coordinates(json.loads(row.data_json), district)
            if lat is not None and lon is not None:
                data["latitude"], data["longitude"] = lat, lon
            data["location_name"] = location_name or data.get("location_name") or district
            data["cached"] = True
            data["stale"] = True
            logger.warning("Weather provider failed for %s; serving stale cache: %s", district, exc)
            return data
        logger.exception("Weather provider request failed for %s", district)
        raise

    payload = json.dumps(data)
    if row:
        row.data_json, row.cached_at = payload, datetime.utcnow()
    else:
        db.session.add(WeatherCache(district=cache_key, data_json=payload,
                                    cached_at=datetime.utcnow()))
    db.session.commit()
    data["cached"] = False
    return data
