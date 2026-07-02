import os, secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from models import db, User, Role, UserRole, Department
from middleware.auth import generate_token, login_required, role_required
from utils import generate_id, rate_limit

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DESIGNATIONS = [
    'Director', 'CEO', 'CTO', 'Project Lead', 'Senior Consultant',
    'Security Consultant', 'Senior Auditor', 'Auditor', 'Junior Auditor',
    'Security Analyst', 'Junior Analyst', 'BD Manager', 'BD Executive',
    'Admin Manager', 'Finance Manager', 'Accounts Executive', 'Other'
]
CERTS = ['CEH', 'CISSP', 'CISA', 'CISM', 'ISO 27001 LA', 'DISA', 'OSCP', 'CRTP', 'CompTIA Security+']


@auth_bp.route('/bootstrap', methods=['POST'])
def bootstrap():
    """First user — becomes Super Admin. Only works when DB is empty."""
    if User.query.first():
        return jsonify({'error': 'Users already exist. Login as admin to add more.'}), 403
    data = request.get_json()
    if not data.get('email') or not data.get('password') or not data.get('first_name'):
        return jsonify({'error': 'email, password, first_name required'}), 400

    user = User(emp_id='ADMIN001', email=data['email'], first_name=data['first_name'],
                last_name=data.get('last_name'), phone=data.get('phone'), designation='Director')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    role = Role.query.filter_by(code='super_admin').first()
    if role:
        db.session.add(UserRole(user_id=user.id, role_id=role.id))
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


@auth_bp.route('/me', methods=['GET'])
@login_required
def me(current_user):
    return jsonify({'user': current_user.to_dict()})


@auth_bp.route('/users', methods=['GET'])
@login_required
def list_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]})


@auth_bp.route('/users', methods=['POST'])
@role_required('super_admin')
def create_user(current_user):
    data = request.get_json()
    if not data.get('email') or not data.get('password') or not data.get('first_name'):
        return jsonify({'error': 'email, password, first_name required'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    # Auto emp_id
    dept = Department.query.get(data.get('department_id')) if data.get('department_id') else None
    prefix = dept.code if dept else 'EMP'
    emp_id = generate_id(User, prefix, field='emp_id')

    user = User(
        emp_id=emp_id, email=data['email'], first_name=data['first_name'],
        last_name=data.get('last_name'), phone=data.get('phone'),
        designation=data.get('designation'), department_id=data.get('department_id'),
        manager_id=data.get('manager_id'), certifications=data.get('certifications', []),
        experience_years=data.get('experience_years'),
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    for rid in data.get('role_ids', []):
        if Role.query.get(rid):
            db.session.add(UserRole(user_id=user.id, role_id=rid))
    db.session.commit()
    return jsonify({'message': 'User created', 'user': user.to_dict()}), 201


@auth_bp.route('/users/<int:uid>', methods=['PUT'])
@role_required('super_admin')
def update_user(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    for f in ['first_name', 'last_name', 'phone', 'designation', 'department_id', 'manager_id', 'certifications', 'experience_years', 'is_active']:
        if f in data:
            setattr(user, f, data[f])
    if data.get('password'):
        user.set_password(data['password'])
    if 'role_ids' in data:
        UserRole.query.filter_by(user_id=user.id).delete()
        for rid in data['role_ids']:
            if Role.query.get(rid):
                db.session.add(UserRole(user_id=user.id, role_id=rid))
    db.session.commit()
    return jsonify({'message': 'Updated', 'user': user.to_dict()})


@auth_bp.route('/roles', methods=['GET'])
@login_required
def list_roles(current_user):
    return jsonify({'roles': [{'id': r.id, 'name': r.name, 'code': r.code, 'description': r.description} for r in Role.query.all()]})


@auth_bp.route('/departments', methods=['GET'])
@login_required
def list_departments(current_user):
    return jsonify({'departments': [{'id': d.id, 'name': d.name, 'code': d.code} for d in Department.query.all()]})


@auth_bp.route('/designations', methods=['GET'])
@login_required
def list_designations(current_user):
    return jsonify({'designations': DESIGNATIONS, 'certifications': CERTS})


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
