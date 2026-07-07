from flask import Blueprint, request, jsonify
from models import db, Lead, Account, Project, Contact
from middleware.auth import login_required

search_bp = Blueprint('search', __name__, url_prefix='/api/search')


@search_bp.route('', methods=['GET'])
@login_required
def global_search(current_user):
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify({'results': []})
    pattern = f'%{q}%'

    leads = Lead.query.filter(db.or_(
        Lead.company_name.ilike(pattern),
        Lead.contact_name.ilike(pattern),
        Lead.contact_email.ilike(pattern),
        Lead.lead_id.ilike(pattern),
        Lead.subject.ilike(pattern),
    )).limit(5).all()

    accounts = Account.query.filter(db.or_(
        Account.company_name.ilike(pattern),
        Account.contact_name.ilike(pattern),
        Account.contact_email.ilike(pattern),
        Account.acc_id.ilike(pattern),
    )).limit(5).all()

    projects = Project.query.filter(db.or_(
        Project.title.ilike(pattern),
        Project.proj_id.ilike(pattern),
    )).limit(5).all()

    contacts = Contact.query.filter(db.or_(
        Contact.first_name.ilike(pattern),
        Contact.last_name.ilike(pattern),
        Contact.email.ilike(pattern),
    )).limit(5).all()

    results = []
    for l in leads:
        results.append({'type': 'lead', 'id': l.id, 'label': l.lead_id, 'title': l.company_name, 'subtitle': l.contact_name, 'url': f'/leads/{l.id}'})
    for a in accounts:
        results.append({'type': 'account', 'id': a.id, 'label': a.acc_id, 'title': a.company_name, 'subtitle': a.contact_name, 'url': f'/accounts/{a.id}'})
    for p in projects:
        results.append({'type': 'project', 'id': p.id, 'label': p.proj_id, 'title': p.title, 'subtitle': p.account.company_name if p.account else '', 'url': f'/projects/{p.id}'})
    for c in contacts:
        results.append({'type': 'contact', 'id': c.id, 'label': '', 'title': c.full_name, 'subtitle': c.email, 'url': f'/accounts/{c.account_id}' if c.account_id else '#'})

    return jsonify({'results': results})
