"""Fill soil data from SoilGrids for your districts.

    python fetch_soilgrids.py                 (all districts in your database)
    python fetch_soilgrids.py Patna Gaya      (only these districts)

SoilGrids allows 5 calls a minute, so this waits between districts. It may take a while,
and if SoilGrids is down it says so and changes nothing. Your app keeps working either way.
"""
import sys
import time

import requests

from app import create_app, openmeteo
from app.models import db, Farmer, SoilHealth
from app.soilgrids import SoilGridsUnavailable, apply_soilgrids, fetch, parse

PAUSE = 13          # seconds between calls (5 per minute allowed)


def district_names(args):
    if args:
        return [a.strip().title() for a in args]
    names = {s.district for s in SoilHealth.query.all()}
    names |= {f.district for f in Farmer.query.all() if f.district}
    return sorted(names)


app = create_app()
with app.app_context():
    todo = district_names(sys.argv[1:])
    done = 0
    for i, name in enumerate(todo):
        if i:
            time.sleep(PAUSE)
        print(f"[{i + 1}/{len(todo)}] {name}: ", end="", flush=True)
        try:
            lat, lon = openmeteo.geocode(name)
            sg = parse(fetch(lat, lon))
        except (SoilGridsUnavailable, openmeteo.DistrictNotFound, requests.RequestException) as e:
            print("skipped -", e)
            continue

        row = (SoilHealth.query.filter(SoilHealth.district.ilike(name))
               .order_by(SoilHealth.updated_at.desc()).first())
        if not row:
            farmer = Farmer.query.filter(Farmer.district.ilike(name)).first()
            row = SoilHealth(district=name, state=farmer.state if farmer else None, source="soilgrids")
            db.session.add(row)
        apply_soilgrids(row, sg)
        db.session.commit()
        done += 1
        print(f"pH {sg['ph']}, organic carbon {sg['organic_carbon']}%, "
              f"sand/silt/clay {sg['sand']}/{sg['silt']}/{sg['clay']}")

    print(f"\nDone: {done} of {len(todo)} districts updated.")
    if todo and not done:
        print("Nothing was updated. SoilGrids may be down or busy (ISRIC has paused its API at times).")
        print("Try again later. Your app keeps working from your manual soil data.")
