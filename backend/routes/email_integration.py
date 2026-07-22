import re
import requests
import base64
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, redirect
from middleware.auth import login_required
from models import (
    db, User, EmailAccount, EmailMessage, EmailAuthState,
    EmailActivity, EmailNote, EmailAutoRule,
    CATEGORIES, EMAIL_STATUSES, PRIORITIES, TAGS_PRESET,
)

email_bp = Blueprint('email', __name__, url_prefix='/api/email')

GRAPH_URL = 'https://graph.microsoft.com/v1.0'

COMPANY_DOMAINS = {
    'gmail.com': 'Personal', 'yahoo.com': 'Personal', 'outlook.com': 'Personal', 'hotmail.com': 'Personal',
    'rediffmail.com': 'Personal',
}


def _get_authority():
    tenant = current_app.config.get('MICROSOFT_TENANT_ID', 'common')
    return f'https://login.microsoftonline.com/{tenant}'


def _get_config():
    cfg = current_app.config
    return cfg.get('MICROSOFT_CLIENT_ID', ''), cfg.get('MICROSOFT_CLIENT_SECRET', ''), cfg.get('MICROSOFT_REDIRECT_URI', '')


def _detect_company(subject, sender_email, body):
    domain = (sender_email or '').split('@')[-1].lower()
    if domain in COMPANY_DOMAINS:
        return COMPANY_DOMAINS[domain]
    parts = domain.replace('.co.in', '.com').split('.')
    if len(parts) >= 2:
        return parts[-2].capitalize()
    return ''


def _detect_priority(subject, body):
    text = f'{subject or ""} {body or ""}'.lower()
    if any(w in text for w in ['urgent', 'asap', 'immediate', 'emergency', 'critical']):
        return 'Urgent'
    if any(w in text for w in ['high', 'important', 'priority']):
        return 'High'
    if any(w in text for w in ['low', 'minor']):
        return 'Low'
    return 'Medium'


def _detect_category(subject, body):
    text = f'{subject or ""} {body or ""}'.lower()
    rules = [
        ('Lead', ['inquiry', 'quote', 'quotation', 'estimate', 'pricing', 'new project', 'interested', 'requirement']),
        ('Support', ['support', 'issue', 'problem', 'bug', 'error', 'not working', 'help', 'complaint', 'breakdown']),
        ('Invoice', ['invoice', 'payment', 'bill', 'receipt', 'due', 'outstanding']),
        ('Meeting', ['meeting', 'schedule', 'appointment', 'call', 'calendar', 'invite']),
        ('Task', ['task', 'todo', 'to-do', 'action item', 'assignment']),
        ('Follow-up', ['follow up', 'follow-up', 'update', 'status', 'pending', 'reminder']),
        ('Client', ['contract', 'agreement', 'signed', 'deal', 'project update', 'milestone']),
    ]
    for cat, keywords in rules:
        if any(k in text for k in keywords):
            return cat
    return 'Other'


def _apply_auto_rules(msg):
    from models import EmailAutoRule
    rules = EmailAutoRule.query.filter_by(is_active=True).all()
    for rule in rules:
        matched = False
        if rule.match_type == 'domain':
            domain = (msg.sender_email or '').split('@')[-1].lower()
            if domain == rule.match_value.lower() or domain.endswith('.' + rule.match_value.lower()):
                matched = True
        elif rule.match_type == 'sender':
            if rule.match_value.lower() in (msg.sender_email or '').lower():
                matched = True
        elif rule.match_type == 'subject':
            if rule.match_value.lower() in (msg.subject or '').lower():
                matched = True
        if matched:
            if rule.category and not msg.category:
                msg.category = rule.category
            if rule.priority:
                msg.priority = rule.priority
            if rule.assign_to_id and not msg.assigned_to_id:
                msg.assigned_to_id = rule.assign_to_id
                msg.assigned_by_id = 1
                msg.assigned_at = datetime.utcnow()
                msg.status = 'Assigned'
            return True
    return False


def _add_activity(email_id, user_id, action, detail=None):
    act = EmailActivity(email_id=email_id, user_id=user_id, action=action, detail=detail)
    db.session.add(act)


@email_bp.route('/connect', methods=['GET'])
@login_required
def connect(current_user):
    client_id, _, redirect_uri = _get_config()
    if not client_id:
        return jsonify({'error': 'Microsoft Graph not configured'}), 400
    state = secrets.token_urlsafe(32)
    db.session.add(EmailAuthState(state=state, user_id=current_user.id, expires_at=datetime.utcnow() + timedelta(minutes=10)))
    db.session.commit()
    scopes = 'offline_access Mail.Read Mail.ReadWrite User.Read'
    auth_url = (
        f'{_get_authority()}/oauth2/v2.0/authorize'
        f'?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}'
        f'&scope={scopes}&response_mode=query&state={state}'
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

    auth_state = EmailAuthState.query.filter_by(state=state).first()
    if not auth_state or auth_state.expires_at < datetime.utcnow():
        if auth_state:
            db.session.delete(auth_state)
            db.session.commit()
        return jsonify({'error': 'State expired. Reconnect.'}), 400

    client_id, client_secret, redirect_uri = _get_config()
    resp = requests.post(f'{_get_authority()}/oauth2/v2.0/token', data={
        'client_id': client_id, 'client_secret': client_secret, 'code': code,
        'redirect_uri': redirect_uri, 'grant_type': 'authorization_code',
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    if resp.status_code != 200:
        return jsonify({'error': 'Token exchange failed'}), 400
    td = resp.json()
    access_token = td['access_token']
    refresh_token = td.get('refresh_token', '')
    token_expiry = datetime.utcnow() + timedelta(seconds=td.get('expires_in', 3600))

    user_info = requests.get(f'{GRAPH_URL}/me', headers={'Authorization': f'Bearer {access_token}'}).json()
    email = user_info.get('mail') or user_info.get('userPrincipalName', '')
    user_id = auth_state.user_id

    account = EmailAccount.query.filter_by(user_id=user_id).first()
    if not account:
        account = EmailAccount(user_id=user_id, email=email)
        db.session.add(account)
    account.access_token = base64.b64encode(access_token.encode()).decode()
    account.refresh_token = base64.b64encode(refresh_token.encode()).decode() if refresh_token else ''
    account.token_expiry = token_expiry
    account.is_active = True
    db.session.delete(auth_state)
    db.session.commit()
    fe_url = current_app.config.get('FRONTEND_URL', 'https://localhost:5174')
    return redirect(f'{fe_url}/email?connected=1')


def _refresh_access_token(account):
    client_id, client_secret, _ = _get_config()
    if not account.refresh_token:
        return None
    try:
        refresh_token = base64.b64decode(account.refresh_token.encode()).decode()
    except Exception:
        return None
    resp = requests.post(f'{_get_authority()}/oauth2/v2.0/token', data={
        'client_id': client_id, 'client_secret': client_secret, 'refresh_token': refresh_token,
        'grant_type': 'refresh_token', 'scope': 'offline_access Mail.Read Mail.ReadWrite User.Read',
    }, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    if resp.status_code != 200:
        return None
    td = resp.json()
    account.access_token = base64.b64encode(td['access_token'].encode()).decode()
    account.refresh_token = base64.b64encode(td.get('refresh_token', refresh_token).encode()).decode()
    account.token_expiry = datetime.utcnow() + timedelta(seconds=td.get('expires_in', 3600))
    db.session.commit()
    return td['access_token']


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

        resp = requests.get(f'{GRAPH_URL}/me/messages{filter_str}', headers={'Authorization': f'Bearer {token}'})
        if resp.status_code != 200:
            continue

        for msg in resp.json().get('value', []):
            if EmailMessage.query.filter_by(message_id=msg['id']).first():
                continue
            received = msg.get('receivedDateTime')
            sender_email = msg.get('from', {}).get('emailAddress', {}).get('address', '')
            subject = msg.get('subject', '')
            body = msg.get('bodyPreview', '')
            email_msg = EmailMessage(
                email_account_id=account.id, message_id=msg['id'],
                subject=subject, body_preview=body,
                sender_name=msg.get('from', {}).get('emailAddress', {}).get('name', ''),
                sender_email=sender_email,
                recipient_email=msg.get('toRecipients', [{}])[0].get('emailAddress', {}).get('address', '') if msg.get('toRecipients') else '',
                company=_detect_company(subject, sender_email, body),
                priority=_detect_priority(subject, body),
                category=_detect_category(subject, body),
                received_at=datetime.fromisoformat(received.replace('Z', '+00:00')) if received else datetime.utcnow(),
                is_read=msg.get('isRead', False),
            )
            _apply_auto_rules(email_msg)
            db.session.add(email_msg)
            _add_activity(email_msg.id, current_user.id, 'Received', 'Email received from ' + sender_email)
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
    EmailActivity.query.filter(EmailActivity.email_id.in_(
        db.session.query(EmailMessage.id).filter_by(email_account_id=aid)
    )).delete(synchronize_session=False)
    EmailNote.query.filter(EmailNote.email_id.in_(
        db.session.query(EmailMessage.id).filter_by(email_account_id=aid)
    )).delete(synchronize_session=False)
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
    priority_f = request.args.get('priority', '')
    tag_f = request.args.get('tag', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    account_ids = [a.id for a in EmailAccount.query.filter_by(user_id=current_user.id).all()]
    q = EmailMessage.query
    if account_ids:
        q = q.filter(EmailMessage.email_account_id.in_(account_ids))
    else:
        q = q.filter(EmailMessage.assigned_to_id == current_user.id)

    now = datetime.utcnow()
    q = q.filter(db.or_(EmailMessage.snooze_at.is_(None), EmailMessage.snooze_at <= now))

    if cat:
        q = q.filter_by(category=cat)
    if status_f:
        if status_f == 'unread':
            q = q.filter_by(is_read=False)
        elif status_f == 'assigned':
            q = q.filter(EmailMessage.assigned_to_id.isnot(None))
        elif status_f == 'unassigned':
            q = q.filter(EmailMessage.assigned_to_id.is_(None))
        else:
            q = q.filter_by(status=status_f)
    if priority_f:
        q = q.filter_by(priority=priority_f)
    if tag_f:
        q = q.filter(EmailMessage.tags.contains(tag_f))
    if search_q:
        q = q.filter(db.or_(
            EmailMessage.subject.ilike(f'%{search_q}%'),
            EmailMessage.sender_name.ilike(f'%{search_q}%'),
            EmailMessage.sender_email.ilike(f'%{search_q}%'),
            EmailMessage.body_preview.ilike(f'%{search_q}%'),
            EmailMessage.company.ilike(f'%{search_q}%'),
        ))

    q = q.order_by(EmailMessage.received_at.desc())
    total = q.count()
    messages = q.offset((page - 1) * per_page).limit(per_page).all()

    base = EmailMessage.query.filter(db.or_(EmailMessage.snooze_at.is_(None), EmailMessage.snooze_at <= now))
    if account_ids:
        base = base.filter(EmailMessage.email_account_id.in_(account_ids))
    else:
        base = base.filter(EmailMessage.assigned_to_id == current_user.id)
    counts = {'total': base.count(), 'unread': base.filter_by(is_read=False).count()}
    for c in CATEGORIES:
        counts[c.lower()] = base.filter_by(category=c).count()
    counts['new'] = base.filter_by(status='New').count()
    counts['assigned'] = base.filter(EmailMessage.assigned_to_id.isnot(None)).count()
    counts['unassigned'] = base.filter(EmailMessage.assigned_to_id.is_(None)).count()

    employees = User.query.filter(User.role.in_(['admin', 'user', 'project_manager', 'employee']), User.is_active == True).all()

    return jsonify({
        'messages': [m.to_dict() for m in messages],
        'counts': counts,
        'page': page, 'per_page': per_page, 'total': total,
        'employees': [{'id': e.id, 'name': f'{e.first_name} {e.last_name or ""}'.strip(), 'email': e.email} for e in employees],
    })


@email_bp.route('/messages/<int:mid>/read', methods=['PUT'])
@login_required
def mark_read(current_user, mid):
    msg = EmailMessage.query.get_or_404(mid)
    msg.is_read = True
    if msg.status == 'New':
        msg.status = 'Assigned' if msg.assigned_to_id else 'New'
    db.session.commit()
    return jsonify({'ok': True})


@email_bp.route('/messages/<int:mid>/categorize', methods=['PUT'])
@login_required
def categorize(current_user, mid):
    data = request.get_json() or {}
    category = data.get('category', '')
    if category not in CATEGORIES:
        return jsonify({'error': 'Invalid category'}), 400
    msg = EmailMessage.query.get_or_404(mid)
    msg.category = category
    _add_activity(mid, current_user.id, 'Categorized', f'Category set to {category}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/assign', methods=['PUT'])
@login_required
def assign(current_user, mid):
    data = request.get_json() or {}
    user_id = data.get('assigned_to_id')
    create_task = data.get('create_task', True)
    if not user_id:
        return jsonify({'error': 'assigned_to_id required'}), 400
    if not User.query.get(user_id):
        return jsonify({'error': 'User not found'}), 404
    msg = EmailMessage.query.get_or_404(mid)
    msg.assigned_to_id = user_id
    msg.assigned_by_id = current_user.id
    msg.assigned_at = datetime.utcnow()
    msg.status = 'Assigned'
    user = User.query.get(user_id)
    _add_activity(mid, current_user.id, 'Assigned',
                  f'Assigned to {user.first_name if user else "?"}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/status', methods=['PUT'])
@login_required
def update_status(current_user, mid):
    data = request.get_json() or {}
    status = data.get('status', '')
    if status not in EMAIL_STATUSES:
        return jsonify({'error': 'Invalid status'}), 400
    msg = EmailMessage.query.get_or_404(mid)
    msg.status = status
    _add_activity(mid, current_user.id, 'Status Changed', f'Status changed to {status}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/priority', methods=['PUT'])
@login_required
def set_priority(current_user, mid):
    data = request.get_json() or {}
    priority = data.get('priority', '')
    if priority not in PRIORITIES:
        return jsonify({'error': 'Invalid priority'}), 400
    msg = EmailMessage.query.get_or_404(mid)
    msg.priority = priority
    _add_activity(mid, current_user.id, 'Priority Set', f'Priority changed to {priority}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/tags', methods=['PUT'])
@login_required
def set_tags(current_user, mid):
    data = request.get_json() or {}
    tags = data.get('tags', [])
    msg = EmailMessage.query.get_or_404(mid)
    msg.tags = ','.join(tags) if tags else None
    _add_activity(mid, current_user.id, 'Tags Updated', f'Tags: {", ".join(tags)}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/snooze', methods=['PUT'])
@login_required
def snooze(current_user, mid):
    data = request.get_json() or {}
    snooze_str = data.get('snooze_at', '')
    if not snooze_str:
        return jsonify({'error': 'snooze_at required'}), 400
    try:
        snooze_at = datetime.fromisoformat(snooze_str)
    except:
        return jsonify({'error': 'Invalid date format'}), 400
    msg = EmailMessage.query.get_or_404(mid)
    msg.snooze_at = snooze_at
    _add_activity(mid, current_user.id, 'Snoozed', f'Snoozed until {snooze_at.isoformat()}')
    db.session.commit()
    return jsonify(msg.to_dict())


@email_bp.route('/messages/<int:mid>/notes', methods=['GET'])
@login_required
def list_notes(current_user, mid):
    notes = EmailNote.query.filter_by(email_id=mid).order_by(EmailNote.created_at.desc()).all()
    return jsonify({'notes': [n.to_dict() for n in notes]})


@email_bp.route('/messages/<int:mid>/notes', methods=['POST'])
@login_required
def add_note(current_user, mid):
    data = request.get_json() or {}
    note_text = data.get('note', '')
    if not note_text:
        return jsonify({'error': 'Note required'}), 400
    note = EmailNote(email_id=mid, user_id=current_user.id, note=note_text)
    db.session.add(note)
    _add_activity(mid, current_user.id, 'Note Added', 'Internal note added')
    db.session.commit()
    return jsonify(note.to_dict()), 201


@email_bp.route('/messages/<int:mid>/activities', methods=['GET'])
@login_required
def list_activities(current_user, mid):
    activities = EmailActivity.query.filter_by(email_id=mid).order_by(EmailActivity.created_at.desc()).all()
    return jsonify({'activities': [a.to_dict() for a in activities]})


@email_bp.route('/rules', methods=['GET'])
@login_required
def list_rules(current_user):
    rules = EmailAutoRule.query.order_by(EmailAutoRule.created_at.desc()).all()
    employees = User.query.filter(User.role.in_(['admin', 'user', 'project_manager', 'employee']), User.is_active == True).all()
    return jsonify({
        'rules': [r.to_dict() for r in rules],
        'employees': [{'id': e.id, 'name': f'{e.first_name} {e.last_name or ""}'.strip(), 'email': e.email} for e in employees],
    })


@email_bp.route('/rules', methods=['POST'])
@login_required
def create_rule(current_user):
    data = request.get_json() or {}
    rule = EmailAutoRule(
        name=data.get('name', ''),
        match_type=data.get('match_type', 'domain'),
        match_value=data.get('match_value', ''),
        category=data.get('category', ''),
        priority=data.get('priority', 'Medium'),
        assign_to_id=data.get('assign_to_id'),
    )
    db.session.add(rule)
    db.session.commit()
    return jsonify(rule.to_dict()), 201


@email_bp.route('/rules/<int:rid>', methods=['PUT'])
@login_required
def update_rule(current_user, rid):
    rule = EmailAutoRule.query.get_or_404(rid)
    data = request.get_json() or {}
    for f in ['name', 'match_type', 'match_value', 'category', 'priority', 'is_active']:
        if f in data:
            setattr(rule, f, data[f])
    if 'assign_to_id' in data:
        rule.assign_to_id = data['assign_to_id']
    db.session.commit()
    return jsonify(rule.to_dict())


@email_bp.route('/rules/<int:rid>', methods=['DELETE'])
@login_required
def delete_rule(current_user, rid):
    rule = EmailAutoRule.query.get_or_404(rid)
    db.session.delete(rule)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@email_bp.route('/tags', methods=['GET'])
@login_required
def list_tags(current_user):
    return jsonify({'tags': TAGS_PRESET})
