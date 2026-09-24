"""Add the new SoilGrids columns to your existing database without deleting anything.
Run once:  python migrate.py"""
import sqlite3
import sys
from pathlib import Path

DB = Path(sys.argv[1] if len(sys.argv) > 1 else "instance/weathergpt.db")
NEW = {"sg_ph": "REAL", "organic_carbon": "REAL", "clay": "REAL",
       "sand": "REAL", "silt": "REAL", "sg_updated": "DATETIME"}

if not DB.exists():
    raise SystemExit(f"Database not found at {DB}. Run from the weathergpt folder, "
                     "or start the app once with python run.py to create it.")

con = sqlite3.connect(DB)
have = {row[1] for row in con.execute("PRAGMA table_info(soil_health)")}
if not have:
    raise SystemExit("Table soil_health does not exist yet. Run python seed.py first.")

added = []
for name, kind in NEW.items():
    if name not in have:
        con.execute(f"ALTER TABLE soil_health ADD COLUMN {name} {kind}")
        added.append(name)
con.commit()
con.close()
print("Added columns:", ", ".join(added) if added else "none (already up to date)")
