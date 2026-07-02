from datetime import datetime
from flask import Blueprint, request, jsonify
import os
from models import db, Lead, LeadDocument, LeadRemark, Account, Project
from models.lead import LEAD_STAGES
from middleware.auth import login_required, permission_required
from utils import validate_file, safe_filename, generate_id, paginate

lead_bp = Blueprint('leads', __name__, url_prefix='/api/leads')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'leads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


@lead_bp.route('', methods=['GET'])
@login_required
def list_leads(current_user):
    query = Lead.query
    if s := request.args.get('search'):
        query = query.filter(db.or_(Lead.company_name.ilike(f'%{s}%'), Lead.lead_id.ilike(f'%{s}%')))
    if st := request.args.get('stage'):
        query = query.filter_by(stage=st)
    query = query.order_by(Lead.updated_at.desc())
    result = paginate(query, request)
    return jsonify({'leads': [l.to_dict() for l in result['items']], 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


@lead_bp.route('', methods=['POST'])
@permission_required('leads_create')
def create_lead(current_user):
    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'company_name is required'}), 400
    stage = data.get('stage', 'Prospecting')
    try:
        estimated_value = float(data['estimated_value']) if data.get('estimated_value') else None
        assigned_to = int(data['assigned_to']) if data.get('assigned_to') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid number format for estimated_value or assigned_to'}), 400
    lead = Lead(
        lead_id=generate_id(Lead, 'LD'),
        company_name=data['company_name'],
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        website=data.get('website'),
        source=data.get('source'),
        service_type=data.get('service_type'),
        description=data.get('description'),
        stage=data.get('stage', 'Prospecting'),
        estimated_value=estimated_value,
        assigned_to=assigned_to,
        created_by=current_user.id,
    )
    db.session.add(lead)
    db.session.commit()
    return jsonify({'message': 'Created', 'lead': lead.to_dict()}), 201


@lead_bp.route('/<int:lid>', methods=['GET'])
@login_required
def get_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    return jsonify({
        'lead': lead.to_dict(),
        'remarks': [r.to_dict() for r in lead.remarks],
        'documents': [d.to_dict() for d in lead.documents],
    })


@lead_bp.route('/<int:lid>', methods=['PUT'])
@permission_required('leads_edit')
def update_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json()
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone', 'website', 'source', 'service_type', 'description', 'stage']:
        if f in data:
            setattr(lead, f, data[f] or None)
    try:
        if 'estimated_value' in data:
            lead.estimated_value = float(data['estimated_value']) if data['estimated_value'] else None
        if 'assigned_to' in data:
            lead.assigned_to = int(data['assigned_to']) if data['assigned_to'] else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid number format'}), 400
    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@lead_bp.route('/<int:lid>/remarks', methods=['POST'])
@login_required
def add_remark(current_user, lid):
    Lead.query.get_or_404(lid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    r = LeadRemark(lead_id=lid, text=data['text'], created_by=current_user.id)
    db.session.add(r)
    db.session.commit()
    return jsonify({'remark': r.to_dict()}), 201


@lead_bp.route('/<int:lid>/documents', methods=['POST'])
@login_required
def upload_doc(current_user, lid):
    Lead.query.get_or_404(lid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    fname = safe_filename(f'{lid}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    doc = LeadDocument(
        lead_id=lid, file_name=file.filename, file_path=path,
        file_type=fname.rsplit('.', 1)[-1] if '.' in fname else '',
        category=request.form.get('category', 'Other'),
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@lead_bp.route('/<int:lid>/convert-to-account', methods=['POST'])
@login_required
def convert_to_account(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.account_id:
        return jsonify({'error': 'Already converted', 'account_id': lead.account_id}), 409

    acc = Account(
        acc_id=generate_id(Account, 'ACC'),
        company_name=lead.company_name,
        contact_name=lead.contact_name,
        contact_email=lead.contact_email,
        contact_phone=lead.contact_phone,
        website=lead.website,
        industry=lead.service_type,
        account_type='B2B',
        status='Active',
        created_by=current_user.id,
    )
    db.session.add(acc)
    db.session.flush()
    lead.account_id = acc.id
    lead.stage = 'Lead Converted'
    db.session.commit()
    return jsonify({'message': 'Account created', 'account': acc.to_dict()}), 201


@lead_bp.route('/stages', methods=['GET'])
@login_required
def stages(current_user):
    return jsonify({'stages': LEAD_STAGES})
