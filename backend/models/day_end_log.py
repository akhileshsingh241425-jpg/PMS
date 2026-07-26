from . import db
from datetime import datetime


class DayEndLog(db.Model):
    __tablename__ = 'day_end_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    entries = db.Column(db.JSON, nullable=False)
    total_hours = db.Column(db.Float, nullable=False)
    checked_out_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (db.UniqueConstraint('user_id', 'date'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'date': self.date.isoformat() if self.date else None,
            'entries': self.entries,
            'total_hours': self.total_hours,
            'checked_out_at': self.checked_out_at.isoformat() if self.checked_out_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
