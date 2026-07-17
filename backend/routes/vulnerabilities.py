from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from models import db, Vulnerability, Account, User, Notification, Project
from middleware.auth import login_required, role_required


def _notify(user_id, title, message, module_type=None, module_id=None, notif_type='info'):
    n = Notification(user_id=user_id, title=title, message=message,
                     module_type=module_type, module_id=module_id, type=notif_type)
    db.session.add(n)
    try:
        u = User.query.get(user_id)
        if u and u.email and current_app.config.get('MAIL_SERVER'):
            from email_utils import send_notification_email
            send_notification_email(u.email, u.full_name or u.first_name,
                                    title, message, module_type, module_id,
                                    current_app.config.get('FRONTEND_URL', 'http://localhost:5174'))
    except Exception:
        pass


def _send_vuln_reminders():
    now = datetime.utcnow()
    six_hours_ago = now - timedelta(hours=6)
    vulns = Vulnerability.query.filter(
        Vulnerability.status != 'Patched',
        Vulnerability.fix_deadline.isnot(None),
        db.or_(
            Vulnerability.last_reminded_at.is_(None),
            Vulnerability.last_reminded_at < six_hours_ago
        )
    ).all()
    for v in vulns:
        is_overdue = v.fix_deadline < now
        needs_follow_up = v.fix_deadline <= now + timedelta(days=5)
        if not (is_overdue or needs_follow_up):
            continue
        user_id = v.assigned_to or v.created_by
        if not user_id:
            continue
        if is_overdue:
            title = '⚠ Vulnerability Overdue'
            message = f'"{v.title}" for {v.account.company_name} was due {v.fix_deadline.strftime("%d-%b-%Y")}.'
        else:
            title = '⏰ Vulnerability Follow-up Needed'
            message = f'"{v.title}" for {v.account.company_name} is due by {v.fix_deadline.strftime("%d-%b-%Y")}.'
        _notify(user_id, title, message, 'vulnerability', v.id)
        v.last_reminded_at = now
    db.session.commit()

vuln_bp = Blueprint('vulnerabilities', __name__, url_prefix='/api/vulnerabilities')

@vuln_bp.route('', methods=['GET'])
@login_required
def list_vulnerabilities(current_user):
    account_id = request.args.get('account_id', type=int)
    project_id = request.args.get('project_id', type=int)
    severity = request.args.get('severity')
    status = request.args.get('status')
    overdue_only = request.args.get('overdue_only', type=bool)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_dir = request.args.get('sort_dir', 'desc')

    q = Vulnerability.query
    if account_id:
        q = q.filter_by(account_id=account_id)
    if project_id:
        q = q.filter_by(project_id=project_id)
    if severity:
        q = q.filter_by(severity=severity)
    if status:
        q = q.filter_by(status=status)
    if overdue_only:
        now = datetime.utcnow()
        q = q.filter(Vulnerability.status != 'Patched', Vulnerability.fix_deadline < now)

    order_col = getattr(Vulnerability, sort_by, Vulnerability.created_at)
    if sort_dir == 'asc':
        q = q.order_by(order_col.asc())
    else:
        q = q.order_by(order_col.desc())

    vulns = q.all()
    return jsonify({'vulnerabilities': [v.to_dict() for v in vulns]})


@vuln_bp.route('', methods=['POST'])
@login_required
def create_vulnerability(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('account_id'):
        return jsonify({'error': 'title and account_id are required'}), 400
    if data.get('severity') not in ('Critical', 'High', 'Medium', 'Low'):
        return jsonify({'error': 'severity must be Critical, High, Medium, or Low'}), 400

    deadline = None
    if data.get('fix_deadline'):
        deadline = datetime.fromisoformat(data['fix_deadline'])
    elif data.get('sla_days'):
        date_found = datetime.fromisoformat(data.get('date_found') or datetime.utcnow().isoformat())
        deadline = date_found + timedelta(days=int(data['sla_days']))

    project_id = int(data['project_id']) if data.get('project_id') else None
    account_id = int(data['account_id'])
    if project_id:
        proj = Project.query.get(project_id)
        if proj:
            account_id = proj.account_id

    vuln = Vulnerability(
        account_id=account_id,
        project_id=project_id,
        title=data['title'],
        description=data.get('description'),
        severity=data['severity'],
        status=data.get('status', 'Open'),
        date_found=datetime.fromisoformat(data['date_found']) if data.get('date_found') else datetime.utcnow(),
        fix_deadline=deadline,
        assigned_to=int(data['assigned_to']) if data.get('assigned_to') else None,
        created_by=current_user.id,
    )
    db.session.add(vuln)
    db.session.commit()
    return jsonify({'vulnerability': vuln.to_dict()}), 201


@vuln_bp.route('/<int:vid>', methods=['GET'])
@login_required
def get_vulnerability(current_user, vid):
    vuln = Vulnerability.query.get_or_404(vid)
    return jsonify({'vulnerability': vuln.to_dict()})


@vuln_bp.route('/<int:vid>', methods=['PUT'])
@login_required
def update_vulnerability(current_user, vid):
    vuln = Vulnerability.query.get_or_404(vid)
    data = request.get_json()

    if 'title' in data:
        vuln.title = data['title']
    if 'description' in data:
        vuln.description = data['description']
    if 'severity' in data:
        if data['severity'] not in ('Critical', 'High', 'Medium', 'Low'):
            return jsonify({'error': 'invalid severity'}), 400
        vuln.severity = data['severity']
    if 'status' in data:
        vuln.status = data['status']
        if data['status'] == 'Patched' and not vuln.date_patched:
            vuln.date_patched = datetime.utcnow()
        elif data['status'] != 'Patched':
            vuln.date_patched = None
    if 'date_found' in data:
        vuln.date_found = datetime.fromisoformat(data['date_found']) if data['date_found'] else None
    if 'fix_deadline' in data:
        vuln.fix_deadline = datetime.fromisoformat(data['fix_deadline']) if data['fix_deadline'] else None
    if 'assigned_to' in data:
        vuln.assigned_to = int(data['assigned_to']) if data['assigned_to'] else None
    if 'project_id' in data:
        vuln.project_id = int(data['project_id']) if data['project_id'] else None

    vuln.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'vulnerability': vuln.to_dict()})


@vuln_bp.route('/<int:vid>', methods=['DELETE'])
@role_required('admin', 'project_manager')
def delete_vulnerability(current_user, vid):
    vuln = Vulnerability.query.get_or_404(vid)
    db.session.delete(vuln)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


@vuln_bp.route('/<int:vid>/patch', methods=['POST'])
@login_required
def mark_patched(current_user, vid):
    vuln = Vulnerability.query.get_or_404(vid)
    vuln.status = 'Patched'
    vuln.date_patched = datetime.utcnow()
    vuln.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'vulnerability': vuln.to_dict()})


@vuln_bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard(current_user):
    now = datetime.utcnow()
    five_days = now + timedelta(days=5)

    accounts = Account.query.order_by(Account.company_name).all()
    per_client = []
    org_open = 0
    org_overdue = 0
    org_follow_up = 0
    org_severity = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
    org_status = {'Open': 0, 'In Progress': 0, 'Patched': 0}

    for acc in accounts:
        vulns = Vulnerability.query.filter_by(account_id=acc.id).all()
        total = len(vulns)
        patched = sum(1 for v in vulns if v.status == 'Patched')
        open_c = sum(1 for v in vulns if v.status == 'Open')
        in_progress = sum(1 for v in vulns if v.status == 'In Progress')
        overdue = sum(1 for v in vulns if v.status != 'Patched' and v.fix_deadline and v.fix_deadline < now)
        follow_up = sum(1 for v in vulns if v.status != 'Patched' and v.fix_deadline and v.fix_deadline <= five_days)
        sev = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
        for v in vulns:
            if v.severity in sev:
                sev[v.severity] += 1

        highest = 'Low'
        for s in ('Critical', 'High', 'Medium'):
            if sev[s] > 0:
                highest = s
                break

        per_client.append({
            'account_id': acc.id,
            'account_name': acc.company_name,
            'total': total,
            'patched': patched,
            'open': open_c,
            'in_progress': in_progress,
            'overdue': overdue,
            'needs_follow_up': follow_up,
            'severity': sev,
            'highest_severity': highest,
        })

        org_open += open_c
        org_overdue += overdue
        org_follow_up += follow_up
        for s in sev:
            org_severity[s] += sev[s]
        org_status['Open'] += open_c
        org_status['In Progress'] += in_progress
        org_status['Patched'] += patched

    all_vulns = Vulnerability.query.all()
    total_all = len(all_vulns)

    _send_vuln_reminders()

    return jsonify({
        'total_vulnerabilities': total_all,
        'total_open': org_open,
        'total_overdue': org_overdue,
        'needs_follow_up': org_follow_up,
        'org_severity': org_severity,
        'org_status': org_status,
        'per_client': per_client,
    })


@vuln_bp.route('/check-reminders', methods=['POST'])
@login_required
def check_reminders(current_user):
    _send_vuln_reminders()
    return jsonify({'message': 'Reminders sent'})

@vuln_bp.route('/users', methods=['GET'])
@login_required
def list_pm_users(current_user):
    users = User.query.filter(User.role.in_(['admin', 'project_manager', 'lead'])).order_by(User.full_name).all()
    return jsonify({'users': [{'id': u.id, 'name': u.full_name or u.first_name} for u in users]})

@vuln_bp.route('/export/<int:account_id>', methods=['GET'])
@login_required
def export_vulnerabilities(current_user, account_id):
    acc = Account.query.get_or_404(account_id)
    vulns = Vulnerability.query.filter_by(account_id=account_id).order_by(Vulnerability.severity.desc(), Vulnerability.fix_deadline.asc()).all()

    rows = []
    for v in vulns:
        days_to_patch = None
        if v.date_patched and v.date_found:
            days_to_patch = (v.date_patched - v.date_found).days
        rows.append({
            'title': v.title,
            'severity': v.severity,
            'status': v.status,
            'date_found': v.date_found.strftime('%d-%b-%Y') if v.date_found else '',
            'fix_deadline': v.fix_deadline.strftime('%d-%b-%Y') if v.fix_deadline else '',
            'date_patched': v.date_patched.strftime('%d-%b-%Y') if v.date_patched else '',
            'days_to_patch': days_to_patch if days_to_patch is not None else '',
            'overdue': 'Yes' if v.status != 'Patched' and v.fix_deadline and v.fix_deadline < datetime.utcnow() else 'No',
        })

    open_count = sum(1 for v in vulns if v.status != 'Patched')
    patched_count = sum(1 for v in vulns if v.status == 'Patched')
    avg_days = None
    patched_with_dates = [v for v in vulns if v.date_patched and v.date_found]
    if patched_with_dates:
        avg_days = sum((v.date_patched - v.date_found).days for v in patched_with_dates) / len(patched_with_dates)

    return jsonify({
        'account_name': acc.company_name,
        'total': len(vulns),
        'open': open_count,
        'patched': patched_count,
        'avg_days_to_patch': round(avg_days, 1) if avg_days is not None else None,
        'rows': rows,
    })
