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
                if user.role not in roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                return f(user, *args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
        return wrapper
    return decorator
