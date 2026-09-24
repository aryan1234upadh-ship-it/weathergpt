"""Open-Meteo: free weather API that needs no key. Also finds a district's coordinates."""
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import re

import requests

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
TIMEOUT = 12
FORECAST_DAYS = 5          # the app's texts and alert rules use a 5-day window

# Offline fallback for the demo districts: (latitude, longitude)
KNOWN = {
    "patna": (25.594, 85.137), "ludhiana": (30.901, 75.857), "pune": (18.520, 73.857),
    "chennai": (13.083, 80.271), "lucknow": (26.847, 80.947), "kolkata": (22.573, 88.364),
}

# WMO weather codes as documented by Open-Meteo
WMO = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "fog",
    51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 56: "freezing drizzle", 57: "freezing drizzle",
    61: "light rain", 63: "rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
    71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
    80: "light rain showers", 81: "rain showers", 82: "violent rain showers",
    85: "snow showers", 86: "heavy snow showers",
    95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with hail",
}


class DistrictNotFound(RuntimeError):
    pass


@lru_cache(maxsize=256)
def geocode(name):
    """Return (latitude, longitude) for a district name in India."""
    key = name.strip().lower()
    results, err = [], None
    try:
        r = requests.get(GEOCODE_URL, timeout=TIMEOUT, params={
            "name": name.strip(), "count": 5, "language": "en", "format": "json", "countryCode": "IN"})
        r.raise_for_status()
        results = r.json().get("results") or []
    except requests.RequestException as e:
        err = e
    if results:
        return results[0]["latitude"], results[0]["longitude"]
    if key in KNOWN:
        return KNOWN[key]
    if err:
        raise err
    raise DistrictNotFound(f"Could not find '{name}' in India. Check the spelling.")


def search_locations(query):
    """Search Indian villages, towns and postal codes with their admin areas."""
    query = str(query or "").strip()
    if len(query) < 2:
        return []
    r = requests.get(GEOCODE_URL, timeout=TIMEOUT, params={
        "name": query, "count": 10, "language": "en", "format": "json", "countryCode": "IN"})
    r.raise_for_status()
    results = r.json().get("results") or []
    if not results and re.fullmatch(r"\d{6}", query):
        # Numeric Indian PINs are not consistently indexed by the city geocoder.
        postal = requests.get(f"https://api.postalpincode.in/pincode/{query}", timeout=TIMEOUT)
        postal.raise_for_status()
        payload = postal.json()
        offices = (payload[0].get("PostOffice") or []) if payload and payload[0].get("Status") == "Success" else []

        def office_result(office):
            name = office.get("Name", "")
            district = office.get("District", "")
            state = office.get("State", "")
            try:
                lat, lon = geocode(", ".join(part for part in (name, district, state) if part))
            except (requests.RequestException, RuntimeError):
                return None
            return {"name": name, "district": district, "state": state,
                    "postal_code": str(office.get("Pincode") or query),
                    "latitude": lat, "longitude": lon, "country": "India"}

        with ThreadPoolExecutor(max_workers=5) as pool:
            results = [item for item in pool.map(office_result, offices[:10]) if item]
    return [{
        "name": item.get("name", ""),
        "district": item.get("admin2") or item.get("admin1") or "",
        "state": item.get("admin1", ""),
        "postal_code": next((str(p) for p in item.get("postcodes", []) if p), ""),
        "latitude": item.get("latitude"),
        "longitude": item.get("longitude"),
        "country": item.get("country", "India"),
    } for item in results]


def fetch_forecast(lat, lon):
    r = requests.get(FORECAST_URL, timeout=TIMEOUT, params={
        "latitude": lat, "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max",
        "hourly": "precipitation,precipitation_probability", "forecast_hours": 24,
        "forecast_days": FORECAST_DAYS, "timezone": "Asia/Kolkata", "wind_speed_unit": "kmh"})
    r.raise_for_status()
    return r.json()


def _nums(values):
    return [float(v) for v in (values or []) if v is not None]


def parse_forecast(js, district):
    """Turn Open-Meteo's answer into the fields the rest of the app already uses."""
    cur, daily = js["current"], js["daily"]
    hourly_rain = _nums((js.get("hourly") or {}).get("precipitation"))
    hourly = js.get("hourly") or {}
    hourly_probability = hourly.get("precipitation_probability") or []
    hourly_times = hourly.get("time") or []
    day_rain = _nums(daily.get("precipitation_sum"))
    tmax, tmin = _nums(daily.get("temperature_2m_max")), _nums(daily.get("temperature_2m_min"))
    gusts = _nums(daily.get("wind_gusts_10m_max"))
    rain_probability = _nums(daily.get("precipitation_probability_max"))
    return {
        "district": district,
        "temp": round(float(cur["temperature_2m"]), 1),
        "humidity": round(float(cur["relative_humidity_2m"])),
        "description": WMO.get(int(cur.get("weather_code", 0)), "unknown"),
        "wind_kmh": round(float(cur["wind_speed_10m"]), 1),
        "temp_max_5d": round(max(tmax), 1) if tmax else round(float(cur["temperature_2m"]), 1),
        "temp_min_5d": round(min(tmin), 1) if tmin else round(float(cur["temperature_2m"]), 1),
        "rain_24h": round(sum(hourly_rain) if hourly_rain else (day_rain[0] if day_rain else 0.0), 1),
        "rain_probability_today": round(rain_probability[0]) if rain_probability else None,
        "rain_probability_by_hour": [
            {"time": hourly_times[i], "probability": hourly_probability[i]}
            for i in range(min(len(hourly_times), len(hourly_probability)))
        ],
        "rain_5d": round(sum(day_rain), 1),
        "wind_max_kmh": round(max(gusts), 1) if gusts else round(float(cur["wind_speed_10m"]), 1),
        "source": "open-meteo",
    }
