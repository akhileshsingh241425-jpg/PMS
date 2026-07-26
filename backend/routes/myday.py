import os
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app
from models import db, User, Project, ProjectPhase, ProjectAsset, Task, TaskActivity, Finding, LeaveRequest, ExpenseEntry, DayEndLog, Attendance, ProjectReport, Notification
from middleware.auth import login_required
from werkzeug.utils import secure_filename

myday_bp = Blueprint('myday', __name__, url_prefix='/api/my-day')

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'myday')
os.makedirs(os.path.join(UPLOAD_DIR, 'poc'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, 'bills'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, 'leave'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_DIR, 'reports'), exist_ok=True)

TASK_STATUSES = ['ALLOTTED', 'IN PROGRESS', 'BLOCKED', 'SENT FOR APPROVAL', 'REWORK', 'APPROVED', 'COMPLETED']


def _save_file(upload_type, file):
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    ts = datetime.utcnow().strftime('%Y%m%d%H%M%S%f')[:-3]
    fname = secure_filename(f'{ts}_{file.filename}')
    subdir = os.path.join(UPLOAD_DIR, upload_type)
    os.makedirs(subdir, exist_ok=True)
    path = os.path.join(subdir, fname)
    file.save(path)
    return path


def _notify(user_id, title, message, module_type=None, module_id=None):
    n = Notification(user_id=user_id, title=title, message=message, module_type=module_type, module_id=module_id)
    db.session.add(n)


# ─── STATUS ───────────────────────────────────────────────────────

@myday_bp.route('/status', methods=['GET'])
@login_required
def status(current_user):
    today = date.today()
    att = Attendance.query.filter_by(user_id=current_user.id, date=today).order_by(Attendance.clock_in.desc()).first()
    checked_in = att is not None and att.clock_out is None
    day_end_log = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first() if att else None

    # Check if yesterday's check-out was missed
    from datetime import timedelta
    yesterday = today - timedelta(days=1)
    prev_att = Attendance.query.filter_by(user_id=current_user.id, date=yesterday).order_by(Attendance.clock_in.desc()).first()
    missed_checkout = prev_att is not None and prev_att.clock_out is None

    # Zero-progress check: no task activity in 3+ days
    three_days_ago = today - timedelta(days=3)
    recent_activity = TaskActivity.query.filter(
        TaskActivity.user_id == current_user.id,
        db.func.date(TaskActivity.created_at) >= three_days_ago
    ).first()
    zero_progress_warning = recent_activity is None

    return jsonify({
        'checked_in': checked_in,
        'clock_in_time': att.clock_in.isoformat() if att and att.clock_in else None,
        'work_mode': att.work_mode if att else None,
        'attendance_id': att.id if att else None,
        'day_end_log_submitted': day_end_log is not None,
        'day_end_log_id': day_end_log.id if day_end_log else None,
        'missed_yesterday_checkout': missed_checkout,
        'zero_progress_warning': zero_progress_warning,
    })


# ─── DASHBOARD ────────────────────────────────────────────────────

@myday_bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard(current_user):
    today = date.today()
    tasks = Task.query.filter_by(assigned_to=current_user.id).all()

    pending_tasks = [t for t in tasks if t.status in ('ALLOTTED', 'IN PROGRESS', 'REWORK')]
    sent_for_approval = [t for t in tasks if t.status == 'SENT FOR APPROVAL']
    overdue_tasks = [t for t in tasks if t.due_date and t.due_date < today and t.status not in ('APPROVED', 'COMPLETED')]
    blocked_tasks = [t for t in tasks if t.status == 'BLOCKED']

    att = Attendance.query.filter_by(user_id=current_user.id, date=today).first()
    day_end_log = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first() if att else None

    leave_reqs = LeaveRequest.query.filter_by(user_id=current_user.id).order_by(LeaveRequest.created_at.desc()).limit(5).all()
    expense_reqs = ExpenseEntry.query.filter_by(user_id=current_user.id).order_by(ExpenseEntry.created_at.desc()).limit(5).all()

    return jsonify({
        'stats': {
            'pending_tasks': len(pending_tasks),
            'sent_for_approval': len(sent_for_approval),
            'overdue_tasks': len(overdue_tasks),
            'blocked_tasks': len(blocked_tasks),
        },
        'pending_tasks': [t.to_dict() for t in pending_tasks[:10]],
        'sent_for_approval': [t.to_dict() for t in sent_for_approval[:10]],
        'overdue_tasks': [t.to_dict() for t in overdue_tasks[:10]],
        'blocked_tasks': [t.to_dict() for t in blocked_tasks[:5]],
        'attendance': att.to_dict() if att else None,
        'day_end_log_submitted': day_end_log is not None,
        'recent_leave_requests': [r.to_dict() for r in leave_reqs],
        'recent_expenses': [r.to_dict() for r in expense_reqs],
        'tasks_count': {
            'allotted': sum(1 for t in tasks if t.status == 'ALLOTTED'),
            'in_progress': sum(1 for t in tasks if t.status == 'IN PROGRESS'),
            'blocked': len(blocked_tasks),
            'sent_for_approval': len(sent_for_approval),
            'rework': sum(1 for t in tasks if t.status == 'REWORK'),
            'approved': sum(1 for t in tasks if t.status in ('APPROVED', 'COMPLETED')),
        },
    })


# ─── TASKS ─────────────────────────────────────────────────────────

@myday_bp.route('/tasks', methods=['GET'])
@login_required
def list_tasks(current_user):
    query = Task.query.filter_by(assigned_to=current_user.id)
    if st := request.args.get('status'):
        query = query.filter_by(status=st.upper())
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    tasks = query.order_by(Task.due_date.asc(), Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@myday_bp.route('/tasks/<int:tid>', methods=['GET'])
@login_required
def task_detail(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    findings = Finding.query.filter_by(task_id=tid).order_by(Finding.created_at.desc()).all()
    reports = ProjectReport.query.filter_by(project_id=task.project_id).order_by(ProjectReport.uploaded_at.desc()).all()
    activities = TaskActivity.query.filter_by(task_id=tid).order_by(TaskActivity.created_at.asc()).all()
    return jsonify({
        'task': task.to_dict(),
        'project_phases': [p.to_dict() for p in ProjectPhase.query.filter_by(project_id=task.project_id).order_by(ProjectPhase.order).all()],
        'findings': [f.to_dict() for f in findings],
        'reports': [r.to_dict() for r in reports],
        'activities': [a.to_dict() for a in activities],
    })


@myday_bp.route('/tasks/<int:tid>/status', methods=['PUT'])
@login_required
def update_task_status(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json() or {}
    new_status = data.get('status', task.status)
    old_status = task.status

    valid_transitions = {
        'ALLOTTED': ['IN PROGRESS'],
        'IN PROGRESS': ['BLOCKED', 'SENT FOR APPROVAL'],
        'BLOCKED': ['IN PROGRESS'],
        'SENT FOR APPROVAL': ['IN PROGRESS'],
        'REWORK': ['IN PROGRESS'],
    }
    if old_status in valid_transitions and new_status not in valid_transitions[old_status]:
        return jsonify({'error': f'Cannot transition from {old_status} to {new_status}'}), 400

    task.status = new_status
    if 'actual_hours' in data:
        task.actual_hours = float(data['actual_hours']) if data['actual_hours'] else None
    if 'blocker_reason' in data and new_status == 'BLOCKED':
        task.description = (task.description or '') + f'\n[BLOCKER] {data["blocker_reason"]}'
    db.session.flush()

    act = TaskActivity(task_id=tid, user_id=current_user.id, action='status_change', old_value=old_status, new_value=new_status)
    db.session.add(act)

    if new_status == 'SENT FOR APPROVAL':
        pm = User.query.get(task.project.pm_id) if task.project and task.project.pm_id else None
        if pm:
            _notify(pm.id, f'Task ready for approval', f'{current_user.full_name} submitted "{task.title}" for approval', 'task', tid)

    if new_status == 'BLOCKED':
        pm = User.query.get(task.project.pm_id) if task.project and task.project.pm_id else None
        if pm:
            _notify(pm.id, f'Task blocked', f'{current_user.full_name} blocked "{task.title}": {data.get("blocker_reason", "")}', 'task', tid)

    db.session.commit()
    return jsonify({'task': task.to_dict()})


# ─── PROJECT ASSETS ───────────────────────────────────────────────

@myday_bp.route('/tasks/<int:tid>/assets', methods=['GET'])
@login_required
def list_task_assets(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    assets = ProjectAsset.query.filter_by(project_id=task.project_id).order_by(ProjectAsset.name).all()
    return jsonify({'assets': [a.to_dict() for a in assets]})


# ─── FINDINGS ─────────────────────────────────────────────────────

@myday_bp.route('/tasks/<int:tid>/findings', methods=['GET'])
@login_required
def list_findings(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    findings = Finding.query.filter_by(task_id=tid).order_by(Finding.created_at.desc()).all()
    return jsonify({'findings': [f.to_dict() for f in findings]})


@myday_bp.route('/tasks/<int:tid>/findings', methods=['POST'])
@login_required
def create_finding(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.form.to_dict()
    poc_files = request.files.getlist('poc_files')

    poc_data = []
    for f in poc_files:
        path = _save_file('poc', f)
        poc_data.append({'file_name': f.filename, 'path': path, 'evidence_id': f'EV{len(poc_data) + 1}'})

    asset_id = data.get('asset_id', type=int)
    affected_asset = data.get('affected_asset')
    if asset_id and not affected_asset:
        asset = ProjectAsset.query.get(asset_id)
        affected_asset = asset.name if asset else affected_asset

    finding = Finding(
        task_id=tid,
        project_id=task.project_id,
        phase_id=data.get('phase_id', type=int),
        title=data['title'],
        severity=data.get('severity', 'MEDIUM'),
        cvss_score=float(data['cvss_score']) if data.get('cvss_score') else None,
        affected_asset=affected_asset,
        finding_type=data.get('finding_type'),
        clause_ref=data.get('clause_ref'),
        asset_id=asset_id,
        description=data.get('description'),
        impact=data.get('impact'),
        poc_data=poc_data or None,
        recommendation=data.get('recommendation'),
        cwe_ref=data.get('cwe_ref'),
        created_by=current_user.id,
    )
    db.session.add(finding)
    db.session.commit()
    return jsonify({'finding': finding.to_dict()}), 201


@myday_bp.route('/findings/<int:fid>', methods=['PUT'])
@login_required
def update_finding(current_user, fid):
    finding = Finding.query.get_or_404(fid)
    task = Task.query.get(finding.task_id)
    if task and task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json() or {}
    for f in ('title', 'severity', 'cvss_score', 'affected_asset', 'finding_type', 'clause_ref', 'asset_id', 'description', 'impact', 'recommendation', 'cwe_ref', 'status'):
        if f in data:
            setattr(finding, f, data[f])
    db.session.commit()
    return jsonify({'finding': finding.to_dict()})


@myday_bp.route('/findings/<int:fid>', methods=['DELETE'])
@login_required
def delete_finding(current_user, fid):
    finding = Finding.query.get_or_404(fid)
    task = Task.query.get(finding.task_id)
    if task and task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(finding)
    db.session.commit()
    return jsonify({'message': 'Finding deleted'})


# ─── REPORTS ──────────────────────────────────────────────────────

@myday_bp.route('/tasks/<int:tid>/reports', methods=['POST'])
@login_required
def upload_report(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    path = _save_file('reports', file)
    last_version = db.session.query(db.func.max(ProjectReport.version)).filter_by(project_id=task.project_id).scalar() or 0
    report = ProjectReport(
        project_id=task.project_id,
        report_type=request.form.get('report_type', 'Deliverable'),
        title=request.form.get('title', file.filename),
        description=request.form.get('description'),
        file_name=file.filename,
        file_path=path,
        version=last_version + 1,
        uploaded_by=current_user.id,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'report': report.to_dict()}), 201


@myday_bp.route('/tasks/<int:tid>/reports', methods=['GET'])
@login_required
def list_reports(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    reports = ProjectReport.query.filter_by(project_id=task.project_id).order_by(ProjectReport.uploaded_at.desc()).all()
    return jsonify({'reports': [r.to_dict() for r in reports]})


# ─── TASK ACTIVITY ────────────────────────────────────────────────

@myday_bp.route('/tasks/<int:tid>/activity', methods=['GET'])
@login_required
def task_activity(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    activities = TaskActivity.query.filter_by(task_id=tid).order_by(TaskActivity.created_at.asc()).all()
    return jsonify({'activities': [a.to_dict() for a in activities]})


# ─── LEAVE REQUESTS ───────────────────────────────────────────────

@myday_bp.route('/leave', methods=['GET'])
@login_required
def list_leave(current_user):
    requests = LeaveRequest.query.filter_by(user_id=current_user.id).order_by(LeaveRequest.created_at.desc()).all()
    return jsonify({'leave_requests': [r.to_dict() for r in requests]})


@myday_bp.route('/leave', methods=['POST'])
@login_required
def create_leave(current_user):
    data = request.form.to_dict()
    attachment = request.files.get('attachment')
    attachment_path = None
    if attachment:
        attachment_path = _save_file('leave', attachment)

    req = LeaveRequest(
        user_id=current_user.id,
        leave_type=data['leave_type'],
        from_date=datetime.strptime(data['from_date'], '%Y-%m-%d').date(),
        to_date=datetime.strptime(data['to_date'], '%Y-%m-%d').date(),
        from_time=data.get('from_time'),
        to_time=data.get('to_time'),
        reason=data['reason'],
        attachment_path=attachment_path,
    )
    db.session.add(req)

    pm = User.query.get(current_user.reporting_manager_id) if current_user.reporting_manager_id else None
    if pm:
        _notify(pm.id, f'Leave request: {req.leave_type}',
                f'{current_user.full_name} requested {req.leave_type} from {req.from_date} to {req.to_date}',
                'leave', req.id)

    db.session.commit()
    return jsonify({'leave_request': req.to_dict()}), 201


@myday_bp.route('/leave/<int:lid>', methods=['PUT'])
@login_required
def update_leave(current_user, lid):
    req = LeaveRequest.query.get_or_404(lid)
    if req.user_id != current_user.id or req.status != 'Pending':
        return jsonify({'error': 'Cannot modify'}), 400
    data = request.get_json() or {}
    for f in ('leave_type', 'reason'):
        if f in data:
            setattr(req, f, data[f])
    if 'from_date' in data:
        req.from_date = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
    if 'to_date' in data:
        req.to_date = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
    if 'from_time' in data:
        req.from_time = data['from_time']
    if 'to_time' in data:
        req.to_time = data['to_time']
    db.session.commit()
    return jsonify({'leave_request': req.to_dict()})


@myday_bp.route('/leave/<int:lid>', methods=['DELETE'])
@login_required
def delete_leave(current_user, lid):
    req = LeaveRequest.query.get_or_404(lid)
    if req.user_id != current_user.id or req.status != 'Pending':
        return jsonify({'error': 'Cannot cancel'}), 400
    db.session.delete(req)
    db.session.commit()
    return jsonify({'message': 'Leave request cancelled'})


# ─── EXPENSES ─────────────────────────────────────────────────────

@myday_bp.route('/expenses', methods=['GET'])
@login_required
def list_expenses(current_user):
    query = ExpenseEntry.query.filter_by(user_id=current_user.id)
    if st := request.args.get('status'):
        query = query.filter_by(status=st)
    if dt := request.args.get('date'):
        query = query.filter_by(date=datetime.strptime(dt, '%Y-%m-%d').date())
    entries = query.order_by(ExpenseEntry.date.desc(), ExpenseEntry.created_at.desc()).all()
    return jsonify({'expenses': [e.to_dict() for e in entries]})


@myday_bp.route('/expenses', methods=['POST'])
@login_required
def create_expense(current_user):
    data = request.form.to_dict()
    bill = request.files.get('bill')
    bill_path = None
    if bill:
        bill_path = _save_file('bills', bill)

    entry = ExpenseEntry(
        user_id=current_user.id,
        date=datetime.strptime(data.get('date', date.today().isoformat()), '%Y-%m-%d').date(),
        category=data['category'],
        amount=float(data['amount']),
        reason=data['reason'],
        project_id=int(data['project_id']) if data.get('project_id') else None,
        bill_path=bill_path,
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify({'expense': entry.to_dict()}), 201


@myday_bp.route('/expenses/<int:eid>', methods=['PUT'])
@login_required
def update_expense(current_user, eid):
    entry = ExpenseEntry.query.get_or_404(eid)
    if entry.user_id != current_user.id or entry.status != 'Pending':
        return jsonify({'error': 'Cannot modify'}), 400
    data = request.get_json() or {}
    for f in ('category', 'amount', 'reason'):
        if f in data:
            setattr(entry, f, data[f])
    if 'date' in data:
        entry.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    if 'project_id' in data:
        entry.project_id = int(data['project_id']) if data['project_id'] else None
    db.session.commit()
    return jsonify({'expense': entry.to_dict()})


@myday_bp.route('/expenses/<int:eid>', methods=['DELETE'])
@login_required
def delete_expense(current_user, eid):
    entry = ExpenseEntry.query.get_or_404(eid)
    if entry.user_id != current_user.id or entry.status != 'Pending':
        return jsonify({'error': 'Cannot delete'}), 400
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Expense deleted'})


# ─── DAY-END LOG ──────────────────────────────────────────────────

@myday_bp.route('/day-end-log', methods=['GET'])
@login_required
def get_day_end_log(current_user):
    today = date.today()
    log = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first()
    # Pre-fill touched tasks from today's activity
    touched_task_ids = db.session.query(TaskActivity.task_id).filter(
        TaskActivity.user_id == current_user.id,
        db.func.date(TaskActivity.created_at) == today
    ).distinct().all()
    touched_task_ids = [r[0] for r in touched_task_ids]
    touched_tasks = Task.query.filter(Task.id.in_(touched_task_ids)).all() if touched_task_ids else []
    return jsonify({
        'log': log.to_dict() if log else None,
        'touched_tasks': [t.to_dict() for t in touched_tasks],
    })


@myday_bp.route('/day-end-log', methods=['POST'])
@login_required
def submit_day_end_log(current_user):
    today = date.today()
    att = Attendance.query.filter_by(user_id=current_user.id, date=today).order_by(Attendance.clock_in.desc()).first()
    if not att:
        return jsonify({'error': 'Not checked in today'}), 400

    existing = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first()
    if existing:
        return jsonify({'error': 'Day-end log already submitted for today'}), 400

    data = request.get_json() or {}
    entries = data.get('entries', [])

    # Auto-insert short-leave entry if approved Short Leave exists today
    short_leave = LeaveRequest.query.filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.leave_type == 'Short Leave',
        LeaveRequest.status == 'Approved',
        LeaveRequest.from_date <= today,
        LeaveRequest.to_date >= today,
    ).first()
    if short_leave:
        sl_hours = 0
        if short_leave.from_time and short_leave.to_time:
            try:
                fh, fm = map(int, short_leave.from_time.split(':'))
                th, tm = map(int, short_leave.to_time.split(':'))
                sl_hours = (th * 60 + tm - fh * 60 - fm) / 60
            except (ValueError, TypeError):
                sl_hours = 0
        if sl_hours > 0:
            has_sl_entry = any(e.get('type') == 'short_leave' for e in entries)
            if not has_sl_entry:
                entries.append({
                    'type': 'short_leave',
                    'task_id': None,
                    'description': f'Short Leave ({short_leave.from_time}-{short_leave.to_time})',
                    'hours': sl_hours,
                })

    if not entries:
        return jsonify({'error': 'At least one entry required'}), 400

    total_hours = sum(float(e.get('hours', 0)) for e in entries)

    log = DayEndLog(
        user_id=current_user.id,
        date=today,
        entries=entries,
        total_hours=total_hours,
    )
    db.session.add(log)
    att.day_end_log_submitted = True
    db.session.commit()
    return jsonify({'log': log.to_dict()}), 201


@myday_bp.route('/day-end-log/validate', methods=['GET'])
@login_required
def validate_day_end_log(current_user):
    today = date.today()
    att = Attendance.query.filter_by(user_id=current_user.id, date=today).order_by(Attendance.clock_in.desc()).first()
    if not att or not att.clock_in:
        return jsonify({'valid': False, 'error': 'Not checked in'})

    log = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first()
    if not log:
        return jsonify({'valid': False, 'error': 'Day-end log not submitted'})

    if not att.clock_out:
        return jsonify({'valid': False, 'error': 'Not checked out'})

    duration = (att.clock_out - att.clock_in).total_seconds() / 3600 if att.clock_out else 0
    diff = abs(log.total_hours - duration)
    return jsonify({
        'valid': diff <= 0.5,
        'total_logged_hours': log.total_hours,
        'attendance_duration': round(duration, 2),
        'difference': round(diff, 2),
        'within_limit': diff <= 0.5,
    })


# ─── CHECK-OUT ────────────────────────────────────────────────────

@myday_bp.route('/check-out', methods=['POST'])
@login_required
def check_out(current_user):
    today = date.today()
    att = Attendance.query.filter_by(user_id=current_user.id, date=today, clock_out=None).order_by(Attendance.clock_in.desc()).first()
    if not att:
        return jsonify({'error': 'No active check-in session'}), 400

    log = DayEndLog.query.filter_by(user_id=current_user.id, date=today).first()
    if not log:
        return jsonify({'error': 'Day-end log must be submitted before check-out'}), 400

    att.clock_out = datetime.utcnow()
    log.checked_out_at = datetime.utcnow()

    duration = (att.clock_out - att.clock_in).total_seconds() / 3600
    diff = abs(log.total_hours - duration)
    if diff > 0.5:
        return jsonify({'error': f'Hours mismatch: logged {log.total_hours}h, attendance duration {round(duration, 2)}h. Difference {round(diff, 2)}h exceeds 30 min limit.'}), 400

    pm = User.query.get(current_user.reporting_manager_id) if current_user.reporting_manager_id else None
    if pm:
        _notify(pm.id, f'Day completed', f'{current_user.full_name} checked out — {log.total_hours}h logged today', 'attendance', att.id)

    db.session.commit()
    return jsonify({'attendance': att.to_dict(), 'log': log.to_dict()})


# ─── REQUESTS SUMMARY ─────────────────────────────────────────────

@myday_bp.route('/requests', methods=['GET'])
@login_required
def requests_summary(current_user):
    today = date.today()
    leave_reqs = LeaveRequest.query.filter_by(user_id=current_user.id).order_by(LeaveRequest.created_at.desc()).limit(20).all()
    expense_reqs = ExpenseEntry.query.filter_by(user_id=current_user.id).order_by(ExpenseEntry.date.desc()).limit(20).all()
    return jsonify({
        'leave_requests': [r.to_dict() for r in leave_reqs],
        'expenses': [r.to_dict() for r in expense_reqs],
        'leave_counts': {
            'pending': LeaveRequest.query.filter_by(user_id=current_user.id, status='Pending').count(),
            'approved': LeaveRequest.query.filter_by(user_id=current_user.id, status='Approved').count(),
            'rejected': LeaveRequest.query.filter_by(user_id=current_user.id, status='Rejected').count(),
        },
        'expense_counts': {
            'pending': ExpenseEntry.query.filter_by(user_id=current_user.id, status='Pending').count(),
            'approved': ExpenseEntry.query.filter_by(user_id=current_user.id, status='Approved').count(),
            'reimbursed': ExpenseEntry.query.filter_by(user_id=current_user.id, status='Reimbursed').count(),
        },
        'expense_totals': {
            'claimed': db.session.query(db.func.sum(ExpenseEntry.amount)).filter_by(user_id=current_user.id).scalar() or 0,
            'approved': db.session.query(db.func.sum(ExpenseEntry.amount)).filter_by(user_id=current_user.id, status='Approved').scalar() or 0,
            'reimbursed': db.session.query(db.func.sum(ExpenseEntry.amount)).filter_by(user_id=current_user.id, status='Reimbursed').scalar() or 0,
        },
    })
