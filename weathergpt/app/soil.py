POINTS = {"Low": 0, "Medium": 1, "High": 2}


def _level(v, low, high):
    return "Low" if v < low else ("High" if v > high else "Medium")


def rate_ph(ph):
    if 6.5 <= ph <= 7.5:
        return "Neutral", 2, "No correction needed"
    if ph < 6.5:
        return "Acidic", (1 if ph >= 6.0 else 0), "Add agricultural lime and organic matter"
    return "Alkaline", (1 if ph <= 8.0 else 0), "Add gypsum and organic matter"


def rate_n(n):
    lvl = _level(n, 280, 560)
    tips = {"Low": "Add nitrogen (urea, compost or green manure)",
            "Medium": "Maintain with balanced fertilizer",
            "High": "No extra nitrogen needed"}
    return lvl, POINTS[lvl], tips[lvl]


def rate_p(p):
    lvl = _level(p, 10, 25)
    tips = {"Low": "Add phosphorus (DAP or SSP)",
            "Medium": "Maintain with balanced fertilizer",
            "High": "No extra phosphorus needed"}
    return lvl, POINTS[lvl], tips[lvl]


def rate_k(k):
    lvl = _level(k, 108, 280)
    tips = {"Low": "Add potash (MOP) or organic matter",
            "Medium": "Maintain with balanced fertilizer",
            "High": "No extra potassium needed"}
    return lvl, POINTS[lvl], tips[lvl]


def rate_moisture(m):
    lvl = _level(m, 20, 40)
    tips = {"Low": "Irrigate in smaller, more frequent amounts; add mulch",
            "Medium": "Good water holding",
            "High": "Ensure drainage to avoid waterlogging"}
    return lvl, POINTS[lvl], tips[lvl]


def rate_oc(oc):
    """Organic carbon in percent. Bands: below 0.5 low, 0.5 to 0.75 medium, above 0.75 high."""
    lvl = _level(oc, 0.5, 0.75)
    tips = {"Low": "Add compost, farmyard manure or green manure",
            "Medium": "Keep adding organic matter",
            "High": "Good organic matter, keep it up"}
    return lvl, POINTS[lvl], tips[lvl]


def texture_class(sand, silt, clay):
    """USDA soil texture class from percentages of sand, silt and clay."""
    if silt + 1.5 * clay < 15:
        return "sand"
    if silt + 1.5 * clay >= 15 and silt + 2 * clay < 30:
        return "loamy sand"
    if (7 <= clay < 20 and sand > 52 and silt + 2 * clay >= 30) or (clay < 7 and silt < 50 and silt + 2 * clay >= 30):
        return "sandy loam"
    if 7 <= clay < 27 and 28 <= silt < 50 and sand <= 52:
        return "loam"
    if (silt >= 50 and 12 <= clay < 27) or (50 <= silt < 80 and clay < 12):
        return "silt loam"
    if silt >= 80 and clay < 12:
        return "silt"
    if 20 <= clay < 35 and silt < 28 and sand > 45:
        return "sandy clay loam"
    if 27 <= clay < 40 and 20 < sand <= 45:
        return "clay loam"
    if 27 <= clay < 40 and sand <= 20:
        return "silty clay loam"
    if clay >= 35 and sand > 45:
        return "sandy clay"
    if clay >= 40 and silt >= 40:
        return "silty clay"
    if clay >= 40 and sand <= 45 and silt < 40:
        return "clay"
    return "loam"


def texture_group(cls):
    """Words farmers use: sandy, loamy or clayey."""
    if cls in ("sand", "loamy sand"):
        return "Sandy"
    if cls in ("clay loam", "silty clay loam", "sandy clay", "silty clay", "clay"):
        return "Clayey"
    return "Loamy"


def _ph(s):
    ph = getattr(s, "ph", None)
    return ph if ph is not None else getattr(s, "sg_ph", None)


def build_card(soil):
    raters = [("ph", _ph, rate_ph),
              ("n", lambda s: s.n, rate_n),
              ("p", lambda s: s.p, rate_p),
              ("k", lambda s: s.k, rate_k),
              ("moisture", lambda s: s.moisture, rate_moisture),
              ("oc", lambda s: getattr(s, "organic_carbon", None), rate_oc)]
    readings, pts, max_pts = {}, 0, 0
    for key, getter, fn in raters:
        value = getter(soil)
        if value is None:
            continue
        level, points, tip = fn(value)
        readings[key] = {"value": value, "level": level, "tip": tip}
        pts += points
        max_pts += 2

    ratio = pts / max_pts if max_pts else 0
    rating = "Good" if ratio >= 0.7 else "Moderate" if ratio >= 0.4 else "Poor"
    card = {"district": soil.district, "readings": readings,
            "score": pts, "max_score": max_pts, "rating": rating,
            "source": soil.source}

    sand, silt, clay = (getattr(soil, k, None) for k in ("sand", "silt", "clay"))
    if None not in (sand, silt, clay):
        cls = texture_class(sand, silt, clay)
        card["texture"] = {"class": cls, "group": texture_group(cls),
                           "sand": sand, "silt": silt, "clay": clay}
    card["modelled"] = getattr(soil, "sg_updated", None) is not None
    card["partial"] = len(readings) < 4          # few readings: the rating is only a rough guide
    return card
