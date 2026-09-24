import requests

BASE = "http://127.0.0.1:5000/api"

# Two farmers in the same district with different crops
for name, phone, crop in [("Test Farmer", "9876543210", "Wheat"),
                          ("Rice Farmer", "9123456780", "Rice (Paddy)")]:
    requests.post(f"{BASE}/register", json={"name": name, "phone": phone, "state": "Bihar",
                                            "district": "Patna", "crop": crop, "language": "en"})

r = requests.post(f"{BASE}/login/request", json={"phone": "9876543210"})
r = requests.post(f"{BASE}/login/verify", json={"phone": "9876543210", "otp": r.json()["demo_otp"]})
headers = {"Authorization": f"Bearer {r.json()['token']}"}

storm = {"district": "Patna", "ignore_dedup": True,
         "weather": {"rain_24h": 90, "temp_max_5d": 42}}
r = requests.post(f"{BASE}/alerts/simulate", json=storm, headers=headers)
print("\n== simulate: heavy rain + heatwave (HTTP", r.status_code, ")")
for a in r.json().get("sent", []):
    print(f"- {a['farmer']} ({a['crop']}): {a['event']} -> {a['effect']}\n    {a['message']}")

storm["ignore_dedup"] = False
r = requests.post(f"{BASE}/alerts/simulate", json=storm, headers=headers)
print("\n== same again, duplicate check: sent", r.json().get("count"), "(expect 0)")

r = requests.get(f"{BASE}/alerts", headers=headers)
print("\n== Test Farmer's alert list:", len(r.json()), "alert(s)")