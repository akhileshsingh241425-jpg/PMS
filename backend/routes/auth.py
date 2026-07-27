import os, secrets, random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from models import db, User, ProjectTeam, LoginOtp
from middleware.auth import generate_token, generate_temp_token, login_required, role_required
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
    if user.role == 'client':
        return jsonify({'error': 'Client users must login via Client Portal at /client-login'}), 403

    # Generate & send OTP
    otp = LoginOtp.create_for_user(user.id)
    masked = user.email[:3] + '***' + user.email[user.email.index('@'):]

    try:
        from email_utils import send_email_async
        subject = f'{otp.otp_code} is your OTP for PMS login'
        html = f'''
        <div style="font-family:Arial;max-width:480px;margin:0 auto">
            <div style="background:linear-gradient(90deg,#1e3a8a,#2563eb);padding:20px;text-align:center">
                <h1 style="color:#fff;font-size:18px;margin:0">PMS v2 — INFOCUS-IT</h1>
            </div>
            <div style="padding:24px;border:1px solid #E5E7EB;border-top:none">
                <p style="font-size:14px;color:#374151">Your OTP for login is:</p>
                <div style="font-size:32px;font-weight:700;color:#1e3a8a;text-align:center;letter-spacing:8px;padding:16px;background:#F8FAFC;border-radius:8px;margin:12px 0">{otp.otp_code}</div>
                <p style="font-size:12px;color:#9CA3AF">Valid for 5 minutes. Do not share this OTP.</p>
            </div>
        </div>'''
        send_email_async(subject, [user.email], html)
    except Exception:
        pass

    return jsonify({
        'requires_otp': True,
        'temp_token': generate_temp_token(user),
        'email': masked,
        'otp_sent': True,
    })


@auth_bp.route('/verify-otp', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def verify_otp():
    data = request.get_json()
    temp_token = data.get('temp_token', '')
    otp_code = data.get('otp_code', '').strip()

    # Decode temp token
    import jwt
    try:
        payload = jwt.decode(temp_token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        if payload.get('type') != 'temp_otp':
            return jsonify({'error': 'Invalid token'}), 401
        user_id = payload['user_id']
    except Exception:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Verify OTP
    otp = LoginOtp.query.filter_by(user_id=user_id, otp_code=otp_code, is_used=False)\
        .order_by(LoginOtp.id.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 401

    otp.is_used = True
    db.session.commit()

    user = User.query.get(user_id)
    if not user or not user.is_active:
        return jsonify({'error': 'Account inactive'}), 403

    user.last_activity = datetime.utcnow()
    db.session.commit()

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
    if current_user.role == 'client':
        return jsonify({'error': 'Access denied'}), 403
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

    role_val = data.get('role', 'user')
    prefix = 'CLT' if role_val == 'client' else 'EMP'
    emp_id = generate_id(User, prefix, field='emp_id')
    import json as _json
    certs = data.get('certifications')
    if isinstance(certs, list):
        certs = _json.dumps(certs)
    user = User(
        emp_id=emp_id, email=data['email'], first_name=data['first_name'],
        last_name=data.get('last_name'), phone=data.get('phone'),
        designation=data.get('designation'), department=data.get('department'),
        role=role_val,
        client_id=data.get('client_id'),
        client_company_name=data.get('client_company_name'),
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
    for f in ['email', 'first_name', 'last_name', 'phone', 'designation', 'department', 'role', 'is_active', 'experience_years', 'emp_id', 'client_company_name']:
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


@auth_bp.route('/users/<int:uid>', methods=['DELETE'])
@role_required('admin')
def delete_user(current_user, uid):
    user = User.query.get_or_404(uid)
    if user.id == current_user.id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})


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
