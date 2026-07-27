import requests
import json
import urllib3
import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp, User

urllib3.disable_warnings()

# Get OTP from DB
app = create_app()
with app.app_context():
    user = User.query.filter_by(email="neha@gmail.com").first()
    if user:
        otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
        for o in otps:
            print(f"OTP for neha: {o.otp_code}")

base = "https://localhost:9444"

# Login as employee
login = {"email": "neha@gmail.com", "password": "pass1234"}
r = requests.post(f"{base}/api/auth/login", json=login, verify=False)
print("Employee login:", r.status_code, r.json())