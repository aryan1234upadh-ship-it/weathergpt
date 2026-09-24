def crop_fit(crop, weather, soil=None):
    """Check a crop against today's weather and the district's soil.
    Only checks that have sourced numbers are used. Empty cells are skipped, never guessed."""
    verdict, reasons, checked = "GOOD", [], 0

    if crop.t_min is not None and crop.t_max is not None:
        checked += 1
        if not (crop.t_min <= weather["temp"] <= crop.t_max):
            verdict = "WAIT"
            reasons.append(f"Temperature {weather['temp']}°C is outside the ideal "
                           f"{crop.t_min}-{crop.t_max}°C")

    if crop.rain_min is not None:
        checked += 1
        if weather["rain_5d"] < crop.rain_min:
            if verdict == "GOOD":
                verdict = "IRRIGATE"
            reasons.append(f"Only {weather['rain_5d']} mm rain expected in 5 days; "
                           f"this crop needs about {crop.rain_min} mm")

    ph = None
    if soil is not None:
        ph = soil.ph if soil.ph is not None else getattr(soil, "sg_ph", None)
    if ph is not None and crop.ph_min is not None and crop.ph_max is not None:
        checked += 1
        if not (crop.ph_min <= ph <= crop.ph_max):
            if verdict == "GOOD":
                verdict = "CHECK SOIL"
            reasons.append(f"Soil pH {ph} is outside the ideal {crop.ph_min}-{crop.ph_max}")

    if checked == 0:
        return {"verdict": "NO DATA", "reasons": ["Not enough sourced data to check this crop yet"]}
    if not reasons:
        reasons.append(f"Passed all {checked} check(s) we have data for")
    return {"verdict": verdict, "reasons": reasons}