from . import db
from datetime import datetime

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    clock_in = db.Column(db.DateTime, nullable=False)
    clock_out = db.Column(db.DateTime)
    location_lat = db.Column(db.Float)
    location_lon = db.Column(db.Float)
    location_name = db.Column(db.String(255))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='SET NULL'), index=True)
    status = db.Column(db.String(20), default='Present')
    work_description = db.Column(db.Text)
    face_image_path = db.Column(db.String(500))
    face_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        def _fmt(dt):
            return dt.strftime('%Y-%m-%dT%H:%M:%SZ') if dt else None
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'user_email': self.user.email if self.user else None,
            'date': self.date.isoformat() if self.date else None,
            'clock_in': _fmt(self.clock_in),
            'clock_out': _fmt(self.clock_out),
            'location_lat': self.location_lat,
            'location_lon': self.location_lon,
            'location_name': self.location_name,
            'project_id': self.project_id,
            'project_name': self.project.title if self.project else None,
            'status': self.status,
            'work_description': self.work_description,
            'face_image_path': self.face_image_path,
            'face_verified': self.face_verified,
            'duration': (self.clock_out - self.clock_in).total_seconds() / 3600 if self.clock_in and self.clock_out else None,
            'created_at': _fmt(self.created_at),
        }
