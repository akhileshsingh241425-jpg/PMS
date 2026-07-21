from flask import Blueprint, request, jsonify
from models import db, Client, Project
from middleware.auth import login_required
from utils import generate_id

client_bp = Blueprint('clients', __name__, url_prefix='/api/clients')


@client_bp.route('', methods=['GET'])
@login_required
def list_clients(current_user):
    query = Client.query
    filter_param = request.args.get('filter', 'all')
    if filter_param == 'active':
        query = query.filter_by(status='Active')
    elif filter_param == 'main':
        query = query.filter_by(client_type='main')
    elif filter_param == 'sub':
        query = query.filter_by(client_type='sub')

    if s := request.args.get('search'):
        query = query.filter(db.or_(
            Client.name.ilike(f'%{s}%'),
            Client.client_code.ilike(f'%{s}%'),
            Client.gst_number.ilike(f'%{s}%'),
        ))
    if st := request.args.get('status'):
        query = query.filter_by(status=st)

    query = query.order_by(Client.created_at.desc())
    clients = query.all()

    cids = [c.id for c in clients]
    proj_counts = dict(
        db.session.query(Project.client_id, db.func.count(Project.id))
        .filter(Project.client_id.in_(cids))
        .group_by(Project.client_id)
        .all()
    ) if cids else {}

    result = []
    for c in clients:
        data = c.to_dict()
        data['project_count'] = proj_counts.get(c.id, 0)
        # sub-client project counts
        for sc in data.get('sub_clients', []):
            sc['project_count'] = proj_counts.get(sc['id'], 0)
        result.append(data)

    total = Client.query.count()
    active = Client.query.filter_by(status='Active').count()
    main = Client.query.filter_by(client_type='main').count()
    sub = Client.query.filter_by(client_type='sub').count()

    return jsonify({
        'clients': result,
        'summary': {'total': total, 'active': active, 'main': main, 'sub': sub},
    })


@client_bp.route('/summary', methods=['GET'])
@login_required
def clients_summary(current_user):
    total = Client.query.count()
    active = Client.query.filter_by(status='Active').count()
    main = Client.query.filter_by(client_type='main').count()
    sub = Client.query.filter_by(client_type='sub').count()
    return jsonify({'total': total, 'active': active, 'main': main, 'sub': sub})


@client_bp.route('/<int:cid>', methods=['GET'])
@login_required
def get_client(current_user, cid):
    client = Client.query.get_or_404(cid)
    data = client.to_dict()
    data['project_count'] = Project.query.filter_by(client_id=cid).count()
    projects = Project.query.filter_by(client_id=cid).order_by(Project.updated_at.desc()).all()
    data['projects'] = [p.to_dict() for p in projects]
    return jsonify({'client': data})


@client_bp.route('', methods=['POST'])
@login_required
def create_client(current_user):
    data = request.get_json()
    if not data.get('name'):
        return jsonify({'error': 'name required'}), 400

    client_type = data.get('client_type', 'main')
    parent_client_id = data.get('parent_client_id')

    if client_type == 'sub' and not parent_client_id:
        return jsonify({'error': 'parent_client_id required for sub clients'}), 400

    client = Client(
        name=data['name'],
        client_code=generate_id(Client, 'ACC'),
        gst_number=data.get('gst_number'),
        location=data.get('location'),
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        industry=data.get('industry'),
        status=data.get('status', 'Active'),
        client_type=client_type,
        parent_client_id=parent_client_id or None,
    )
    db.session.add(client)
    db.session.commit()
    return jsonify({'message': 'Created', 'client': client.to_dict()}), 201


@client_bp.route('/<int:cid>', methods=['PATCH'])
@login_required
def update_client(current_user, cid):
    client = Client.query.get_or_404(cid)
    data = request.get_json()
    for f in ['name', 'gst_number', 'location', 'contact_name', 'contact_email',
              'contact_phone', 'industry', 'status', 'client_type', 'parent_client_id']:
        if f in data:
            setattr(client, f, data[f] or None)
    db.session.commit()
    return jsonify({'client': client.to_dict()})


@client_bp.route('/<int:cid>', methods=['DELETE'])
@login_required
def delete_client(current_user, cid):
    client = Client.query.get_or_404(cid)
    db.session.delete(client)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
