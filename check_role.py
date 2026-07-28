import requests, urllib3
urllib3.disable_warnings()
base = "https://localhost:9444"

r = requests.post(f"{base}/api/auth/login", json={"email": "admin@infocus-it.com", "password": "pass123"}, verify=False, timeout=5)
d = r.json()

from app import create_app
from models import db, LoginOtp, User
app = create_app()
with app.app_context():
    user = User.query.filter_by(email="admin@infocus-it.com").first()
    otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
    if otps:
        r2 = requests.post(f"{base}/api/auth/verify-otp", json={"temp_token": d["temp_token"], "otp_code": otps[0].otp_code}, verify=False, timeout=5)
        if r2.status_code == 200:
            token = r2.json()["token"]

            # Test PO In list
            r3 = requests.get(f"{base}/api/po-in", headers={"Authorization": f"Bearer {token}"}, verify=False, timeout=5)
            print(f"PO In list: {r3.status_code} po_list={len(r3.json().get('po_list', []))}")

            # Test PO Out list
            r4 = requests.get(f"{base}/api/po-out", headers={"Authorization": f"Bearer {token}"}, verify=False, timeout=5)
            print(f"PO Out list: {r4.status_code} po_list_count={len(r4.json().get('po_list', []))}")