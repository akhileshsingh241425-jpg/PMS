from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Opportunity, OpportunityRemark, Lead
from models.opportunity import STAGE_NAMES, STAGE_MAP
from utils import generate_id, paginate
from middleware.auth import login_required, permission_required

opp_bp = Blueprint('opportunities', __name__, url_prefix='/api/opportunities')


@opp_bp.route('', methods=['GET'])
@login_required
def list_opps(current_user):
    query = Opportunity.query
    if s := request.args.get('search'):
        query = query.filter(db.or_(Opportunity.company_name.ilike(f'%{s}%'), Opportunity.opp_id.ilike(f'%{s}%')))
    if st := request.args.get('stage'):
        query = query.filter_by(stage=st)
    query = query.order_by(Opportunity.updated_at.desc())
    result = paginate(query, request)
    return jsonify({'opportunities': [o.to_dict() for o in result['items']], 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


@opp_bp.route('', methods=['POST'])
@permission_required('opportunities_create')
def create_opp(current_user):
    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'company_name is required'}), 400
    stage = data.get('stage', 'Prospecting')
    try:
        estimated_value = float(data['estimated_value']) if data.get('estimated_value') else None
        expected_close_date = datetime.strptime(data['expected_close_date'], '%Y-%m-%d').date() if data.get('expected_close_date') else None
        assigned_to = int(data['assigned_to']) if data.get('assigned_to') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for estimated_value, expected_close_date, or assigned_to'}), 400
    opp = Opportunity(
        opp_id=generate_id(Opportunity, 'OPP'),
        company_name=data['company_name'],
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        source=data.get('source'),
        service_interest=data.get('service_interest'),
        description=data.get('description'),
        stage=stage,
        probability=STAGE_MAP.get(stage, 10),
        estimated_value=estimated_value,
        expected_close_date=expected_close_date,
        assigned_to=assigned_to,
        created_by=current_user.id,
    )
    db.session.add(opp)
    db.session.commit()
    return jsonify({'message': 'Created', 'opportunity': opp.to_dict()}), 201


@opp_bp.route('/<int:oid>', methods=['GET'])
@login_required
def get_opp(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    return jsonify({
        'opportunity': opp.to_dict(),
        'remarks': [r.to_dict() for r in opp.remarks],
    })


@opp_bp.route('/<int:oid>', methods=['PUT'])
@permission_required('opportunities_edit')
def update_opp(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    data = request.get_json()
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone', 'source', 'service_interest', 'description', 'loss_reason']:
        if f in data:
            setattr(opp, f, data[f] or None)
    if 'stage' in data:
        opp.stage = data['stage']
        opp.probability = STAGE_MAP.get(data['stage'], opp.probability)
    try:
        if 'estimated_value' in data:
            opp.estimated_value = float(data['estimated_value']) if data['estimated_value'] else None
        if 'expected_close_date' in data:
            opp.expected_close_date = datetime.strptime(data['expected_close_date'], '%Y-%m-%d').date() if data['expected_close_date'] else None
        if 'assigned_to' in data:
            opp.assigned_to = int(data['assigned_to']) if data['assigned_to'] else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for number or date fields'}), 400
    db.session.commit()
    return jsonify({'opportunity': opp.to_dict()})


@opp_bp.route('/<int:oid>/remarks', methods=['POST'])
@login_required
def add_remark(current_user, oid):
    Opportunity.query.get_or_404(oid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    r = OpportunityRemark(opportunity_id=oid, text=data['text'], created_by=current_user.id)
    db.session.add(r)
    db.session.commit()
    return jsonify({'remark': r.to_dict()}), 201


@opp_bp.route('/<int:oid>/convert-to-lead', methods=['POST'])
@login_required
def convert_to_lead(current_user, oid):
    opp = Opportunity.query.get_or_404(oid)
    if opp.stage != 'Closed Won':
        return jsonify({'error': 'Only Closed Won can convert'}), 400

    lead = Lead(
        lead_id=generate_id(Lead, 'LED'),
        company_name=opp.company_name,
        contact_name=opp.contact_name,
        contact_email=opp.contact_email,
        contact_phone=opp.contact_phone,
        source=opp.source,
        service_type=opp.service_interest,
        description=opp.description,
        stage='Prospecting',
        estimated_value=opp.estimated_value,
        assigned_to=opp.assigned_to,
        opportunity_id=opp.id,
        account_id=opp.account_id,
        created_by=current_user.id,
    )
    db.session.add(lead)
    db.session.commit()
    return jsonify({'message': 'Lead created', 'lead': lead.to_dict()}), 201


@opp_bp.route('/stages', methods=['GET'])
@login_required
def stages(current_user):
    return jsonify({'stages': STAGE_NAMES, 'probabilities': STAGE_MAP})
