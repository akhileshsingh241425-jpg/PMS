from . import db
from datetime import datetime


class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    client_code = db.Column(db.String(20), unique=True, nullable=False)
    gst_number = db.Column(db.String(50))
    location = db.Column(db.String(100))
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    industry = db.Column(db.String(100))
    status = db.Column(db.String(20), default='Active')
    client_type = db.Column(db.String(20), default='main')
    parent_client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = db.relationship('Client', foreign_keys=[parent_client_id], remote_side='Client.id', backref='sub_clients')

    def to_dict(self, include_sub=True):
        d = {
            'id': self.id,
            'name': self.name,
            'client_code': self.client_code,
            'gst_number': self.gst_number,
            'location': self.location,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'industry': self.industry,
            'status': self.status,
            'client_type': self.client_type,
            'parent_client_id': self.parent_client_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_sub:
            d['sub_clients'] = [s.to_dict(include_sub=False) for s in self.sub_clients]
        return d
