import jwt
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta


def generate_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRY_HOURS', 24))
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def _get_user():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        token = request.args.get('token', '')
    if not token:
        return None
    try:
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        from models import User
        user = User.query.get(data['user_id'])
        if user and user.is_active:
            return user
    except:
        pass
    return None


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = _get_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return wrapper


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = _get_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            if user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(user, *args, **kwargs)
        return wrapper
    return decorator


def permission_required(permission):
    """Check granular permission from RBAC model."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = _get_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            from models.rbac import has_permission
            if not has_permission(user.role, permission):
                return jsonify({'error': f'Missing permission: {permission}'}), 403
            return f(user, *args, **kwargs)
        return wrapper
    return decorator


def audit_log(action, module=None):
    """Decorator to log actions automatically. Works with login_required."""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = _get_user()
            result = f(*args, **kwargs)

            try:
                # Try to log the action
                from models import AuditLog
                from models import db
                resp_code = result[1] if isinstance(result, tuple) else 200
                if resp_code < 400 and user:
                    log = AuditLog(
                        module=module or request.path.split('/')[2] if '/api/' in request.path else 'unknown',
                        action=action,
                        summary=f'{action} by {user.full_name}',
                        ip_address=request.remote_addr,
                        user_agent=request.headers.get('User-Agent', '')[:255],
                        action_by=user.id,
                    )
                    db.session.add(log)
                    db.session.commit()
            except:
                pass

            return result
        return wrapper
    return decorator


def can_access_project(user, project_id):
    """Check if user can access a specific project based on role."""
    if user.role == 'super_admin':
        return True
    from models import ProjectTeam, Project
    if user.role == 'admin':
        return True
    if user.role == 'project_manager':
        project = Project.query.get(project_id)
        if project and project.pm_id == user.id:
            return True
    if user.role in ('project_manager', 'team_member'):
        member = ProjectTeam.query.filter_by(project_id=project_id, user_id=user.id).first()
        if member:
            return True
    return False


def can_access_account(user, account_id):
    """Check if user can access account."""
    if user.role in ('super_admin', 'admin'):
        return True
    return False


def can_access_lead(user, lead):
    """Check user access to a lead."""
    if user.role in ('super_admin', 'admin'):
        return True
    if lead.assigned_to == user.id:
        return True
    if lead.created_by == user.id:
        return True
    # Check if user's reporting manager created/assigned
    if user.reporting_manager_id and (lead.assigned_to == user.reporting_manager_id or lead.created_by == user.reporting_manager_id):
        return True
    return False
