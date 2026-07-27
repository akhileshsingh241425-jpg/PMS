import sys
sys.path.insert(0, '/var/www/pms-dev/backend')

from app import create_app
from models import db, LoginOtp, User

app = create_app()
with app.app_context():
    otps = LoginOtp.query.order_by(LoginOtp.created_at.desc()).limit(5).all()
    for o in otps:
        user = User.query.get(o.user_id)
        email = user.email if user else 'N/A'
        print(f"user_id={o.user_id} email={email} otp={o.otp_code} used={o.is_used}")