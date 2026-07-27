from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Account, Project, ProjectDocument, Task, Meeting, Note, MeetingRequest, FindingQuery, Lead, LeadProposal, LeadDocument, LeadActivity, LeadNote, Opportunity, Contact, ProjectTeam, User
from middleware.auth import login_required, role_required
from utils import generate_id, paginate

account_bp = Blueprint('accounts', __name__, url_prefix='/api/accounts')


@account_bp.route('', methods=['GET'])
@login_required
def list_accounts(current_user):
    query = Account.query
    filter_param = request.args.get('filter', 'all')
    if filter_param == 'active':
        query = query.filter_by(status='Active')
    elif filter_param == 'main':
        query = query.filter(Account.referred_by_account_id.is_(None))
    elif filter_param == 'sub':
        query = query.filter(Account.referred_by_account_id.isnot(None))
    if s := request.args.get('search'):
        query = query.filter(db.or_(Account.company_name.ilike(f'%{s}%'), Account.acc_id.ilike(f'%{s}%'), Account.gst_no.ilike(f'%{s}%')))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    query = query.order_by(Account.created_at.desc())
    result = paginate(query, request)
    ids = [a.id for a in result['items']]
    proj_counts = dict(db.session.query(Project.account_id, db.func.count(Project.id)).filter(Project.account_id.in_(ids)).group_by(Project.account_id).all()) if ids else {}
    lead_counts = dict(db.session.query(Lead.account_id, db.func.count(Lead.id)).filter(Lead.account_id.in_(ids)).group_by(Lead.account_id).all()) if ids else {}
    opp_counts = dict(db.session.query(Opportunity.account_id, db.func.count(Opportunity.id)).filter(Opportunity.account_id.in_(ids)).group_by(Opportunity.account_id).all()) if ids else {}
    contact_counts = dict(db.session.query(Contact.account_id, db.func.count(Contact.id)).filter(Contact.account_id.in_(ids)).group_by(Contact.account_id).all()) if ids else {}
    sub_account_counts = dict(db.session.query(Account.referred_by_account_id, db.func.count(Account.id)).filter(Account.referred_by_account_id.in_(ids)).group_by(Account.referred_by_account_id).all()) if ids else {}
    sub_accounts_map = {}
    if ids:
        sub_accs = Account.query.filter(Account.referred_by_account_id.in_(ids)).all()
        for sa in sub_accs:
            sub_accounts_map.setdefault(sa.referred_by_account_id, []).append(sa.to_dict(minimal=True))
    accounts_data = []
    for a in result['items']:
        data = a.to_dict(counts={'projects': proj_counts.get(a.id, 0), 'leads': lead_counts.get(a.id, 0), 'opportunities': opp_counts.get(a.id, 0), 'contacts': contact_counts.get(a.id, 0), 'sub_accounts': sub_account_counts.get(a.id, 0)})
        data['sub_clients'] = sub_accounts_map.get(a.id, [])
        accounts_data.append(data)
    return jsonify({'accounts': accounts_data, 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


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
        referred_by_account_id=data.get('referred_by_account_id') or None,
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
    referral_leads = Lead.query.filter_by(referring_account_id=aid).order_by(Lead.updated_at.desc()).all()
    contacts = Contact.query.filter_by(account_id=aid).order_by(Contact.is_primary.desc(), Contact.created_at.desc()).all()
    lead_ids = [l.id for l in leads]
    client_users = User.query.filter_by(account_id=aid, role='client').order_by(User.created_at.desc()).all()
    sub_accounts = Account.query.filter_by(referred_by_account_id=aid).all()
    return jsonify({
        'account': acc.to_dict(counts={'sub_accounts': len(sub_accounts)}),
        'sub_accounts': [s.to_dict() for s in sub_accounts],
        'contacts': [c.to_dict() for c in contacts],
        'projects': [p.to_dict() for p in projects],
        'opportunities': [o.to_dict() for o in opportunities],
        'leads': [l.to_dict() for l in leads],
        'referral_leads': [l.to_dict() for l in referral_leads],
        'documents': [d.to_dict() for d in ProjectDocument.query.filter(ProjectDocument.project_id.in_(proj_ids)).order_by(ProjectDocument.uploaded_at.desc()).all()] if proj_ids else [],
        'tasks': [t.to_dict() for t in Task.query.filter(Task.project_id.in_(proj_ids)).order_by(Task.created_at.desc()).all()] if proj_ids else [],
        'meetings': [m.to_dict() for m in Meeting.query.filter(Meeting.project_id.in_(proj_ids)).order_by(Meeting.meeting_date.desc()).all()] if proj_ids else [],
        'notes': [n.to_dict() for n in Note.query.filter(Note.project_id.in_(proj_ids)).order_by(Note.created_at.desc()).all()] if proj_ids else [],
        'meeting_requests': [mr.to_dict() for mr in MeetingRequest.query.filter_by(account_id=aid).order_by(MeetingRequest.created_at.desc()).all()],
        'finding_queries': [fq.to_dict() for fq in FindingQuery.query.filter_by(account_id=aid).order_by(FindingQuery.created_at.desc()).all()],
        'lead_proposals': [p.to_dict() for p in LeadProposal.query.filter(LeadProposal.lead_id.in_(lead_ids)).order_by(LeadProposal.created_at.desc()).all()] if lead_ids else [],
        'lead_documents': [d.to_dict() for d in LeadDocument.query.filter(LeadDocument.lead_id.in_(lead_ids)).order_by(LeadDocument.uploaded_at.desc()).all()] if lead_ids else [],
        'lead_activities': [a.to_dict() for a in LeadActivity.query.filter(LeadActivity.lead_id.in_(lead_ids)).order_by(LeadActivity.activity_date.desc()).all()] if lead_ids else [],
        'lead_notes': [n.to_dict() for n in LeadNote.query.filter(LeadNote.lead_id.in_(lead_ids)).order_by(LeadNote.created_at.desc()).all()] if lead_ids else [],
        'client_users': [{'id': u.id, 'email': u.email, 'name': u.full_name, 'is_active': u.is_active, 'created_at': u.created_at.isoformat() if u.created_at else None} for u in client_users],
    })


@account_bp.route('/<int:aid>', methods=['PUT'])
@login_required
def update_account(current_user, aid):
    acc = Account.query.get_or_404(aid)
    data = request.get_json()
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone', 'website', 'address', 'city', 'state', 'country', 'pincode', 'gst_no', 'pan_no', 'industry', 'account_type', 'status', 'referred_by_account_id']:
        if f in data:
            setattr(acc, f, data[f] or None)
    db.session.commit()
    return jsonify({'account': acc.to_dict()})


@account_bp.route('/<int:aid>/reset-client-password', methods=['POST'])
@login_required
def reset_client_password(current_user, aid):
    data = request.get_json()
    if not data.get('password'):
        return jsonify({'error': 'password required'}), 400
    client_user = User.query.filter_by(account_id=aid, role='client').first()
    if not client_user:
        return jsonify({'error': 'No client user found for this account'}), 404
    if not client_user.account_id:
        client_user.account_id = aid
    client_user.set_password(data['password'])
    db.session.commit()
    return jsonify({'message': 'Password updated', 'email': client_user.email})


@account_bp.route('/<int:aid>/referral-dashboard', methods=['GET'])
@login_required
def referral_dashboard(current_user, aid):
    Account.query.get_or_404(aid)
    opps = Opportunity.query.filter_by(account_id=aid).all()
    total = len(opps)
    active = sum(1 for o in opps if o.referral_status in ('New Referral', 'Contacted', 'Qualified'))
    converted = sum(1 for o in opps if o.referral_lead_id is not None)
    won = sum(1 for o in opps if o.referral_lead_id and Lead.query.get(o.referral_lead_id) and Lead.query.get(o.referral_lead_id).stage == 'Converted to Account')
    lost = sum(1 for o in opps if o.stage == 'Closed Lost')
    total_business = sum(o.estimated_value or 0 for o in opps if o.referral_lead_id)
    total_revenue = sum(o.estimated_value or 0 for o in opps if o.referral_lead_id and Lead.query.get(o.referral_lead_id) and Lead.query.get(o.referral_lead_id).stage == 'Converted to Account')
    leads_from_opps = Lead.query.filter(Lead.referral_opportunity_id.in_([o.id for o in opps])).all() if opps else []
    accounts_from_leads = Account.query.filter(Account.converted_lead_id.in_([l.id for l in leads_from_opps])).all() if leads_from_opps else []
    return jsonify({
        'total_referrals': total,
        'active_referrals': active,
        'converted_leads': converted,
        'won_customers': won,
        'lost_referrals': lost,
        'total_business_generated': total_business,
        'total_revenue_generated': total_revenue,
        'conversion_rate': round(converted / total * 100, 1) if total else 0,
    })


@account_bp.route('/<int:aid>/referral-timeline', methods=['GET'])
@login_required
def referral_timeline(current_user, aid):
    account = Account.query.get_or_404(aid)
    opps = Opportunity.query.filter_by(account_id=aid).order_by(Opportunity.created_at.desc()).all()
    timeline = []
    for opp in opps:
        timeline.append({
            'date': opp.created_at.isoformat() if opp.created_at else None,
            'event': f'{account.company_name} referred {opp.company_name}',
            'type': 'referral_created',
            'opportunity_id': opp.id,
            'company_name': opp.company_name,
        })
        if opp.referral_lead_id:
            lead = Lead.query.get(opp.referral_lead_id)
            if lead:
                timeline.append({
                    'date': lead.created_at.isoformat() if lead.created_at else None,
                    'event': f'Referral {opp.company_name} converted to Lead {lead.lead_id}',
                    'type': 'converted_to_lead',
                    'lead_id': lead.id,
                    'company_name': opp.company_name,
                })
                if lead.account_id:
                    tl_acc = Account.query.get(lead.account_id)
                    if tl_acc:
                        timeline.append({
                            'date': lead.account_created_at.isoformat() if lead.account_created_at else None,
                            'event': f'Lead {lead.lead_id} converted to Account {tl_acc.acc_id}',
                            'type': 'account_created',
                            'account_id': tl_acc.id,
                            'company_name': tl_acc.company_name,
                        })
                        projs = Project.query.filter_by(account_id=tl_acc.id).all()
                        for p in projs:
                            timeline.append({
                                'date': p.created_at.isoformat() if p.created_at else None,
                                'event': f'Project {p.proj_id} created for {tl_acc.company_name}',
                                'type': 'project_created',
                                'project_id': p.id,
                                'project_name': p.title,
                            })
    timeline.sort(key=lambda x: x['date'] or '', reverse=True)
    return jsonify({'timeline': timeline})


