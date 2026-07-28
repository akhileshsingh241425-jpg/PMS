from . import db
from datetime import datetime

HOLIDAY_TYPES = ['Public', 'Optional', 'Company']


class Holiday(db.Model):
    """Company holiday calendar. Used to classify a date as non-working so that
    employees are not counted Absent on it."""
    __tablename__ = 'holidays'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True, index=True)
    name = db.Column(db.String(150), nullable=False)
    holiday_type = db.Column(db.String(20), default='Public')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'name': self.name,
            'holiday_type': self.holiday_type,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
