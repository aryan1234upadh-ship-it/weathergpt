import json
import logging
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests

from . import openmeteo
from .models import db, WeatherCache

CACHE_MINUTES = 120
logger = logging.getLogger(__name__)


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


def _fetch_openweather(lat, lon, district, location_name=None):
    """Fetch the forecast from OpenWeather using the configured server-side key."""
    api_key = os.getenv("OPENWEATHER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENWEATHER_API_KEY is not set in Render.")
    response = requests.get(
        "https://api.openweathermap.org/data/2.5/forecast",
        params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}, timeout=12,
    )
    if not response.ok:
        # OpenWeather includes its API key in the query string; never log the URL.
        raise RuntimeError(f"OpenWeather backup returned HTTP {response.status_code}.")
    entries = response.json().get("list") or []
    if not entries:
        raise RuntimeError("OpenWeather backup returned no forecast data.")

    tz = ZoneInfo("Asia/Kolkata")
    now = datetime.now(tz)
    today = now.date().isoformat()
    daily, rain_24h, rain_5d, chances = {}, 0.0, 0.0, []
    current = None
    for item in entries:
        local_time = datetime.fromtimestamp(int(item["dt"]), tz=tz)
        rain = float((item.get("rain") or {}).get("3h") or 0.0)
        chance = round(float(item.get("pop") or 0) * 100)
        rain_5d += rain
        day = local_time.date().isoformat()
        values = daily.setdefault(day, {"mins": [], "maxes": [], "chance": 0})
        values["mins"].append(float(item["main"]["temp_min"]))
        values["maxes"].append(float(item["main"]["temp_max"]))
        values["chance"] = max(values["chance"], chance)
        if current is None and local_time >= now:
            current = item
        if local_time >= now and (local_time - now).total_seconds() < 24 * 60 * 60:
            rain_24h += rain
            chances.append({"time": local_time.isoformat(timespec="minutes"), "probability": chance})
    current = current or entries[0]
    temps_min = [v for d in daily.values() for v in d["mins"]]
    temps_max = [v for d in daily.values() for v in d["maxes"]]
    description = (current.get("weather") or [{}])[0].get("description", "unknown")
    wind = current.get("wind") or {}
    return {
        "district": district, "latitude": lat, "longitude": lon,
        "location_name": location_name or district,
        "temp": round(float(current["main"]["temp"]), 1),
        "humidity": round(float(current["main"].get("humidity", 0))),
        "description": description,
        "wind_kmh": round(float(wind.get("speed", 0)) * 3.6, 1),
        "temp_max_5d": round(max(temps_max), 1) if temps_max else 0.0,
        "temp_min_5d": round(min(temps_min), 1) if temps_min else 0.0,
        "rain_24h": round(rain_24h, 1),
        "rain_probability_today": daily.get(today, {}).get("chance"),
        "rain_probability_by_hour": chances,
        "rain_5d": round(rain_5d, 1),
        "wind_max_kmh": round(max(float((e.get("wind") or {}).get("gust", (e.get("wind") or {}).get("speed", 0))) for e in entries) * 3.6, 1),
        "source": "openweather",
    }


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
        if lat is None or lon is None:
            lat, lon = openmeteo.geocode(district)
        data = _fetch_openweather(lat, lon, district, location_name)
    except (requests.RequestException, RuntimeError, ValueError, KeyError) as exc:
        # Request exception text can contain the OpenWeather URL, including its API key.
        logger.warning("OpenWeather failed for %s (%s)", district, type(exc).__name__)
        if row:
            data = _with_coordinates(json.loads(row.data_json), district)
            if lat is not None and lon is not None:
                data["latitude"], data["longitude"] = lat, lon
            data["location_name"] = location_name or data.get("location_name") or district
            data["cached"] = True
            data["stale"] = True
            return data
        if isinstance(exc, requests.RequestException):
            raise RuntimeError("OpenWeather is unavailable. Check the key and try again later.") from exc
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
