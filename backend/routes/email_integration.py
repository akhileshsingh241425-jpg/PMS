import requests
import base64
import json
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, redirect
from models import db, User, EmailAccount, EmailMessage
from models.email_integration import CATEGORIES
from middleware.auth import login_required

email_bp = Blueprint('email', __name__, url_prefix='/api/email')

AUTHORITY = 'https://login.microsoftonline.com/common'
GRAPH_URL = 'https://graph.microsoft.com/v1.0'

_temp_tokens = {}


def _get_config():
    cfg = current_app.config
    return cfg.get('MICROSOFT_CLIENT_ID', ''), cfg.get('MICROSOFT_CLIENT_SECRET', ''), cfg.get('MICROSOFT_REDIRECT_URI', '')


@email_bp.route('/connect', methods=['GET'])
@login_required
def connect(current_user):
    client_id, _, redirect_uri = _get_config()
    if not client_id:
        return jsonify({'error': 'Microsoft Graph not configured. Set MICROSOFT_CLIENT_ID in server env.'}), 400
    state = secrets.token_urlsafe(32)
    _temp_tokens[state] = {'user_id': current_user.id, 'expires': datetime.utcnow() + timedelta(minutes=5)}
    scopes = 'offline_access Mail.Read Mail.ReadWrite User.Read'
    auth_url = (
        f'{AUTHORITY}/oauth2/v2.0/authorize'
        f'?client_id={client_id}'
        f'&response_type=code'
        f'&redirect_uri={redirect_uri}'
        f'&scope={scopes}'
        f'&response_mode=query'
        f'&state={state}'
    )
    return jsonify({'auth_url': auth_url})


@email_bp.route('/callback', methods=['GET'])
def callback():
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    if error:
        return jsonify({'error': f'Microsoft auth error: {error}'}), 400
    if not code or not state:
        return jsonify({'error': 'Missing code or state'}), 400

    temp = _temp_tokens.pop(state, None)
    if not temp or temp['expires'] < datetime.utcnow():
        return jsonify({'error': 'State expired or invalid. Reconnect.'}), 400

    client_id, client_secret, redirect_uri = _get_config()
    token_url = f'{AUTHORITY}/oauth2/v2.0/token'
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'code': code,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    resp = requests.post(token_url, data=data, headers=headers)
    if resp.status_code != 200:
        return jsonify({'error': 'Token exchange failed', 'detail': resp.text}), 400

    token_data = resp.json()
    access_token = token_data['access_token']
    refresh_token = token_data.get('refresh_token', '')
    expires_in = token_data.get('expires_in', 3600)
    token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    user_info = requests.get(f'{GRAPH_URL}/me', headers={'Authorization': f'Bearer {access_token}'}).json()
    email = user_info.get('mail') or user_info.get('userPrincipalName', '')

    token_enc = base64.b64encode(access_token.encode()).decode()
    refresh_enc = base64.b64encode(refresh_token.encode()).decode() if refresh_token else ''

    user_id = temp['user_id']
    account = EmailAccount.query.filter_by(user_id=user_id).first()
    if not account:
        account = EmailAccount(user_id=user_id, email=email)
        db.session.add(account)
    account.access_token = token_enc
    account.refresh_token = refresh_enc
    account.token_expiry = token_expiry
    account.is_active = True
    db.session.commit()

    fe_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5174')
    return redirect(f'{fe_url}/email?connected=1')


def _refresh_access_token(account):
    client_id, client_secret, _ = _get_config()
    if not account.refresh_token:
        return None
    try:
        refresh_token = base64.b64decode(account.refresh_token.encode()).decode()
    except Exception:
        return None
    token_url = f'{AUTHORITY}/oauth2/v2.0/token'
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
        'scope': 'offline_access Mail.Read Mail.ReadWrite User.Read',
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    resp = requests.post(token_url, data=data, headers=headers)
    if resp.status_code != 200:
        return None
    token_data = resp.json()
    new_access = token_data['access_token']
    new_refresh = token_data.get('refresh_token', refresh_token)
    account.access_token = base64.b64encode(new_access.encode()).decode()
    account.refresh_token = base64.b64encode(new_refresh.encode()).decode()
    account.token_expiry = datetime.utcnow() + timedelta(seconds=token_data.get('expires_in', 3600))
    db.session.commit()
    return new_access


def _get_valid_token(account):
    try:
        token = base64.b64decode(account.access_token.encode()).decode()
    except Exception:
        return None
    if account.token_expiry and datetime.utcnow() >= account.token_expiry:
        token = _refresh_access_token(account)
    return token


@email_bp.route('/fetch', methods=['POST'])
@login_required
def fetch_emails(current_user):
    accounts = EmailAccount.query.filter_by(user_id=current_user.id, is_active=True).all()
    if not accounts:
        return jsonify({'error': 'No connected email account'}), 400

    total_fetched = 0
    for account in accounts:
        token = _get_valid_token(account)
        if not token:
            continue

        last_msg = EmailMessage.query.filter_by(email_account_id=account.id).order_by(EmailMessage.received_at.desc()).first()
        filter_str = '?$top=50&$orderby=receivedDateTime desc'
        if last_msg and last_msg.received_at:
            since = last_msg.received_at.strftime('%Y-%m-%dT%H:%M:%SZ')
            filter_str = f'?$top=50&$filter=receivedDateTime gt {since}&$orderby=receivedDateTime desc'

        resp = requests.get(
            f'{GRAPH_URL}/me/messages{filter_str}',
            headers={'Authorization': f'Bearer {token}'},
        )
        if resp.status_code != 200:
            continue

        for msg in resp.json().get('value', []):
            if EmailMessage.query.filter_by(message_id=msg['id']).first():
                continue
            received = msg.get('receivedDateTime')
            email_msg = EmailMessage(
                email_account_id=account.id,
                message_id=msg['id'],
                subject=msg.get('subject'),
                body_preview=msg.get('bodyPreview', ''),
                sender_name=msg.get('from', {}).get('emailAddress', {}).get('name', ''),
                sender_email=msg.get('from', {}).get('emailAddress', {}).get('address', ''),
                recipient_email=msg.get('toRecipients', [{}])[0].get('emailAddress', {}).get('address', '') if msg.get('toRecipients') else '',
                received_at=datetime.fromisoformat(received.replace('Z', '+00:00')) if received else datetime.utcnow(),
                is_read=msg.get('isRead', False),
                status='read' if msg.get('isRead', False) else 'unread',
            )
            db.session.add(email_msg)
            total_fetched += 1

    db.session.commit()
    return jsonify({'fetched': total_fetched})


@email_bp.route('/accounts', methods=['GET'])
@login_required
def list_accounts(current_user):
    accounts = EmailAccount.query.filter_by(user_id=current_user.id).all()
    return jsonify({'accounts': [a.to_dict() for a in accounts]})


@email_bp.route('/accounts/<int:aid>', methods=['DELETE'])
@login_required
def delete_account(current_user, aid):
    account = EmailAccount.query.filter_by(id=aid, user_id=current_user.id).first()
    if not account:
        return jsonify({'error': 'Not found'}), 404
    EmailMessage.query.filter_by(email_account_id=aid).delete()
    db.session.delete(account)
    db.session.commit()
    return jsonify({'message': 'Disconnected'})


@email_bp.route('/messages', methods=['GET'])
@login_required
def list_messages(current_user):
    cat = request.args.get('category', '')
    search_q = request.args.get('search', '')
    status_f = request.args.get('status', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    account_ids = [a.id for a in EmailAccount.query.filter_by(user_id=current_user.id).all()]
    q = EmailMessage.query

    if account_ids:
        q = q.filter(EmailMessage.email_account_id.in_(account_ids))
    else:
        q = q.filter(EmailMessage.assigned_to_id == current_user.id)

    if cat:
        q = q.filter_by(category=cat)
    if status_f == 'unread':
        q = q.filter_by(is_read=False)
    elif status_f == 'read':
        q = q.filter_by(is_read=True)
    elif status_f == 'assigned':
        q = q.filter(EmailMessage.assigned_to_id.isnot(None))
    elif status_f == 'unassigned':
        q = q.filter(EmailMessage.assigned_to_id.is_(None))
    if search_q:
        q = q.filter(db.or_(
            EmailMessage.subject.ilike(f'%{search_q}%'),
            EmailMessage.sender_name.ilike(f'%{search_q}%'),
            EmailMessage.sender_email.ilike(f'%{search_q}%'),
            EmailMessage.body_preview.ilike(f'%{search_q}%'),
        ))

    q = q.order_by(EmailMessage.received_at.desc())
    total = q.count()
    messages = q.offset((page - 1) * per_page).limit(per_page).all()

    base = EmailMessage.query
    if account_ids:
        base = base.filter(EmailMessage.email_account_id.in_(account_ids))
    else:
        base = base.filter(EmailMessage.assigned_to_id == current_user.id)
    counts = {'total': base.count(), 'unread': base.filter_by(is_read=False).count()}
    for c in CATEGORIES:
        counts[c.lower()] = base.filter_by(category=c).count()

    employees = User.query.filter(User.role.in_(['admin', 'user', 'project_manager', 'employee']), User.is_active == True).all()

    return jsonify({
        'messages': [m.to_dict() for m in messages],
        'counts': counts,
        'page': page,
        'per_page': per_page,
        'total': total,
        'employees': [{'id': e.id, 'name': f'{e.first_name} {e.last_name or ""}'.strip(), 'email': e.email} for e in employees],
    })


@email_bp.route('/messages/<int:mid>/read', methods=['PUT'])
@login_required
def mark_read(current_user, mid):
    msg = EmailMessage.query.get_or_404(mid)
    msg.is_read = True
    msg.status = 'read'
    db.session.commit()
    return jsonify({'ok': True})


@email_bp.route('/messages/<int:mid>/categorize', methods=['PUT'])
@login_required
def categorize(current_user, mid):
    data = request.get_json() or {}
    category = data.get('category', '')
    if category not in CATEGORIES:
        return jsonify({'error': f'Invalid category. Must be one of: {", ".join(CATEGORIES)}'}), 400
    msg = EmailMessage.query.get_or_404(mid)
    msg.category = category
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/assign', methods=['PUT'])
@login_required
def assign(current_user, mid):
    data = request.get_json() or {}
    user_id = data.get('assigned_to_id')
    if not user_id:
        return jsonify({'error': 'assigned_to_id required'}), 400
    if not User.query.get(user_id):
        return jsonify({'error': 'User not found'}), 404
    msg = EmailMessage.query.get_or_404(mid)
    msg.assigned_to_id = user_id
    msg.assigned_by_id = current_user.id
    msg.assigned_at = datetime.utcnow()
    db.session.commit()
    return jsonify(msg.to_dict())
