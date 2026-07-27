from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Client, ClientContact, ClientRemark, ClientFollowUp, ClientChangeLog, ClientReference, SectorMaster, Project
from middleware.auth import login_required

client_bp = Blueprint('clients', __name__, url_prefix='/api/clients')

SENSITIVE_FIELDS = {'bank_account_no', 'bank_ifsc', 'bank_cheque_path', 'gst_number', 'pan_no', 'parent_client_id'}


def _log_change(client, field, old_val, new_val, user, needs_approval=False):
    log = ClientChangeLog(
        client_id=client.id, field_name=field,
        old_value=str(old_val) if old_val is not None else None,
        new_value=str(new_val) if new_val is not None else None,
        needs_approval=needs_approval, changed_by=user.id,
    )
    db.session.add(log)


@client_bp.route('', methods=['GET'])
@login_required
def list_clients(current_user):
    query = Client.query
    filter_param = request.args.get('filter', 'all')
    if filter_param == 'vendor':
        query = query.filter(Client.client_type.in_(['vendor', 'both']))
    elif filter_param == 'client':
        query = query.filter(Client.client_type.in_(['main', 'sub', 'both']))
    elif filter_param == 'main':
        query = query.filter_by(client_type='main')
    elif filter_param == 'sub':
        query = query.filter_by(client_type='sub')
    elif filter_param == 'both':
        query = query.filter_by(client_type='both')

    if s := request.args.get('search'):
        query = query.filter(db.or_(
            Client.name.ilike(f'%{s}%'), Client.client_code.ilike(f'%{s}%'),
            Client.gst_number.ilike(f'%{s}%'), Client.contact_phone.ilike(f'%{s}%'),
            Client.contact_email.ilike(f'%{s}%'), Client.pan_no.ilike(f'%{s}%'),
        ))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    if bt := request.args.get('business_type'):
        query = query.filter_by(business_type=bt)
    if cat := request.args.get('category'):
        query = query.filter(db.or_(Client.client_category == cat, Client.vendor_category == cat))
    if ao := request.args.get('account_owner'):
        query = query.filter_by(account_owner_id=int(ao))
    if fu := request.args.get('follow_up'):
        today = datetime.utcnow().date()
        if fu == 'overdue':
            query = query.filter(Client.first_follow_up_date < today)
        elif fu == 'today':
            query = query.filter(Client.first_follow_up_date == today)
        elif fu == 'week':
            from datetime import timedelta
            query = query.filter(Client.first_follow_up_date.between(today, today + timedelta(days=7)))

    query = query.order_by(Client.updated_at.desc())
    clients = query.all()

    cids = [c.id for c in clients]
    proj_counts = dict(db.session.query(Project.client_id, db.func.count(Project.id)).filter(Project.client_id.in_(cids)).group_by(Project.client_id).all()) if cids else {}

    result = []
    for c in clients:
        data = c.to_dict()
        data['project_count'] = proj_counts.get(c.id, 0)
        result.append(data)

    return jsonify({
        'clients': result,
        'summary': {
            'total': Client.query.count(),
            'active': Client.query.filter_by(status='ACTIVE').count(),
            'prospect': Client.query.filter_by(status='PROSPECT').count(),
            'dormant': Client.query.filter_by(status='DORMANT').count(),
            'client': Client.query.filter(Client.client_type.in_(['main', 'sub'])).count(),
            'vendor': Client.query.filter(Client.client_type.in_(['vendor', 'both'])).count(),
        },
        'sectors': [s.name for s in SectorMaster.query.filter_by(is_active=True).all()],
    })


@client_bp.route('/summary', methods=['GET'])
@login_required
def client_summary(current_user):
    return jsonify({
        'total': Client.query.count(),
        'active': Client.query.filter_by(status='ACTIVE').count(),
        'prospect': Client.query.filter_by(status='PROSPECT').count(),
        'dormant': Client.query.filter_by(status='DORMANT').count(),
        'blacklisted': Client.query.filter_by(status='BLACKLISTED').count(),
        'vendors': Client.query.filter(Client.client_type.in_(['vendor', 'both'])).count(),
    })


@client_bp.route('/check-duplicate', methods=['POST'])
@login_required
def check_duplicate(current_user):
    data = request.get_json() or {}
    conditions = []
    if gst := data.get('gst_number'):
        conditions.append(Client.gst_number == gst)
    if pan := data.get('pan_no'):
        conditions.append(Client.pan_no == pan)
    if name := data.get('name'):
        conditions.append(db.func.lower(Client.name) == name.lower())
    if phone := data.get('contact_phone'):
        conditions.append(Client.contact_phone == phone)
    if not conditions:
        return jsonify({'match': False, 'matches': []})
    matches = Client.query.filter(db.or_(*conditions)).all()
    return jsonify({'match': len(matches) > 0, 'matches': [m.to_dict() for m in matches]})


@client_bp.route('', methods=['POST'])
@login_required
def create_client(current_user):
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'name required'}), 400

    business_type = data.get('business_type', 'B2B')
    client_type = data.get('client_type', 'main')

    # Reference mandatory for B2B
    if business_type == 'B2B' and not data.get('reference_source'):
        return jsonify({'error': 'reference_source is required for B2B clients'}), 400

    # Parent mandatory for non-independent B2B
    parent_client_id = data.get('parent_client_id') or None
    is_independent = data.get('is_independent', False)
    if business_type == 'B2B' and client_type != 'vendor' and not parent_client_id and not is_independent:
        return jsonify({'error': 'parent_client_id or is_independent=true required for B2B clients'}), 400

    client = Client(
        name=data['name'], client_code=None,
        business_type=business_type,
        client_category=data.get('client_category'),
        vendor_category=data.get('vendor_category'),
        gst_number=data.get('gst_number'),
        gst_unregistered=data.get('gst_unregistered', False),
        location=data.get('location'),
        registered_address=data.get('registered_address'),
        state=data.get('state'), state_code=data.get('state_code'),
        website=data.get('website'),
        contact_name=data.get('contact_name'), contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'), industry=data.get('industry'),
        status=data.get('status', 'PROSPECT'),
        client_type=client_type,
        parent_client_id=parent_client_id,
        is_independent=is_independent,
        pan_no=data.get('pan_no'), cin_number=data.get('cin_number'),
        msme_status=data.get('msme_status'),
        nda_file_path=data.get('nda_file_path'),
        nda_validity=datetime.strptime(data['nda_validity'], '%Y-%m-%d').date() if data.get('nda_validity') else None,
        payment_terms=data.get('payment_terms'), credit_limit=data.get('credit_limit'),
        bank_account_no=data.get('bank_account_no'), bank_ifsc=data.get('bank_ifsc'),
        bank_cheque_path=data.get('bank_cheque_path'),
        default_tds_section=data.get('default_tds_section'),
        reference_source=data.get('reference_source'),
        referring_client_id=data.get('referring_client_id') or None,
        account_owner_id=data.get('account_owner_id') or current_user.id,
        b2c_mobile=data.get('b2c_mobile'),
        b2c_id_proof_type=data.get('b2c_id_proof_type'),
        b2c_id_proof_number=data.get('b2c_id_proof_number'),
        first_follow_up_date=datetime.strptime(data['first_follow_up_date'], '%Y-%m-%d').date() if data.get('first_follow_up_date') else None,
        onboarding_remarks=data.get('onboarding_remarks'),
    )
    db.session.add(client)
    db.session.flush()
    client.client_code = client.generate_cid()

    if data.get('contact_name'):
        db.session.add(ClientContact(client_id=client.id, name=data['contact_name'],
            email=data.get('contact_email'), mobile=data.get('contact_phone'),
            role='primary', is_primary=True))

    for c in data.get('contacts', []):
        db.session.add(ClientContact(client_id=client.id, **{k: v for k, v in c.items() if k in ('name', 'designation', 'mobile', 'email', 'role', 'is_primary')}))

    if data.get('referring_client_id'):
        ref = ClientReference(client_id=data['referring_client_id'], referred_client_id=client.id)
        db.session.add(ref)

    db.session.commit()
    return jsonify({'message': 'Created', 'client': client.to_dict()}), 201


@client_bp.route('/<int:cid>', methods=['GET'])
@login_required
def get_client(current_user, cid):
    client = Client.query.get_or_404(cid)
    data = client.to_dict()
    data['project_count'] = Project.query.filter_by(client_id=cid).count()
    data['projects'] = [p.to_dict() for p in Project.query.filter(Project.client_id == cid, Project.direction == 'IN', Project.po_in_status.is_(None)).order_by(Project.updated_at.desc()).all()]
    data['po_in_list'] = [p.to_dict() for p in Project.query.filter(Project.client_id == cid, Project.direction == 'IN', Project.po_in_status.isnot(None)).order_by(Project.updated_at.desc()).all()]
    data['po_out_list'] = [p.to_dict() for p in Project.query.filter(Project.client_id == cid, Project.direction == 'OUT').order_by(Project.updated_at.desc()).all()]
    data['contacts'] = [c.to_dict() for c in client.contacts.order_by(ClientContact.is_primary.desc()).all()]
    data['remarks'] = [r.to_dict() for r in client.remarks.order_by(ClientRemark.is_pinned.desc(), ClientRemark.created_at.desc()).all()]
    data['follow_ups'] = [f.to_dict() for f in client.follow_ups.all()]
    data['change_logs'] = [l.to_dict() for l in client.change_logs.all()]
    data['referrals_given'] = [r.to_dict() for r in client.referrals_given.all()]
    data['referrals_received'] = [r.to_dict() for r in client.referrals_received.all()]
    return jsonify({'client': data})


@client_bp.route('/<int:cid>/export', methods=['GET'])
@login_required
def export_client(current_user, cid):
    import csv, io
    client = Client.query.get_or_404(cid)
    output = io.StringIO()
    w = csv.writer(output)

    w.writerow(['Field', 'Value'])
    for field, value in [
        ('Client Code', client.client_code),
        ('Name', client.name),
        ('Type', 'Both' if client.client_type == 'both' else ('Vendor' if client.client_type == 'vendor' else (client.business_type or ''))),
        ('Category', client.client_category or ''),
        ('Vendor Category', client.vendor_category or ''),
        ('Industry', client.industry or ''),
        ('Status', client.status),
        ('Contact Person', client.contact_name or ''),
        ('Contact Email', client.contact_email or ''),
        ('Contact Phone', client.contact_phone or ''),
        ('Location', client.location or ''),
        ('State', client.state or ''),
        ('State Code', client.state_code or ''),
        ('Registered Address', client.registered_address or ''),
        ('Website', client.website or ''),
        ('GST Number', client.gst_number or ('Unregistered' if client.gst_unregistered else '')),
        ('PAN', client.pan_no or ''),
        ('CIN', client.cin_number or ''),
        ('MSME Status', client.msme_status or ''),
        ('Default TDS Section', client.default_tds_section or ''),
        ('NDA Valid Till', client.nda_validity.isoformat() if client.nda_validity else ''),
        ('Payment Terms', client.payment_terms or ''),
        ('Credit Limit', client.credit_limit or ''),
        ('Bank Account No', client.bank_account_no or ''),
        ('Bank IFSC', client.bank_ifsc or ''),
        ('Reference Source', client.reference_source or ''),
        ('Referring Client', client.referring_client.name if client.referring_client else ''),
        ('Account Owner', client.account_owner.full_name if client.account_owner else ''),
        ('First Follow-up Date', client.first_follow_up_date.isoformat() if client.first_follow_up_date else ''),
        ('Business Value', client.business_value or 0),
        ('Last Business Date', client.last_business_date.isoformat() if client.last_business_date else ''),
    ]:
        w.writerow([field, value])

    contacts = client.contacts.order_by(ClientContact.is_primary.desc()).all()
    if contacts:
        w.writerow([])
        w.writerow(['Contacts'])
        w.writerow(['Name', 'Designation', 'Email', 'Phone', 'Role', 'Primary'])
        for c in contacts:
            w.writerow([c.name, c.designation or '', c.email or '', c.mobile or '', c.role or '', 'Yes' if c.is_primary else ''])

    remarks = client.remarks.order_by(ClientRemark.created_at.desc()).all()
    if remarks:
        w.writerow([])
        w.writerow(['Remarks'])
        w.writerow(['Date', 'Author', 'Text'])
        for r in remarks:
            w.writerow([r.created_at.strftime('%Y-%m-%d %H:%M') if r.created_at else '', r.author.full_name if r.author else '', r.text])

    follow_ups = client.follow_ups.all()
    if follow_ups:
        w.writerow([])
        w.writerow(['Follow-ups'])
        w.writerow(['Date', 'Purpose', 'Assignee', 'Status', 'Outcome'])
        for f in follow_ups:
            w.writerow([f.date.isoformat() if f.date else '', f.purpose, f.assignee.full_name if f.assignee else '', f.status, f.outcome_remark or ''])

    filename = f'{client.client_code}-{client.name}'.replace(' ', '_').replace('/', '-') + '.csv'
    return output.getvalue(), 200, {'Content-Type': 'text/csv', 'Content-Disposition': f'attachment; filename="{filename}"'}


@client_bp.route('/<int:cid>', methods=['PATCH'])
@login_required
def update_client(current_user, cid):
    client = Client.query.get_or_404(cid)
    data = request.get_json()
    allowed = ['name', 'business_type', 'client_category', 'vendor_category', 'gst_number',
        'gst_unregistered', 'location', 'registered_address', 'state', 'state_code', 'website',
        'contact_name', 'contact_email', 'contact_phone', 'industry', 'status', 'client_type',
        'parent_client_id', 'is_independent', 'pan_no', 'cin_number', 'msme_status',
        'payment_terms', 'credit_limit',
        'bank_account_no', 'bank_ifsc', 'default_tds_section', 'reference_source',
        'account_owner_id', 'onboarding_remarks', 'nda_file_path', 'bank_cheque_path',
        'referring_client_id', 'blacklist_reason', 'business_value', 'last_business_date',
        'b2c_mobile', 'b2c_id_proof_type', 'b2c_id_proof_number']
    for f in allowed:
        if f in data:
            old_val = getattr(client, f)
            new_val = data[f]
            if str(old_val) != str(new_val):
                needs_approval = f in SENSITIVE_FIELDS and current_user.role not in ('admin', 'super_admin')
                _log_change(client, f, old_val, new_val, current_user, needs_approval)
                setattr(client, f, new_val)
                if f == 'status':
                    client.status_changed_at = datetime.utcnow()
    if 'nda_validity' in data:
        client.nda_validity = datetime.strptime(data['nda_validity'], '%Y-%m-%d').date() if data.get('nda_validity') else None
    if 'first_follow_up_date' in data:
        client.first_follow_up_date = datetime.strptime(data['first_follow_up_date'], '%Y-%m-%d').date() if data.get('first_follow_up_date') else None
    try:
        db.session.commit()
        return jsonify({'client': client.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@client_bp.route('/<int:cid>', methods=['DELETE'])
@login_required
def delete_client(current_user, cid):
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    client = Client.query.get_or_404(cid)
    Client.query.filter_by(parent_client_id=cid).update({Client.parent_client_id: None})
    Client.query.filter_by(referring_client_id=cid).update({Client.referring_client_id: None})
    db.session.delete(client)
    try:
        db.session.commit()
        return jsonify({'message': 'Deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@client_bp.route('/<int:cid>/merge', methods=['POST'])
@login_required
def merge_clients(current_user, cid):
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    target = Client.query.get_or_404(cid)
    data = request.get_json()
    merge_id = data.get('merge_client_id')
    if not merge_id or merge_id == cid:
        return jsonify({'error': 'Valid merge_client_id required'}), 400
    source = Client.query.get(merge_id)
    if not source:
        return jsonify({'error': 'Source client not found'}), 404
    Project.query.filter_by(client_id=source.id).update({'client_id': target.id})
    Project.query.filter_by(vendor_name=source.name).update({'vendor_name': target.name})
    for r in source.remarks.all():
        r.client_id = target.id
    for f in source.follow_ups.all():
        f.client_id = target.id
    for l in source.change_logs.all():
        l.client_id = target.id
    for c in source.contacts.all():
        c.client_id = target.id
    _log_change(target, 'merged_from', None, source.name, current_user)
    db.session.delete(source)
    db.session.commit()
    return jsonify({'message': f'Merged {source.name} into {target.name}', 'client': target.to_dict()})


@client_bp.route('/<int:cid>/contacts', methods=['GET'])
@login_required
def list_contacts(current_user, cid):
    client = Client.query.get_or_404(cid)
    return jsonify({'contacts': [c.to_dict() for c in client.contacts.order_by(ClientContact.is_primary.desc()).all()]})


@client_bp.route('/<int:cid>/contacts', methods=['POST'])
@login_required
def create_contact(current_user, cid):
    Client.query.get_or_404(cid)
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'name required'}), 400
    if data.get('is_primary'):
        ClientContact.query.filter_by(client_id=cid, is_primary=True).update({'is_primary': False})
    contact = ClientContact(client_id=cid, **{k: v for k, v in data.items() if k in ('name', 'designation', 'mobile', 'email', 'role', 'is_primary')})
    db.session.add(contact)
    db.session.commit()
    return jsonify({'contact': contact.to_dict()}), 201


@client_bp.route('/<int:cid>/contacts/<int:coid>', methods=['PUT'])
@login_required
def update_contact(current_user, cid, coid):
    contact = ClientContact.query.get_or_404(coid)
    if contact.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    data = request.get_json()
    if data.get('is_primary'):
        ClientContact.query.filter_by(client_id=cid, is_primary=True).update({'is_primary': False})
    for f in ('name', 'designation', 'mobile', 'email', 'role', 'is_primary'):
        if f in data:
            setattr(contact, f, data[f])
    db.session.commit()
    return jsonify({'contact': contact.to_dict()})


@client_bp.route('/<int:cid>/contacts/<int:coid>', methods=['DELETE'])
@login_required
def delete_contact(current_user, cid, coid):
    contact = ClientContact.query.get_or_404(coid)
    if contact.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    db.session.delete(contact)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@client_bp.route('/<int:cid>/remarks', methods=['GET'])
@login_required
def list_remarks(current_user, cid):
    client = Client.query.get_or_404(cid)
    return jsonify({'remarks': [r.to_dict() for r in client.remarks.order_by(ClientRemark.is_pinned.desc(), ClientRemark.created_at.desc()).all()]})


@client_bp.route('/<int:cid>/remarks', methods=['POST'])
@login_required
def create_remark(current_user, cid):
    Client.query.get_or_404(cid)
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    remark = ClientRemark(client_id=cid, text=data['text'], is_pinned=data.get('is_pinned', False), created_by=current_user.id)
    db.session.add(remark)
    db.session.commit()
    return jsonify({'remark': remark.to_dict()}), 201


@client_bp.route('/<int:cid>/remarks/<int:rid>', methods=['PUT'])
@login_required
def update_remark(current_user, cid, rid):
    remark = ClientRemark.query.get_or_404(rid)
    if remark.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    data = request.get_json()
    if 'text' in data:
        remark.text = data['text']
    if 'is_pinned' in data:
        remark.is_pinned = data['is_pinned']
    db.session.commit()
    return jsonify({'remark': remark.to_dict()})


@client_bp.route('/<int:cid>/remarks/<int:rid>', methods=['DELETE'])
@login_required
def delete_remark(current_user, cid, rid):
    remark = ClientRemark.query.get_or_404(rid)
    if remark.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    db.session.delete(remark)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@client_bp.route('/<int:cid>/follow-ups', methods=['GET'])
@login_required
def list_follow_ups(current_user, cid):
    client = Client.query.get_or_404(cid)
    return jsonify({'follow_ups': [f.to_dict() for f in client.follow_ups.order_by(ClientFollowUp.date.asc()).all()]})


@client_bp.route('/<int:cid>/follow-ups', methods=['POST'])
@login_required
def create_follow_up(current_user, cid):
    Client.query.get_or_404(cid)
    data = request.get_json()
    if not data or not data.get('date') or not data.get('purpose'):
        return jsonify({'error': 'date and purpose required'}), 400
    fu = ClientFollowUp(client_id=cid,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        purpose=data['purpose'], assigned_to=data.get('assigned_to') or current_user.id,
        created_by=current_user.id)
    db.session.add(fu)
    db.session.commit()
    return jsonify({'follow_up': fu.to_dict()}), 201


@client_bp.route('/<int:cid>/follow-ups/<int:fid>', methods=['PUT'])
@login_required
def update_follow_up(current_user, cid, fid):
    fu = ClientFollowUp.query.get_or_404(fid)
    if fu.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    data = request.get_json()
    for f in ('date', 'purpose', 'assigned_to', 'status'):
        if f in data:
            if f == 'date':
                fu.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            else:
                setattr(fu, f, data[f])
    db.session.commit()
    return jsonify({'follow_up': fu.to_dict()})


@client_bp.route('/<int:cid>/follow-ups/<int:fid>/complete', methods=['POST'])
@login_required
def complete_follow_up(current_user, cid, fid):
    fu = ClientFollowUp.query.get_or_404(fid)
    if fu.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    data = request.get_json() or {}
    fu.status = 'COMPLETED'
    fu.outcome_remark = data.get('outcome_remark', '')
    fu.completed_at = datetime.utcnow()
    if data.get('next_date'):
        db.session.add(ClientFollowUp(client_id=cid,
            date=datetime.strptime(data['next_date'], '%Y-%m-%d').date(),
            purpose=data.get('next_purpose', fu.purpose),
            assigned_to=data.get('assigned_to') or fu.assigned_to,
            created_by=current_user.id))
    db.session.commit()
    return jsonify({'follow_up': fu.to_dict()})


@client_bp.route('/<int:cid>/follow-ups/<int:fid>', methods=['DELETE'])
@login_required
def delete_follow_up(current_user, cid, fid):
    fu = ClientFollowUp.query.get_or_404(fid)
    if fu.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    db.session.delete(fu)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@client_bp.route('/<int:cid>/change-logs', methods=['GET'])
@login_required
def list_change_logs(current_user, cid):
    client = Client.query.get_or_404(cid)
    return jsonify({'change_logs': [l.to_dict() for l in client.change_logs.all()]})


@client_bp.route('/<int:cid>/change-logs/<int:lid>/approve', methods=['POST'])
@login_required
def approve_change(current_user, cid, lid):
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    log = ClientChangeLog.query.get_or_404(lid)
    if log.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    log.needs_approval = False
    log.approved_by = current_user.id
    log.approved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'change_log': log.to_dict()})


@client_bp.route('/<int:cid>/references', methods=['GET'])
@login_required
def list_references(current_user, cid):
    client = Client.query.get_or_404(cid)
    return jsonify({
        'referrals_given': [r.to_dict() for r in client.referrals_given.all()],
        'referrals_received': [r.to_dict() for r in client.referrals_received.all()],
    })


@client_bp.route('/<int:cid>/references', methods=['POST'])
@login_required
def create_reference(current_user, cid):
    Client.query.get_or_404(cid)
    data = request.get_json()
    if not data or not data.get('referred_client_id'):
        return jsonify({'error': 'referred_client_id required'}), 400
    rc_id = data['referred_client_id']
    if rc_id == cid:
        return jsonify({'error': 'Cannot self-refer'}), 400
    if ClientReference.query.filter_by(client_id=cid, referred_client_id=rc_id).first():
        return jsonify({'error': 'Reference already exists'}), 400
    ref = ClientReference(client_id=cid, referred_client_id=rc_id)
    db.session.add(ref)
    db.session.commit()
    return jsonify({'reference': ref.to_dict()}), 201


@client_bp.route('/<int:cid>/references/<int:rid>', methods=['DELETE'])
@login_required
def delete_reference(current_user, cid, rid):
    ref = ClientReference.query.get_or_404(rid)
    if ref.client_id != cid:
        return jsonify({'error': 'Mismatch'}), 400
    db.session.delete(ref)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@client_bp.route('/export', methods=['GET'])
@login_required
def export_clients(current_user):
    import csv, io
    clients = Client.query.order_by(Client.name).all()
    output = io.StringIO()
    w = csv.writer(output)
    w.writerow(['CID', 'Name', 'Type', 'Business Type', 'Category', 'Status', 'GSTIN', 'PAN', 'Phone', 'Email', 'Location', 'Parent', 'Account Owner', 'Business Value', 'Last Business', 'Next Follow-up'])
    for c in clients:
        w.writerow([c.client_code, c.name, c.client_type, c.business_type,
            c.client_category or c.vendor_category or c.industry, c.status,
            c.gst_number, c.pan_no, c.contact_phone, c.contact_email,
            c.location, c.parent.name if c.parent else '',
            c.account_owner.full_name if c.account_owner else '',
            c.business_value or 0, c.last_business_date, c.first_follow_up_date])
    return output.getvalue(), 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=clients.csv'}
