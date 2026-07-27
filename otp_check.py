import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp
app = create_app()
with app.app_context():
    otps = LoginOtp.query.filter_by(user_id=23, is_used=False).order_by(LoginOtp.created_at.desc()).all()
    for o in otps:
        print(f"user_id={o.user_id} otp={o.otp_code} used={o.is_used}")