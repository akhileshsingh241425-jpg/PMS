from datetime import datetime, timedelta
import random
from . import db

class LoginOtp(db.Model):
    __tablename__ = 'login_otps'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    otp_code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False)

    user = db.relationship('User', foreign_keys=[user_id])

    @staticmethod
    def create_for_user(user_id):
        code = str(random.randint(100000, 999999))
        otp = LoginOtp(
            user_id=user_id,
            otp_code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=5)
        )
        db.session.add(otp)
        db.session.commit()
        return otp

    def is_valid(self):
        return not self.is_used and self.expires_at > datetime.utcnow()