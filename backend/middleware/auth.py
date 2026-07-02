import jwt
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta


def generate_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'roles': user.roles,
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRY_HOURS', 24))
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            from models import User
            user = User.query.get(data['user_id'])
            if not user or not user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
            return f(user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    return wrapper


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({'error': 'Token required'}), 401
            try:
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                from models import User
                user = User.query.get(data['user_id'])
                if not user or not user.is_active:
                    return jsonify({'error': 'Invalid user'}), 401
                if not any(r in user.roles for r in roles):
                    return jsonify({'error': 'Insufficient permissions'}), 403
                return f(user, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
        return wrapper
    return decorator


def permission_required(perm_code):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({'error': 'Token required'}), 401
            try:
                data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                from models import User, Permission, UserPermission
                user = User.query.get(data['user_id'])
                if not user or not user.is_active:
                    return jsonify({'error': 'Invalid user'}), 401
                if 'super_admin' in user.roles:
                    return f(user, *args, **kwargs)
                perm = Permission.query.filter_by(code=perm_code).first()
                if not perm:
                    return jsonify({'error': 'Permission not found'}), 403
                up = UserPermission.query.filter_by(user_id=user.id, permission_id=perm.id).first()
                if not up or not up.is_granted:
                    return jsonify({'error': 'Access denied'}), 403
                return f(user, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
        return wrapper
    return decorator
