import re, time
from datetime import datetime
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {'pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip', 'pptx', 'csv', 'txt'}
MAX_FILE_SIZE = 16 * 1024 * 1024


def validate_file(file):
    if not file or not file.filename:
        return False, 'No file provided'
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return False, f'File type .{ext} not allowed. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'
    return True, None


def safe_filename(prefix, original_name):
    ext = original_name.rsplit('.', 1)[-1].lower() if '.' in original_name else ''
    return secure_filename(f'{prefix}_{original_name}')


def validate_email(email):
    return bool(re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', str(email)))


def validate_phone(phone):
    if not phone:
        return True
    return bool(re.match(r'^\+?[\d\s\-()]{7,20}$', str(phone)))


def validate_pan(pan):
    return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', str(pan)))


def validate_gst(gst):
    return bool(re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$', str(gst)))


def safe_int(value, default=None):
    if value is None or value == '': return default
    try: return int(value)
    except (ValueError, TypeError): raise ValueError(f'Invalid integer: {value}')


def safe_float(value, default=None):
    if value is None or value == '': return default
    try: return float(value)
    except (ValueError, TypeError): raise ValueError(f'Invalid number: {value}')


import time
from functools import wraps
from flask import request, jsonify

_rate_limit_store = {}

def rate_limit(max_requests=5, window_seconds=60):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f"{request.remote_addr}:{request.path}"
            now = time.time()
            _rate_limit_store.setdefault(key, [])
            _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]
            if len(_rate_limit_store[key]) >= max_requests:
                return jsonify({'error': 'Too many requests. Please try again later.'}), 429
            _rate_limit_store[key].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator


def paginate(query, request, default_per_page=25):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_per_page, type=int)
    per_page = min(per_page, 100)
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return {
        'items': items,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page,
    }


def generate_id(model_class, prefix, field='id', zfill=4):
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            from . import db
            last = db.session.query(db.func.max(getattr(model_class, field))).scalar()
            last_id = int(last.replace(prefix, '')) if last else 0
            new_id = f'{prefix}{str(last_id + 1).zfill(zfill)}'
            return new_id
        except Exception:
            if attempt == max_attempts - 1:
                timestamp_suffix = int(time.time()) % 10000
                return f'{prefix}{str(timestamp_suffix).zfill(zfill)}'
            time.sleep(0.1)
