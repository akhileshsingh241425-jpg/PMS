from . import db
from datetime import datetime

class LocationLog(db.Model):
    __tablename__ = 'location_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    lat = db.Column(db.Float, nullable=False)
    lon = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'lat': self.lat,
            'lon': self.lon,
            'accuracy': self.accuracy,
            'recorded_at': self.recorded_at.isoformat() if self.recorded_at else None,
        }
