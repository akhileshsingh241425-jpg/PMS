from . import db
from datetime import datetime

class AppSetting(db.Model):
    __tablename__ = 'app_settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), nullable=False, unique=True, index=True)
    value = db.Column(db.Text, nullable=False, default='')
    description = db.Column(db.String(500))
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'value': self.value,
            'description': self.description,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

DEFAULT_SETTINGS = {
    'po_out_number_format': {
        'value': 'INFOCUS-IT/PO/{FY}/{VENDOR_CODE}/{N:03d}',
        'description': 'PO OUT number format. Placeholders: {FY}=Financial Year, {VENDOR_CODE}=Vendor code, {N}=Number (use {N:03d} for 3-digit)',
    },
    'po_in_proj_id_format': {
        'value': 'INF/PRJ/{FY}/{N:03d}',
        'description': 'PO IN project ID format. Placeholders: {FY}=Financial Year, {N}=Number (use {N:03d} for 3-digit)',
    },
}
