from . import db, bcrypt
from datetime import datetime


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    emp_id = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    designation = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user')  # admin, user, client
    department = db.Column(db.String(100))
    # Client-specific fields (when role='client')
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    client_company_name = db.Column(db.String(255))
    # Common
    reset_token = db.Column(db.String(255))
    reset_token_expiry = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name or ""}'.strip()

    def to_dict(self):
        return {
            'id': self.id,
            'emp_id': self.emp_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'designation': self.designation,
            'role': self.role,
            'department': self.department,
            'account_id': self.account_id,
            'client_company_name': self.client_company_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
