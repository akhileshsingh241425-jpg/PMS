from flask import Blueprint, request, jsonify
from models import db, Lead, Client, Project, Opportunity
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

    clients = Client.query.filter(db.or_(
        Client.name.ilike(pattern),
        Client.contact_name.ilike(pattern),
        Client.contact_email.ilike(pattern),
        Client.client_code.ilike(pattern),
    )).limit(5).all()

    projects = Project.query.filter(db.or_(
        Project.title.ilike(pattern),
        Project.proj_id.ilike(pattern),
    )).limit(5).all()

    opportunities = Opportunity.query.filter(db.or_(
        Opportunity.company_name.ilike(pattern),
        Opportunity.contact_name.ilike(pattern),
        Opportunity.contact_email.ilike(pattern),
        Opportunity.opp_id.ilike(pattern),
    )).limit(5).all()

    results = []
    for l in leads:
        results.append({'type': 'lead', 'id': l.id, 'label': l.lead_id, 'title': l.company_name, 'subtitle': l.contact_name, 'url': f'/leads/{l.id}'})
    for c in clients:
        results.append({'type': 'client', 'id': c.id, 'label': c.client_code, 'title': c.name, 'subtitle': c.contact_name, 'url': f'/clients/{c.id}'})
    for p in projects:
        results.append({'type': 'project', 'id': p.id, 'label': p.proj_id, 'title': p.title, 'subtitle': p.client.name if p.client else '', 'url': f'/projects/{p.id}'})
    for o in opportunities:
        results.append({'type': 'opportunity', 'id': o.id, 'label': o.opp_id, 'title': o.company_name, 'subtitle': o.contact_name, 'url': f'/opportunities/{o.id}'})

    return jsonify({'results': results})
