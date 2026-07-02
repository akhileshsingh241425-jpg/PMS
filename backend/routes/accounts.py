from flask import Blueprint, request, jsonify
from models import db, Account, Lead, Opportunity, Project, Task, Meeting, Reminder, Note
from middleware.auth import login_required, permission_required
from utils import generate_id, paginate

account_bp = Blueprint('accounts', __name__, url_prefix='/api/accounts')


@account_bp.route('', methods=['GET'])
@login_required
def list_accounts(current_user):
    query = Account.query
    if s := request.args.get('search'):
        query = query.filter(db.or_(Account.company_name.ilike(f'%{s}%'), Account.acc_id.ilike(f'%{s}%')))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    query = query.order_by(Account.created_at.desc())
    result = paginate(query, request)
    ids = [a.id for a in result['items']]
    proj_counts = dict(db.session.query(Project.account_id, db.func.count(Project.id)).filter(Project.account_id.in_(ids)).group_by(Project.account_id).all()) if ids else {}
    lead_counts = dict(db.session.query(Lead.account_id, db.func.count(Lead.id)).filter(Lead.account_id.in_(ids)).group_by(Lead.account_id).all()) if ids else {}
    opp_counts = dict(db.session.query(Opportunity.account_id, db.func.count(Opportunity.id)).filter(Opportunity.account_id.in_(ids)).group_by(Opportunity.account_id).all()) if ids else {}
    return jsonify({'accounts': [a.to_dict(counts={'projects': proj_counts.get(a.id, 0), 'leads': lead_counts.get(a.id, 0), 'opportunities': opp_counts.get(a.id, 0)}) for a in result['items']], 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


@account_bp.route('', methods=['POST'])
@permission_required('accounts_create')
def create_account(current_user):
    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'company_name required'}), 400
    acc = Account(
        acc_id=generate_id(Account, 'ACC'),
        company_name=data['company_name'],
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        website=data.get('website'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        country=data.get('country', 'India'),
        pincode=data.get('pincode'),
        gst_no=data.get('gst_no'),
        pan_no=data.get('pan_no'),
        industry=data.get('industry'),
        account_type=data.get('account_type', 'B2B'),
        created_by=current_user.id,
    )
    db.session.add(acc)
    db.session.commit()
    return jsonify({'message': 'Created', 'account': acc.to_dict()}), 201


@account_bp.route('/<int:aid>', methods=['GET'])
@login_required
def get_account(current_user, aid):
    acc = Account.query.get_or_404(aid)
    return jsonify({
        'account': acc.to_dict(),
        'opportunities': [o.to_dict() for o in Opportunity.query.filter_by(account_id=aid).order_by(Opportunity.updated_at.desc()).all()],
        'leads': [l.to_dict() for l in Lead.query.filter_by(account_id=aid).order_by(Lead.updated_at.desc()).all()],
        'projects': [p.to_dict() for p in Project.query.filter_by(account_id=aid).order_by(Project.updated_at.desc()).all()],
    })


@account_bp.route('/<int:aid>', methods=['PUT'])
@permission_required('accounts_edit')
def update_account(current_user, aid):
    acc = Account.query.get_or_404(aid)
    data = request.get_json()
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone', 'website', 'address', 'city', 'state', 'country', 'pincode', 'gst_no', 'pan_no', 'industry', 'account_type', 'status']:
        if f in data:
            setattr(acc, f, data[f] or None)
    db.session.commit()
    return jsonify({'account': acc.to_dict()})
