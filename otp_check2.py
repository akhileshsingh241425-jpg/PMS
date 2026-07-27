import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, LoginOtp, User
app = create_app()
with app.app_context():
    user = User.query.filter_by(email="neha@gmail.com").first()
    if user:
        otps = LoginOtp.query.filter_by(user_id=user.id, is_used=False).order_by(LoginOtp.created_at.desc()).all()
        for o in otps:
            print(f"user_id={o.user_id} otp={o.otp_code} used={o.is_used}")