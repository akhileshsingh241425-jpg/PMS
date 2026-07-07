import os, secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from models import db, User, ProjectTeam
from middleware.auth import generate_token, login_required, role_required
from utils import generate_id, rate_limit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DESIGNATIONS = [
    'Director', 'CEO', 'CTO', 'Project Lead', 'Senior Consultant',
    'Security Consultant', 'Senior Auditor', 'Auditor', 'Junior Auditor',
    'Security Analyst', 'Junior Analyst', 'BD Manager', 'BD Executive',
    'Admin Manager', 'Finance Manager', 'Other'
]


@auth_bp.route('/bootstrap', methods=['POST'])
def bootstrap():
    if User.query.first():
        return jsonify({'error': 'Users already exist. Login as admin to add more.'}), 403
    data = request.get_json()
    if not data.get('email') or not data.get('password') or not data.get('first_name'):
        return jsonify({'error': 'email, password, first_name required'}), 400

    user = User(emp_id='ADMIN001', email=data['email'], first_name=data['first_name'],
                last_name=data.get('last_name'), phone=data.get('phone'),
                designation='Director', role='admin')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Admin created', 'token': generate_token(user), 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account inactive'}), 403
    return jsonify({'token': generate_token(user), 'user': user.to_dict()})


@auth_bp.route('/client-login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def client_login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email'), role='client').first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account inactive'}), 403
    return jsonify({'token': generate_token(user), 'user': user.to_dict()})


@auth_bp.route('/me', methods=['GET'])
@login_required
def me(current_user):
    return jsonify({'user': current_user.to_dict()})


@auth_bp.route('/users', methods=['GET'])
@role_required('admin')
def list_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        d = u.to_dict()
        d['permissions'] = {}
        team_members = ProjectTeam.query.filter_by(user_id=u.id).all()
        d['projects'] = [{
            'id': tm.project.id,
            'proj_id': tm.project.proj_id,
            'title': tm.project.title,
            'stage': tm.project.stage,
            'team_member_id': tm.id,
        } for tm in team_members if tm.project]
        result.append(d)
    return jsonify({'users': result})


@auth_bp.route('/users', methods=['POST'])
@role_required('admin')
def create_user(current_user):
    data = request.get_json()
    if not data.get('email') or not data.get('password') or not data.get('first_name'):
        return jsonify({'error': 'email, password, first_name required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    emp_id = generate_id(User, 'EMP', field='emp_id')
    import json as _json
    certs = data.get('certifications')
    if isinstance(certs, list):
        certs = _json.dumps(certs)
    user = User(
        emp_id=emp_id, email=data['email'], first_name=data['first_name'],
        last_name=data.get('last_name'), phone=data.get('phone'),
        designation=data.get('designation'), department=data.get('department'),
        role=data.get('role', 'user'),
        reporting_manager_id=data.get('manager_id') or data.get('reporting_manager_id'),
        certifications=certs,
        experience_years=data.get('experience_years'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'user': user.to_dict()}), 201


@auth_bp.route('/users/<int:uid>', methods=['PUT'])
@role_required('admin')
def update_user(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    for f in ['first_name', 'last_name', 'phone', 'designation', 'department', 'role', 'is_active', 'experience_years']:
        if f in data:
            setattr(user, f, data[f])
    if 'manager_id' in data:
        user.reporting_manager_id = data['manager_id']
    if 'reporting_manager_id' in data:
        user.reporting_manager_id = data['reporting_manager_id']
    if 'certifications' in data:
        certs = data['certifications']
        import json as _json
        user.certifications = _json.dumps(certs) if isinstance(certs, list) else certs
    if data.get('password'):
        user.set_password(data['password'])
    db.session.commit()
    return jsonify({'message': 'Updated', 'user': user.to_dict()})


@auth_bp.route('/designations', methods=['GET'])
@login_required
def list_designations(current_user):
    return jsonify({'designations': DESIGNATIONS})


@auth_bp.route('/roles', methods=['GET'])
@login_required
def list_roles(current_user):
    roles = [
        {'id': 1, 'name': 'Super Admin', 'code': 'super_admin'},
        {'id': 2, 'name': 'Project Manager', 'code': 'project_manager'},
        {'id': 3, 'name': 'Team Leader', 'code': 'team_leader'},
        {'id': 4, 'name': 'Sales Representative', 'code': 'sales'},
        {'id': 5, 'name': 'Employee', 'code': 'employee'},
        {'id': 6, 'name': 'Client', 'code': 'client'},
    ]
    return jsonify({'roles': roles})


@auth_bp.route('/departments', methods=['GET'])
@login_required
def list_departments(current_user):
    depts = User.query.with_entities(User.department).filter(User.department.isnot(None)).distinct().all()
    departments = [{'id': i+1, 'name': d[0]} for i, d in enumerate(depts) if d[0]]
    return jsonify({'departments': departments})


@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit(max_requests=3, window_seconds=300)
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If the email exists, a reset token has been sent'})
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()
    reset_link = f"{current_app.config.get('FRONTEND_URL', 'http://localhost:5174')}/reset-password?token={token}&email={email}"
    return jsonify({'message': 'Password reset link sent', 'reset_link': reset_link})


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token', '').strip()
    email = data.get('email', '').strip()
    new_password = data.get('password', '')
    if not token or not email or len(new_password) < 8:
        return jsonify({'error': 'token, email, and password (min 8 chars) required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 400
    if not user.reset_token or user.reset_token != token:
        return jsonify({'error': 'Invalid or expired token'}), 400
    if not user.reset_token_expiry or datetime.utcnow() > user.reset_token_expiry:
        return jsonify({'error': 'Token expired'}), 400
    user.set_password(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    return jsonify({'message': 'Password reset successful'})
