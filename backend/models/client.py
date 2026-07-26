from . import db
from datetime import datetime


class SectorMaster(db.Model):
    __tablename__ = 'sector_masters'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'is_active': self.is_active}


class VendorCategoryMaster(db.Model):
    __tablename__ = 'vendor_category_masters'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'is_active': self.is_active}


CLIENT_STATUSES = ['PROSPECT', 'ACTIVE', 'DORMANT', 'HOLD', 'BLACKLISTED', 'ARCHIVED']
CLIENT_TYPES = ['main', 'sub', 'vendor', 'both']


class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    client_code = db.Column(db.String(20), unique=True, nullable=False)
    business_type = db.Column(db.String(10))  # B2B / B2C
    client_category = db.Column(db.String(50))  # sector
    vendor_category = db.Column(db.String(50))
    gst_number = db.Column(db.String(50))
    gst_unregistered = db.Column(db.Boolean, default=False)
    location = db.Column(db.String(100))
    registered_address = db.Column(db.Text)
    state = db.Column(db.String(50))
    state_code = db.Column(db.String(10))
    website = db.Column(db.String(255))
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    industry = db.Column(db.String(100))
    status = db.Column(db.String(20), default='PROSPECT')
    client_type = db.Column(db.String(20), default='main')
    parent_client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    pan_no = db.Column(db.String(20))
    cin_number = db.Column(db.String(50))
    msme_status = db.Column(db.String(20))
    nda_file_path = db.Column(db.String(500))
    nda_validity = db.Column(db.Date)
    payment_terms = db.Column(db.String(100))
    credit_limit = db.Column(db.Float)
    bank_account_no = db.Column(db.String(50))
    bank_ifsc = db.Column(db.String(20))
    bank_cheque_path = db.Column(db.String(500))
    default_tds_section = db.Column(db.String(20))
    reference_source = db.Column(db.String(50))
    referring_client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    account_owner_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_independent = db.Column(db.Boolean, default=False)
    b2c_mobile = db.Column(db.String(20))
    b2c_id_proof_type = db.Column(db.String(30))
    b2c_id_proof_number = db.Column(db.String(50))
    status_changed_at = db.Column(db.DateTime)
    first_follow_up_date = db.Column(db.Date)
    onboarding_remarks = db.Column(db.Text)
    blacklist_reason = db.Column(db.Text)
    business_value = db.Column(db.Float, default=0)
    last_business_date = db.Column(db.Date)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    parent = db.relationship('Client', foreign_keys=[parent_client_id], remote_side='Client.id', backref='sub_clients')
    referring_client = db.relationship('Client', foreign_keys=[referring_client_id], remote_side='Client.id')
    account_owner = db.relationship('User', foreign_keys=[account_owner_id])

    contacts = db.relationship('ClientContact', backref='client', lazy='dynamic', cascade='all, delete-orphan')
    remarks = db.relationship('ClientRemark', backref='client', lazy='dynamic', cascade='all, delete-orphan', order_by='ClientRemark.created_at.desc()')
    follow_ups = db.relationship('ClientFollowUp', backref='client', lazy='dynamic', cascade='all, delete-orphan', order_by='ClientFollowUp.date.asc()')
    change_logs = db.relationship('ClientChangeLog', backref='client', lazy='dynamic', cascade='all, delete-orphan', order_by='ClientChangeLog.changed_at.desc()')
    referrals_given = db.relationship('ClientReference', foreign_keys='ClientReference.client_id', backref='referrer', lazy='dynamic', cascade='all, delete-orphan')
    referrals_received = db.relationship('ClientReference', foreign_keys='ClientReference.referred_client_id', backref='referred_client', lazy='dynamic')

    def generate_cid(self):
        if self.client_type == 'vendor':
            prefix = 'VN-'
        elif self.client_type == 'both':
            prefix = 'CID-BOTH-'
        elif self.business_type == 'B2C':
            prefix = 'CID-B2C-'
        else:
            prefix = 'CID-B2B-'
        last = db.session.query(db.func.max(Client.client_code)).filter(
            Client.client_code.like(f'{prefix}%')).scalar()
        last_num = 0
        if last:
            try:
                last_num = int(last.replace(prefix, ''))
            except ValueError:
                pass
        return f'{prefix}{str(last_num + 1).zfill(4)}'

    def to_dict(self, include_sub=True):
        d = {
            'id': self.id,
            'name': self.name,
            'client_code': self.client_code,
            'business_type': self.business_type,
            'client_category': self.client_category,
            'vendor_category': self.vendor_category,
            'gst_number': self.gst_number,
            'gst_unregistered': self.gst_unregistered,
            'location': self.location,
            'registered_address': self.registered_address,
            'state': self.state,
            'state_code': self.state_code,
            'website': self.website,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'industry': self.industry,
            'status': self.status,
            'client_type': self.client_type,
            'parent_client_id': self.parent_client_id,
            'pan_no': self.pan_no,
            'cin_number': self.cin_number,
            'msme_status': self.msme_status,
            'nda_file_path': self.nda_file_path,
            'nda_validity': self.nda_validity.isoformat() if self.nda_validity else None,
            'payment_terms': self.payment_terms,
            'credit_limit': self.credit_limit,
            'bank_account_no': self.bank_account_no,
            'bank_ifsc': self.bank_ifsc,
            'bank_cheque_path': self.bank_cheque_path,
            'default_tds_section': self.default_tds_section,
            'reference_source': self.reference_source,
            'referring_client_id': self.referring_client_id,
            'referring_client_name': self.referring_client.name if self.referring_client else None,
            'account_owner_id': self.account_owner_id,
            'account_owner_name': self.account_owner.full_name if self.account_owner else None,
            'is_independent': self.is_independent,
            'b2c_mobile': self.b2c_mobile,
            'b2c_id_proof_type': self.b2c_id_proof_type,
            'b2c_id_proof_number': self.b2c_id_proof_number,
            'status_changed_at': self.status_changed_at.isoformat() if self.status_changed_at else None,
            'first_follow_up_date': self.first_follow_up_date.isoformat() if self.first_follow_up_date else None,
            'onboarding_remarks': self.onboarding_remarks,
            'blacklist_reason': self.blacklist_reason,
            'business_value': self.business_value,
            'last_business_date': self.last_business_date.isoformat() if self.last_business_date else None,
            'sub_clients': [s.to_dict(include_sub=False) for s in self.sub_clients] if include_sub else [],
            'contact_count': self.contacts.count(),
            'remark_count': self.remarks.count(),
            'follow_up_count': self.follow_ups.count(),
        }
        return d


class ClientContact(db.Model):
    __tablename__ = 'client_contacts'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    designation = db.Column(db.String(100))
    mobile = db.Column(db.String(20))
    email = db.Column(db.String(255))
    role = db.Column(db.String(30))  # primary / accounts / technical / escalation
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'client_id': self.client_id,
            'name': self.name, 'designation': self.designation,
            'mobile': self.mobile, 'email': self.email,
            'role': self.role, 'is_primary': self.is_primary,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ClientRemark(db.Model):
    __tablename__ = 'client_remarks'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'client_id': self.client_id,
            'text': self.text, 'is_pinned': self.is_pinned,
            'author_name': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


FOLLOWUP_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED']


class ClientFollowUp(db.Model):
    __tablename__ = 'client_follow_ups'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False)
    purpose = db.Column(db.String(100), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    status = db.Column(db.String(20), default='PENDING')
    outcome_remark = db.Column(db.Text)
    completed_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'client_id': self.client_id,
            'date': self.date.isoformat() if self.date else None,
            'purpose': self.purpose,
            'assigned_to': self.assigned_to,
            'assignee_name': self.assignee.full_name if self.assignee else None,
            'status': self.status,
            'outcome_remark': self.outcome_remark,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ClientChangeLog(db.Model):
    __tablename__ = 'client_change_logs'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    field_name = db.Column(db.String(50), nullable=False)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    needs_approval = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    approved_at = db.Column(db.DateTime)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    changer = db.relationship('User', foreign_keys=[changed_by])
    approver = db.relationship('User', foreign_keys=[approved_by])

    def to_dict(self):
        return {
            'id': self.id, 'client_id': self.client_id,
            'field_name': self.field_name,
            'old_value': self.old_value, 'new_value': self.new_value,
            'needs_approval': self.needs_approval,
            'approved_by_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'changed_by_name': self.changer.full_name if self.changer else None,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
        }


class ClientReference(db.Model):
    __tablename__ = 'client_references'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    referred_client_id = db.Column(db.Integer, db.ForeignKey('clients.id', ondelete='CASCADE'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('client_id', 'referred_client_id'),)

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'client_name': self.referrer.name if self.referrer else None,
            'referred_client_id': self.referred_client_id,
            'referred_client_name': self.referred_client.name if self.referred_client else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
