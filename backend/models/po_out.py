from . import db
from datetime import datetime


class POLineItem(db.Model):
    __tablename__ = 'po_line_items'
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    item_name = db.Column(db.String(255), nullable=False)
    sac_hsn = db.Column(db.String(20))
    qty = db.Column(db.Float, default=1)
    rate = db.Column(db.Float, default=0)
    taxable_value = db.Column(db.Float, default=0)
    gst_rate = db.Column(db.Float, default=18)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[po_id], back_populates='line_items')

    def to_dict(self):
        return {
            'id': self.id,
            'po_id': self.po_id,
            'item_name': self.item_name,
            'sac_hsn': self.sac_hsn,
            'qty': self.qty,
            'rate': self.rate,
            'taxable_value': self.taxable_value or (self.qty * self.rate),
            'gst_rate': self.gst_rate,
        }


class TDSRecord(db.Model):
    __tablename__ = 'tds_records'
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    payment_id = db.Column(db.Integer, db.ForeignKey('po_payments.id', ondelete='SET NULL'), nullable=True)
    section = db.Column(db.String(20), nullable=False)
    base_amount = db.Column(db.Float, default=0)
    tds_percent = db.Column(db.Float, default=0)
    tds_amount = db.Column(db.Float, default=0)
    form_16a_issued = db.Column(db.Boolean, default=False)
    form_16a_issued_at = db.Column(db.DateTime)
    quarter = db.Column(db.String(10))
    financial_year = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[po_id], backref='tds_records')
    payment = db.relationship('PoPayment', foreign_keys=[payment_id], backref='tds_record')

    def to_dict(self):
        return {
            'id': self.id,
            'po_id': self.po_id,
            'payment_id': self.payment_id,
            'section': self.section,
            'base_amount': self.base_amount,
            'tds_percent': self.tds_percent,
            'tds_amount': self.tds_amount,
            'form_16a_issued': self.form_16a_issued,
            'form_16a_issued_at': self.form_16a_issued_at.isoformat() if self.form_16a_issued_at else None,
            'quarter': self.quarter,
            'financial_year': self.financial_year,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class POVersion(db.Model):
    __tablename__ = 'po_versions'
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    revision_number = db.Column(db.Integer, default=1)
    pdf_path = db.Column(db.String(500))
    reason = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[po_id], backref='po_versions')
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'po_id': self.po_id,
            'revision_number': self.revision_number,
            'pdf_path': self.pdf_path,
            'reason': self.reason,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
