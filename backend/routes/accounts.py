from flask import Blueprint, request, jsonify
from models import db, Account, Project, ProjectDocument, Task, Meeting, Note, MeetingRequest, FindingQuery, Lead, Opportunity, Contact
from middleware.auth import login_required, role_required
from utils import generate_id, paginate

account_bp = Blueprint('accounts', __name__, url_prefix='/api/accounts')


@account_bp.route('', methods=['GET'])
@login_required
def list_accounts(current_user):
    query = Account.query
    if current_user.role != 'admin':
        from models import ProjectTeam, Project
        user_project_ids = [t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()]
        query = query.filter(db.or_(
            Account.created_by == current_user.id,
            Account.id.in_(db.session.query(Project.account_id).filter(Project.id.in_(user_project_ids))),
        ))
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
    contact_counts = dict(db.session.query(Contact.account_id, db.func.count(Contact.id)).filter(Contact.account_id.in_(ids)).group_by(Contact.account_id).all()) if ids else {}
    return jsonify({'accounts': [a.to_dict(counts={'projects': proj_counts.get(a.id, 0), 'leads': lead_counts.get(a.id, 0), 'opportunities': opp_counts.get(a.id, 0), 'contacts': contact_counts.get(a.id, 0)}) for a in result['items']], 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


@account_bp.route('', methods=['POST'])
@login_required
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
    projects = Project.query.filter_by(account_id=aid).order_by(Project.updated_at.desc()).all()
    proj_ids = [p.id for p in projects]
    opportunities = Opportunity.query.filter_by(account_id=aid).order_by(Opportunity.updated_at.desc()).all()
    leads = Lead.query.filter_by(account_id=aid).order_by(Lead.updated_at.desc()).all()
    contacts = Contact.query.filter_by(account_id=aid).order_by(Contact.is_primary.desc(), Contact.created_at.desc()).all()
    return jsonify({
        'account': acc.to_dict(),
        'contacts': [c.to_dict() for c in contacts],
        'projects': [p.to_dict() for p in projects],
        'opportunities': [o.to_dict() for o in opportunities],
        'leads': [l.to_dict() for l in leads],
        'documents': [d.to_dict() for d in ProjectDocument.query.filter(ProjectDocument.project_id.in_(proj_ids)).order_by(ProjectDocument.uploaded_at.desc()).all()] if proj_ids else [],
        'tasks': [t.to_dict() for t in Task.query.filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at.desc()).all()] if proj_ids else [],
        'meetings': [m.to_dict() for m in Meeting.query.filter(Meeting.project_id.in_(proj_ids)).order_by(Meeting.meeting_date.desc()).all()] if proj_ids else [],
        'notes': [n.to_dict() for n in Note.query.filter(Note.project_id.in_(proj_ids)).order_by(Note.created_at.desc()).all()] if proj_ids else [],
        'meeting_requests': [mr.to_dict() for mr in MeetingRequest.query.filter_by(account_id=aid).order_by(MeetingRequest.created_at.desc()).all()],
        'finding_queries': [fq.to_dict() for fq in FindingQuery.query.filter_by(account_id=aid).order_by(FindingQuery.created_at.desc()).all()],
    })


@account_bp.route('/<int:aid>', methods=['PUT'])
@login_required
def update_account(current_user, aid):
    acc = Account.query.get_or_404(aid)
    data = request.get_json()
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone', 'website', 'address', 'city', 'state', 'country', 'pincode', 'gst_no', 'pan_no', 'industry', 'account_type', 'status']:
        if f in data:
            setattr(acc, f, data[f] or None)
    db.session.commit()
    return jsonify({'account': acc.to_dict()})
