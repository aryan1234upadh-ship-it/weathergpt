"""SoilGrids (ISRIC): modelled soil properties for any point on Earth.

Free, but it is a beta service limited to 5 calls per minute and it has been paused at
times. So the app never calls it while a farmer waits: fetch_soilgrids.py fetches once per
district and the result is saved in the database.
"""
from datetime import datetime

import requests

URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
TIMEOUT = 40
DEPTHS = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}     # layer thickness in cm, used as weights
FACTOR = {"phh2o": 10, "soc": 10, "clay": 10, "sand": 10, "silt": 10}   # mapped value / factor


class SoilGridsUnavailable(RuntimeError):
    pass


def fetch(lat, lon):
    params = [("lon", lon), ("lat", lat), ("value", "mean")]
    params += [("property", p) for p in FACTOR]
    params += [("depth", d) for d in DEPTHS]
    try:
        r = requests.get(URL, params=params, timeout=TIMEOUT)
    except requests.RequestException as e:
        raise SoilGridsUnavailable(f"could not reach SoilGrids ({e.__class__.__name__})")
    if r.status_code == 429:
        raise SoilGridsUnavailable("rate limit reached (5 calls per minute)")
    if r.status_code >= 500:
        raise SoilGridsUnavailable(f"SoilGrids server error {r.status_code}")
    if r.status_code >= 400:
        raise SoilGridsUnavailable(f"SoilGrids refused the request ({r.status_code})")
    try:
        return r.json()
    except ValueError:
        raise SoilGridsUnavailable("SoilGrids sent an unreadable answer")


def parse(js):
    """Average the top 30 cm and convert to normal units.
    Returns {"ph", "organic_carbon" (%), "clay", "sand", "silt" (%)}."""
    layers = (js.get("properties") or {}).get("layers") or []
    got = {}
    for layer in layers:
        name = layer.get("name")
        if name not in FACTOR:
            continue
        factor = (layer.get("unit_measure") or {}).get("d_factor") or FACTOR[name]
        total = weight = 0.0
        for d in layer.get("depths") or []:
            w = DEPTHS.get(d.get("label"))
            v = (d.get("values") or {}).get("mean")
            if w and v is not None:
                total += v * w
                weight += w
        if weight:
            got[name] = total / weight / factor
    if "phh2o" not in got:
        raise SoilGridsUnavailable("no soil data at this point (it may be built-up land or water)")

    out = {"ph": round(got["phh2o"], 1), "organic_carbon": None, "clay": None, "sand": None, "silt": None}
    if "soc" in got:
        out["organic_carbon"] = round(got["soc"] / 10, 2)            # g/kg -> %
    if all(k in got for k in ("clay", "sand", "silt")) and 90 <= got["clay"] + got["sand"] + got["silt"] <= 110:
        out["clay"], out["sand"], out["silt"] = (round(got[k], 1) for k in ("clay", "sand", "silt"))
    if not 3 <= out["ph"] <= 10:
        raise SoilGridsUnavailable(f"pH {out['ph']} looks wrong, ignoring this answer")
    return out


def apply_soilgrids(row, sg):
    """Save a parsed SoilGrids answer on a SoilHealth row. Your own research values win:
    pH from SoilGrids is only used when the row has none."""
    row.sg_ph = sg["ph"]
    row.organic_carbon = sg["organic_carbon"]
    row.clay, row.sand, row.silt = sg["clay"], sg["sand"], sg["silt"]
    row.sg_updated = datetime.utcnow()
    if getattr(row, "ph", None) is None:
        row.ph = sg["ph"]
