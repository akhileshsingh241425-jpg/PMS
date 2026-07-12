from datetime import datetime, date
from flask import Blueprint, request, jsonify
import os
from models import db, Opportunity, OpportunityRemark, OpportunityDocument, OpportunityActivity, OpportunityNote, Lead, Account, Project, User
from middleware.auth import login_required, role_required
from utils import generate_id, paginate, safe_int, safe_float, validate_file, safe_filename

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'opportunities')
os.makedirs(UPLOAD_DIR, exist_ok=True)

opp_bp = Blueprint('opportunities', __name__, url_prefix='/api/opportunities')


@opp_bp.route('', methods=['GET'])
@login_required
def list_opportunities(current_user):
    query = Opportunity.query
    if current_user.role != 'admin':
        query = query.filter(db.or_(
            Opportunity.assigned_to == current_user.id,
            Opportunity.created_by == current_user.id,
        ))
    if s := request.args.get('search'):
        query = query.filter(db.or_(
            Opportunity.company_name.ilike(f'%{s}%'),
            Opportunity.contact_name.ilike(f'%{s}%'),
            Opportunity.contact_email.ilike(f'%{s}%'),
            Opportunity.opp_id.ilike(f'%{s}%'),
        ))
    if st := request.args.get('stage'):
        query = query.filter_by(stage=st)
    query = query.order_by(Opportunity.updated_at.desc())
    result = paginate(query, request)
    return jsonify({
        'opportunities': [o.to_dict() for o in result['items']],
        'pagination': {
            'page': result['page'],
            'per_page': result['per_page'],
            'total': result['total'],
            'pages': result['pages'],
        },
    })


@opp_bp.route('', methods=['POST'])
@login_required
def create_opportunity(current_user):
    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'company_name is required'}), 400

    opp = Opportunity(
        opp_id=generate_id(Opportunity, 'OPP'),
        company_name=data['company_name'],
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        source=data.get('source'),
        service_interest=data.get('service_interest'),
        description=data.get('description'),
        stage=data.get('stage', 'Prospecting'),
        estimated_value=safe_float(data.get('estimated_value')),
        expected_close_date=datetime.strptime(data['expected_close_date'], '%Y-%m-%d').date() if data.get('expected_close_date') else None,
        account_id=safe_int(data.get('account_id')),
        assigned_to=safe_int(data.get('assigned_to')),
        created_by=current_user.id,
    )
    db.session.add(opp)
    db.session.commit()
    return jsonify({'message': 'Opportunity created', 'opportunity': opp.to_dict()}), 201


@opp_bp.route('/<int:oid>', methods=['GET'])
@login_required
def get_opportunity(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    remarks = OpportunityRemark.query.filter_by(opportunity_id=oid).order_by(OpportunityRemark.created_at.desc()).all()
    documents = OpportunityDocument.query.filter_by(opportunity_id=oid).order_by(OpportunityDocument.uploaded_at.desc()).all()
    activities = OpportunityActivity.query.filter_by(opportunity_id=oid).order_by(OpportunityActivity.activity_date.desc()).all()
    notes = OpportunityNote.query.filter_by(opportunity_id=oid).order_by(OpportunityNote.created_at.desc()).all()
    return jsonify({
        'opportunity': opp.to_dict(),
        'remarks': [r.to_dict() for r in remarks],
        'documents': [d.to_dict() for d in documents],
        'activities': [a.to_dict() for a in activities],
        'notes': [n.to_dict() for n in notes],
    })


@opp_bp.route('/<int:oid>', methods=['PUT'])
@login_required
def update_opportunity(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    data = request.get_json()
    for field in ['company_name', 'contact_name', 'contact_email', 'contact_phone',
                  'source', 'service_interest', 'description', 'stage', 'loss_reason']:
        if field in data:
            setattr(opp, field, data[field])
    if 'estimated_value' in data:
        opp.estimated_value = safe_float(data['estimated_value'])
    if 'expected_close_date' in data:
        opp.expected_close_date = datetime.strptime(data['expected_close_date'], '%Y-%m-%d').date() if data['expected_close_date'] else None
    if 'assigned_to' in data:
        opp.assigned_to = safe_int(data['assigned_to'])
    db.session.commit()
    return jsonify({'message': 'Opportunity updated', 'opportunity': opp.to_dict()})


@opp_bp.route('/<int:oid>/remarks', methods=['POST'])
@login_required
def add_remark(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'Text is required'}), 400
    r = OpportunityRemark(opportunity_id=opp.id, text=data['text'], created_by=current_user.id)
    db.session.add(r)
    db.session.commit()
    return jsonify({'message': 'Remark added', 'remark': r.to_dict()}), 201


@opp_bp.route('/<int:oid>/remarks/<int:rid>', methods=['PUT'])
@login_required
def update_remark(current_user, oid, rid):
    r = OpportunityRemark.query.filter_by(id=rid, opportunity_id=oid).first_or_404()
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    r.text = data['text']
    db.session.commit()
    return jsonify({'remark': r.to_dict()})


@opp_bp.route('/<int:oid>/documents', methods=['POST'])
@login_required
def upload_document(current_user, oid):
    Opportunity.query.get_or_404(oid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    fname = safe_filename(f'opp_{oid}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    doc = OpportunityDocument(
        opportunity_id=oid,
        file_name=file.filename,
        file_path=path,
        category=request.form.get('category', 'Proposal'),
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@opp_bp.route('/<int:oid>/documents/<int:did>', methods=['DELETE'])
@login_required
def delete_document(current_user, oid, did):
    d = OpportunityDocument.query.filter_by(id=did, opportunity_id=oid).first_or_404()
    if os.path.exists(d.file_path):
        os.remove(d.file_path)
    db.session.delete(d)
    db.session.commit()
    return jsonify({'message': 'Document deleted'})


@opp_bp.route('/<int:oid>/activities', methods=['POST'])
@login_required
def add_activity(current_user, oid):
    Opportunity.query.get_or_404(oid)
    data = request.get_json()
    if not data.get('title') or not data.get('activity_type'):
        return jsonify({'error': 'title and activity_type are required'}), 400
    a = OpportunityActivity(
        opportunity_id=oid,
        activity_type=data['activity_type'],
        title=data['title'],
        description=data.get('description'),
        activity_date=datetime.fromisoformat(data['activity_date']) if data.get('activity_date') else datetime.utcnow(),
        created_by=current_user.id,
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'activity': a.to_dict()}), 201


@opp_bp.route('/<int:oid>/activities/<int:aid>', methods=['DELETE'])
@login_required
def delete_activity(current_user, oid, aid):
    a = OpportunityActivity.query.filter_by(id=aid, opportunity_id=oid).first_or_404()
    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Activity deleted'})


@opp_bp.route('/<int:oid>/notes', methods=['POST'])
@login_required
def add_note(current_user, oid):
    Opportunity.query.get_or_404(oid)
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'content is required'}), 400
    n = OpportunityNote(opportunity_id=oid, content=data['content'], created_by=current_user.id)
    db.session.add(n)
    db.session.commit()
    return jsonify({'note': n.to_dict()}), 201


@opp_bp.route('/<int:oid>/notes/<int:nid>', methods=['DELETE'])
@login_required
def delete_note(current_user, oid, nid):
    n = OpportunityNote.query.filter_by(id=nid, opportunity_id=oid).first_or_404()
    db.session.delete(n)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})





@opp_bp.route('/<int:oid>/close-won', methods=['POST'])
@login_required
def close_won(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    if opp.stage not in ('Proposal/Price Quote', 'Negotiation/Review'):
        return jsonify({'error': 'Opportunity must be in Proposal/Price Quote or Negotiation/Review stage'}), 400
    opp.stage = 'Closed Won'
    db.session.commit()
    return jsonify({'opportunity': opp.to_dict()})


@opp_bp.route('/<int:oid>/close-lost', methods=['POST'])
@login_required
def close_lost(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    data = request.get_json()
    opp.stage = 'Closed Lost'
    opp.loss_reason = data.get('loss_reason', '')
    db.session.commit()
    return jsonify({'opportunity': opp.to_dict()})


@opp_bp.route('/<int:oid>/convert-to-account', methods=['POST'])
@login_required
def opp_to_account(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    if opp.stage != 'Closed Won':
        return jsonify({'error': 'Opportunity must be Closed Won first'}), 400
    if opp.account_id:
        return jsonify({'error': 'Account already linked to this opportunity'}), 400
    existing = Account.query.filter_by(company_name=opp.company_name).first()
    if existing:
        acc = existing
    else:
        acc = Account(
            acc_id=generate_id(Account, 'ACC'),
            company_name=opp.company_name,
            contact_name=opp.contact_name,
            contact_email=opp.contact_email,
            contact_phone=opp.contact_phone,
            industry=opp.service_interest,
            created_by=current_user.id,
        )
        db.session.add(acc)
        db.session.flush()
    opp.account_id = acc.id
    db.session.commit()
    return jsonify({'account': acc.to_dict(), 'opportunity': opp.to_dict()})


@opp_bp.route('/<int:oid>/create-project', methods=['POST'])
@login_required
def opp_create_project(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    if not opp.account_id:
        return jsonify({'error': 'Convert to account first'}), 400
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'Project title required'}), 400
    if not data.get('pm_id'):
        return jsonify({'error': 'Project Manager (pm_id) required'}), 400
    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=data['title'],
        description=data.get('description', opp.description),
        stage='Created',
        service_type=data.get('service_type', opp.service_interest),
        account_id=opp.account_id,
        pm_id=int(data['pm_id']),
        total_value=float(data['total_value']) if data.get('total_value') else opp.estimated_value,
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.commit()
    return jsonify({'project': proj.to_dict()}), 201


@opp_bp.route('/<int:oid>/convert-to-lead', methods=['POST'])
@login_required
def convert_opp_to_lead(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    data = request.get_json() or {}
    lead = Lead(
        lead_id=generate_id(Lead, 'LD'),
        company_name=data.get('company_name') or opp.company_name,
        contact_name=data.get('contact_name') or opp.contact_name,
        contact_email=data.get('contact_email') or opp.contact_email,
        contact_phone=data.get('contact_phone') or opp.contact_phone,
        source='Customer Referral',
        service_type=data.get('service_type') or opp.service_interest,
        description=data.get('description') or opp.description,
        estimated_value=data.get('estimated_value') or opp.estimated_value,
        assigned_to=safe_int(data.get('assigned_to')) or opp.assigned_to,
        stage='Prospecting',
        created_by=current_user.id,
        referral_opportunity_id=opp.id,
        referring_account_id=opp.account_id,
        referral_date=datetime.utcnow(),
    )
    db.session.add(lead)
    db.session.flush()
    from models import LeadAuditLog
    log = LeadAuditLog(lead_id=lead.id, action='Lead Created', new_value='Stage: Prospecting', changed_by=current_user.id)
    db.session.add(log)
    opp.referral_status = 'Converted'
    opp.referral_lead_id = lead.id
    db.session.commit()
    return jsonify({'message': 'Lead created from opportunity', 'lead': lead.to_dict()}), 201
