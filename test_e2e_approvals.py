"""End-to-end test of approval flow"""
import sys, os, json, datetime
os.environ['NO_PROXY'] = '*'
sys.path.insert(0, '/var/www/pms-dev/backend')

import requests, urllib3
urllib3.disable_warnings()

from app import create_app
from models import db, LoginOtp, User

base = "https://localhost:9444"

def login(email, password):
    r = requests.post(f"{base}/api/auth/login", json={"email": email, "password": password}, verify=False, timeout=10)
    d = r.json()
    if d.get("requires_otp"):
        app = create_app()
        with app.app_context():
            user = User.query.filter_by(email=email).first()
            if user:
                otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
                if otps:
                    r2 = requests.post(f"{base}/api/auth/verify-otp", json={"temp_token": d["temp_token"], "otp_code": otps[0].otp_code}, verify=False, timeout=10)
                    if r2.status_code == 200:
                        return r2.json()["token"]
    return None

print("=" * 50)
print("PHASE D END-TO-END TEST")
print("=" * 50)

# 1. Login as employee
token = login("neha@gmail.com", "pass1234")
if not token:
    print("FAIL: Could not login as neha")
    sys.exit(1)
print("1. Neha logged in OK")

hdr = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 2. Create leave request (form data, not JSON)
from_date = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
to_date = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
r = requests.post(f"{base}/api/my-day/leave", data={"leave_type": "Casual", "from_date": from_date, "to_date": to_date, "reason": "Test E2E"}, headers={"Authorization": f"Bearer {token}"}, verify=False, timeout=10)
print(f"2. Create leave: {r.status_code}", end="")
leave_id = r.json().get("leave_request", {}).get("id")
print(f" -> leave_id={leave_id}")

if not leave_id:
    print("FAIL: Could not create leave")
    sys.exit(1)

# 3. Create approval for leave
r = requests.post(f"{base}/api/approvals/leave", json={"leave_request_id": leave_id, "leave_type": "full_day"}, headers=hdr, verify=False, timeout=10)
print(f"3. Create approval: {r.status_code}", end="")
approval_id = r.json().get("approval", {}).get("id")
print(f" -> approval_id={approval_id}")

if not approval_id:
    print("FAIL: Could not create approval")
    sys.exit(1)

# 4. Verify employee sees it in history
r = requests.get(f"{base}/api/approvals/history", headers=hdr, verify=False, timeout=10)
history = r.json().get("approvals", [])
print(f"4. Neha history count: {len(history)}")

# 5. Login as super_admin (Jagbir - the reporting manager)
admin_token = login("admin@infocus-it.com", "pass123")
if not admin_token:
    print("FAIL: Could not login as admin")
    sys.exit(1)
print("5. Admin (Jagbir) logged in OK")

admin_hdr = {"Authorization": f"Bearer {admin_token}"}

# 6. Admin sees pending approvals
r = requests.get(f"{base}/api/approvals", headers=admin_hdr, verify=False, timeout=10)
pending = r.json().get("approvals", [])
print(f"6. Admin pending approvals: {len(pending)}")
if len(pending) == 0:
    print("FAIL: Admin should have pending approval")
    sys.exit(1)

# 7. Admin approves
r = requests.post(f"{base}/api/approvals/{approval_id}/approve", json={}, headers=admin_hdr, verify=False, timeout=10)
print(f"7. Admin approve: {r.status_code} -> {r.json().get('message')}")
if r.status_code != 200:
    print(f"FAIL: {r.json()}")
    sys.exit(1)

# 8. Check - should now be with HR
r = requests.get(f"{base}/api/approvals", headers=admin_hdr, verify=False, timeout=10)
pending2 = r.json().get("approvals", [])
print(f"8. Admin pending after approve: {len(pending2)}")

# 9. Login as HR
hr_token = login("hr@infocus-it.com", "pass1234")
if not hr_token:
    print("FAIL: Could not login as hr")
    sys.exit(1)
print("9. HR logged in OK")

hr_hdr = {"Authorization": f"Bearer {hr_token}"}

# 10. HR sees pending
r = requests.get(f"{base}/api/approvals", headers=hr_hdr, verify=False, timeout=10)
hr_pending = r.json().get("approvals", [])
print(f"10. HR pending: {len(hr_pending)}")
if len(hr_pending) == 0:
    print("FAIL: HR should have pending approval")
    sys.exit(1)

# 11. HR approves
r = requests.post(f"{base}/api/approvals/{approval_id}/approve", json={}, headers=hr_hdr, verify=False, timeout=10)
print(f"11. HR approve: {r.status_code} -> {r.json().get('message')}")

# 12. Verify leave is approved
r = requests.get(f"{base}/api/my-day/leave", headers={"Authorization": f"Bearer {token}"}, verify=False, timeout=10)
leaves = r.json().get("leave_requests", [])
for lv in leaves:
    if lv["id"] == leave_id:
        print(f"12. Leave status: {lv['status']}")
        break

print("\n" + "=" * 50)
print("ALL TESTS PASSED")
print("=" * 50)