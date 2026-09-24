import requests

BASE = "http://127.0.0.1:5000/api"
PHONE = "9876543210"


def show(title, r):
    print(f"\n== {title} (HTTP {r.status_code})")
    try:
        print(r.json())
    except ValueError:
        print(r.text[:300])


r = requests.post(f"{BASE}/register", json={
    "name": "Test Farmer", "phone": PHONE, "state": "Bihar",
    "district": "Patna", "crop": "Wheat", "language": "en"})
show("register (409 = already registered, that is fine)", r)

r = requests.post(f"{BASE}/login/request", json={"phone": PHONE})
show("login/request", r)
otp = r.json().get("demo_otp")

r = requests.post(f"{BASE}/login/verify", json={"phone": PHONE, "otp": otp})
show("login/verify", r)
token = r.json().get("token")
if not token:
    raise SystemExit("Login failed. Fix that first.")
headers = {"Authorization": f"Bearer {token}"}

r = requests.post(f"{BASE}/chat", json={"message": "Should I sow wheat now?"}, headers=headers)
show("chat", r)

r = requests.get(f"{BASE}/chat/history", headers=headers)
show("history", r)