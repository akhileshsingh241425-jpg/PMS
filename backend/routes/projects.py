from datetime import datetime
from flask import Blueprint, request, jsonify
import os
from models import db, Project, ProjectRemark, ProjectRemarkReaction, ProjectDocument, ProjectReport, ProjectTeam, ProjectPhase, Task, Meeting, Note, User, ProjectRisk, ProjectIssue, ProjectMilestone, ProjectInvoice, ProjectTimesheet, ProjectChangeRequest, ApprovalHistory, PoPayment
from models.client_portal import MeetingRequest, FindingQuery
from middleware.auth import login_required, role_required
from utils import validate_file, safe_filename, generate_id, paginate

project_bp = Blueprint('projects', __name__, url_prefix='/api/projects')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'projects')
os.makedirs(UPLOAD_DIR, exist_ok=True)

PROJECT_STAGES = [
    'Initiated', 'Planning', 'Information Gathering', 'Execution', 'Internal Review', 'Client Review', 'Remediation Support', 'Final Delivery',
    'Invoice Raised', 'Payment Pending', 'Partial Payment Received', 'Full Payment Received',
    'Closed',
    'On Hold', 'Delayed', 'Cancelled', 'Escalated',
    'Awaiting Client Response', 'Awaiting Documents', 'Awaiting Payment',
]


@project_bp.route('', methods=['GET'])
@login_required
def list_projects(current_user):
    query = Project.query
    if current_user.role != 'admin':
        user_project_ids = [t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()]
        query = query.filter(db.or_(
            Project.pm_id == current_user.id,
            Project.created_by == current_user.id,
            Project.id.in_(user_project_ids),
        ))
    if s := request.args.get('search'):
        query = query.filter(db.or_(Project.title.ilike(f'%{s}%'), Project.proj_id.ilike(f'%{s}%')))
    if st := request.args.get('stage'):
        query = query.filter_by(stage=st)
    if aid := request.args.get('account_id'):
        query = query.filter_by(account_id=int(aid))
    query = query.order_by(Project.updated_at.desc())
    result = paginate(query, request)
    return jsonify({'projects': [p.to_dict() for p in result['items']], 'pagination': {'page': result['page'], 'per_page': result['per_page'], 'total': result['total'], 'pages': result['pages']}})


@project_bp.route('', methods=['POST'])
@login_required
def create_project(current_user):
    data = request.get_json()
    direction = data.get('direction', 'IN')
    if not data.get('title'):
        return jsonify({'error': 'title is required'}), 400
    if direction == 'IN' and not data.get('account_id'):
        return jsonify({'error': 'Client account is required for IN projects'}), 400
    if direction == 'OUT' and not data.get('vendor_name'):
        return jsonify({'error': 'Vendor name is required for OUT projects'}), 400
    if not data.get('pm_id'):
        return jsonify({'error': 'Project Manager (pm_id) is required'}), 400
    try:
        account_id = int(data['account_id']) if data.get('account_id') else None
        pm_id = int(data['pm_id'])
        total_value = float(data['total_value']) if data.get('total_value') else None
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None
        po_date = datetime.strptime(data['po_date'], '%Y-%m-%d').date() if data.get('po_date') else None
        po_amount = float(data['po_amount']) if data.get('po_amount') else None
        tds = float(data['tds']) if data.get('tds') else None
        gst = float(data['gst']) if data.get('gst') else None
        net_amount = float(data['net_amount']) if data.get('net_amount') else None
        advance_paid = float(data['advance_paid']) if data.get('advance_paid') else None
        balance_outstanding = float(data['balance_outstanding']) if data.get('balance_outstanding') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for numeric or date fields'}), 400
    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=data['title'],
        description=data.get('description'),
        stage=data.get('stage', 'Created'),
        service_type=data.get('service_type'),
        account_id=account_id,
        pm_id=pm_id,
        total_value=total_value,
        start_date=start_date,
        target_date=target_date,
        is_client_review_enabled=data.get('is_client_review_enabled', False),
        po_number=data.get('po_number'),
        po_date=po_date,
        po_amount=po_amount,
        po_terms=data.get('po_terms'),
        project_type=data.get('project_type'),
        tds=tds,
        gst=gst,
        net_amount=net_amount,
        direction=direction,
        vendor_name=data.get('vendor_name'),
        po_template=data.get('po_template'),
        approval_status=data.get('approval_status', 'Pending'),
        send_method=data.get('send_method'),
        advance_paid=advance_paid,
        balance_outstanding=balance_outstanding,
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.commit()
    return jsonify({'message': 'Created', 'project': proj.to_dict()}), 201


@project_bp.route('/<int:pid>', methods=['GET'])
@login_required
def get_project(current_user, pid):
    proj = Project.query.get_or_404(pid)
    all_tasks = Task.query.filter_by(project_id=pid).order_by(Task.created_at.desc()).all()
    open_tasks = [t for t in all_tasks if t.status != 'Completed']
    team = ProjectTeam.query.filter_by(project_id=pid).all()
    member_ids = [t.user_id for t in team if t.user_id]
    phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()
    return jsonify({
        'project': proj.to_dict(),
        'remarks': [r.to_dict() for r in proj.remarks],
        'documents': [d.to_dict() for d in proj.documents],
        'team': [t.to_dict() for t in team],
        'tasks': [t.to_dict() for t in all_tasks],
        'open_tasks_count': len(open_tasks),
        'team_member_ids': member_ids,
        'phases': [p.to_dict() for p in phases],
        'meetings': [m.to_dict() for m in Meeting.query.filter_by(project_id=pid).order_by(Meeting.created_at.desc()).all()],
        'notes': [n.to_dict() for n in Note.query.filter_by(project_id=pid).order_by(Note.created_at.desc()).all()],
        'queries': [q.to_dict() for q in FindingQuery.query.filter_by(project_id=pid).order_by(FindingQuery.created_at.desc()).all()],
        'meeting_requests': [m.to_dict() for m in MeetingRequest.query.filter_by(project_id=pid).order_by(MeetingRequest.created_at.desc()).all()],
        'risks': [r.to_dict() for r in ProjectRisk.query.filter_by(project_id=pid).order_by(ProjectRisk.created_at.desc()).all()],
        'issues': [i.to_dict() for i in ProjectIssue.query.filter_by(project_id=pid).order_by(ProjectIssue.created_at.desc()).all()],
        'milestones': [m.to_dict() for m in ProjectMilestone.query.filter_by(project_id=pid).order_by(ProjectMilestone.due_date.asc()).all()],
        'invoices': [i.to_dict() for i in ProjectInvoice.query.filter_by(project_id=pid).order_by(ProjectInvoice.created_at.desc()).all()],
        'timesheets': [t.to_dict() for t in ProjectTimesheet.query.filter_by(project_id=pid).order_by(ProjectTimesheet.date.desc()).all()],
        'change_requests': [c.to_dict() for c in ProjectChangeRequest.query.filter_by(project_id=pid).order_by(ProjectChangeRequest.created_at.desc()).all()],
        'approval_history': [a.to_dict() for a in ApprovalHistory.query.filter_by(module_type='project', module_id=pid).order_by(ApprovalHistory.created_at.desc()).all()],
        'po_payments': [p.to_dict() for p in PoPayment.query.filter_by(po_id=pid).order_by(PoPayment.date.desc()).all()],
    })


@project_bp.route('/<int:pid>', methods=['PUT'])
@login_required
def update_project(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json()
    for f in ['title', 'description', 'stage', 'service_type', 'is_client_review_enabled', 'po_number', 'po_terms', 'project_type', 'po_document_id', 'direction', 'vendor_name', 'po_template', 'approval_status', 'send_method', 'po_out_status', 'po_rejected_reason', 'po_sent_via', 'po_next_due_date']:
        if f in data:
            setattr(proj, f, data[f])
    try:
        if 'pm_id' in data:
            proj.pm_id = int(data['pm_id']) if data['pm_id'] else None
        if 'total_value' in data:
            proj.total_value = float(data['total_value']) if data['total_value'] else None
        if 'start_date' in data:
            proj.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'target_date' in data:
            proj.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data['target_date'] else None
        if 'po_date' in data:
            proj.po_date = datetime.strptime(data['po_date'], '%Y-%m-%d').date() if data['po_date'] else None
        if 'po_amount' in data:
            proj.po_amount = float(data['po_amount']) if data['po_amount'] else None
        if 'tds' in data:
            proj.tds = float(data['tds']) if data['tds'] else None
        if 'gst' in data:
            proj.gst = float(data['gst']) if data['gst'] else None
        if 'net_amount' in data:
            proj.net_amount = float(data['net_amount']) if data['net_amount'] else None
        if 'advance_paid' in data:
            proj.advance_paid = float(data['advance_paid']) if data['advance_paid'] else 0
        if 'balance_outstanding' in data:
            proj.balance_outstanding = float(data['balance_outstanding']) if data['balance_outstanding'] else 0
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for numeric or date fields'}), 400
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/generate-plan', methods=['POST'])
@login_required
def generate_plan(current_user, pid):
    from models.project import PLAN_TEMPLATES
    proj = Project.query.get_or_404(pid)
    if proj.plan_generated:
        return jsonify({'error': 'Plan already generated'}), 400
    ptype = proj.project_type
    if not ptype:
        return jsonify({'error': 'Project type not set. Set project_type (VAPT, IS Audit, ISMS Implementation)'}), 400
    template = PLAN_TEMPLATES.get(ptype)
    if not template:
        return jsonify({'error': f'No template found for project type: {ptype}'}), 400
    for i, phase_data in enumerate(template):
        phase = ProjectPhase(project_id=pid, name=phase_data['phase'], order=i, status='Pending')
        db.session.add(phase)
        db.session.flush()
        for task_title in phase_data['tasks']:
            task = Task(
                title=task_title,
                project_id=pid,
                phase_id=phase.id,
                status='Open',
                priority='Normal',
                created_by=current_user.id,
            )
            db.session.add(task)
    proj.plan_generated = True
    if proj.stage == 'Created':
        proj.stage = 'Initiated'
    db.session.commit()
    phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()
    return jsonify({'message': 'Plan generated', 'phases': [p.to_dict() for p in phases]}), 201


@project_bp.route('/<int:pid>/phases', methods=['POST'])
@login_required
def create_phase(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Phase name required'}), 400
    max_order = db.session.query(db.func.max(ProjectPhase.order)).filter_by(project_id=pid).scalar() or -1
    phase = ProjectPhase(project_id=pid, name=name, order=max_order + 1, status='Pending')
    db.session.add(phase)
    proj = Project.query.get(pid)
    if not proj.plan_generated:
        proj.plan_generated = True
    db.session.commit()
    return jsonify({'phase': phase.to_dict()}), 201


@project_bp.route('/<int:pid>/phases/<int:phase_id>/tasks', methods=['POST'])
@login_required
def add_task_to_phase(current_user, pid, phase_id):
    Project.query.get_or_404(pid)
    phase = ProjectPhase.query.filter_by(id=phase_id, project_id=pid).first_or_404()
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    try:
        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format'}), 400
    task = Task(
        title=data['title'],
        description=data.get('description'),
        project_id=pid,
        phase_id=phase_id,
        status=data.get('status', 'Open'),
        priority=data.get('priority', 'Normal'),
        due_date=due_date,
        assigned_to=int(data['assigned_to']) if data.get('assigned_to') else None,
        created_by=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@project_bp.route('/<int:pid>/tasks/<int:task_id>/subtasks', methods=['POST'])
@login_required
def add_subtask(current_user, pid, task_id):
    Project.query.get_or_404(pid)
    parent = Task.query.filter_by(id=task_id, project_id=pid).first_or_404()
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    try:
        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid date format'}), 400
    subtask = Task(
        title=data['title'],
        description=data.get('description'),
        project_id=pid,
        phase_id=parent.phase_id,
        parent_task_id=task_id,
        status=data.get('status', 'Open'),
        priority=data.get('priority', 'Normal'),
        due_date=due_date,
        assigned_to=int(data['assigned_to']) if data.get('assigned_to') else None,
        created_by=current_user.id,
    )
    db.session.add(subtask)
    db.session.commit()
    return jsonify({'subtask': subtask.to_dict()}), 201


@project_bp.route('/<int:pid>/phases/<int:phase_id>/tasks', methods=['GET'])
@login_required
def list_phase_tasks(current_user, pid, phase_id):
    Project.query.get_or_404(pid)
    ProjectPhase.query.filter_by(id=phase_id, project_id=pid).first_or_404()
    tasks = Task.query.filter_by(project_id=pid, phase_id=phase_id, parent_task_id=None).order_by(Task.created_at.asc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@project_bp.route('/<int:pid>/phases/<int:phase_id>/apply-template', methods=['POST'])
@login_required
def apply_phase_template(current_user, pid, phase_id):
    Project.query.get_or_404(pid)
    phase = ProjectPhase.query.filter_by(id=phase_id, project_id=pid).first_or_404()
    data = request.get_json()
    tasks_data = data.get('tasks', [])
    if not tasks_data:
        return jsonify({'error': 'No tasks provided'}), 400
    created = []
    for td in tasks_data:
        if not td.get('title'):
            continue
        due_date = None
        if td.get('due_date'):
            try:
                due_date = datetime.strptime(td['due_date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        task = Task(
            title=td['title'],
            description=td.get('description'),
            project_id=pid,
            phase_id=phase_id,
            status=td.get('status', 'Open'),
            priority=td.get('priority', 'Normal'),
            due_date=due_date,
            assigned_to=int(td['assigned_to']) if td.get('assigned_to') else None,
            created_by=current_user.id,
        )
        db.session.add(task)
        created.append(task)
    db.session.commit()
    return jsonify({'tasks': [t.to_dict() for t in created]}), 201


@project_bp.route('/<int:pid>/phases/<int:phase_id>', methods=['DELETE'])
@login_required
def delete_phase(current_user, pid, phase_id):
    Project.query.get_or_404(pid)
    phase = ProjectPhase.query.filter_by(id=phase_id, project_id=pid).first_or_404()
    Task.query.filter_by(phase_id=phase_id).delete()
    db.session.delete(phase)
    db.session.commit()
    return jsonify({'message': 'Phase deleted'})


@project_bp.route('/<int:pid>/tasks/<int:task_id>/subtasks', methods=['GET'])
@login_required
def list_subtasks(current_user, pid, task_id):
    Project.query.get_or_404(pid)
    Task.query.filter_by(id=task_id, project_id=pid).first_or_404()
    subtasks = Task.query.filter_by(parent_task_id=task_id).order_by(Task.created_at.asc()).all()
    return jsonify({'subtasks': [t.to_dict() for t in subtasks]})


@project_bp.route('/<int:pid>/remarks/<int:rid>/react', methods=['POST'])
@login_required
def toggle_reaction(current_user, pid, rid):
    r = ProjectRemark.query.get_or_404(rid)
    if r.project_id != pid:
        return jsonify({'error': 'Remark not in project'}), 404
    data = request.get_json()
    emoji = data.get('emoji')
    if not emoji:
        return jsonify({'error': 'emoji required'}), 400
    existing = ProjectRemarkReaction.query.filter_by(remark_id=rid, user_id=current_user.id, emoji=emoji).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
    else:
        rr = ProjectRemarkReaction(remark_id=rid, user_id=current_user.id, emoji=emoji)
        db.session.add(rr)
        db.session.commit()
    return jsonify({'remark': r.to_dict()})


@project_bp.route('/<int:pid>/remarks', methods=['POST'])
@login_required
def add_remark(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    r = ProjectRemark(project_id=pid, text=data['text'], created_by=current_user.id)
    db.session.add(r)
    db.session.commit()
    return jsonify({'remark': r.to_dict()}), 201


@project_bp.route('/<int:pid>/remarks/<int:rid>', methods=['PUT'])
@login_required
def update_remark(current_user, pid, rid):
    r = ProjectRemark.query.filter_by(id=rid, project_id=pid).first_or_404()
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    r.text = data['text']
    db.session.commit()
    return jsonify({'remark': r.to_dict()})


@project_bp.route('/<int:pid>/documents', methods=['POST'])
@login_required
def upload_doc(current_user, pid):
    Project.query.get_or_404(pid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    fname = safe_filename(f'proj_{pid}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    doc = ProjectDocument(
        project_id=pid, file_name=file.filename, file_path=path,
        file_type=fname.rsplit('.', 1)[-1] if '.' in fname else '',
        category=request.form.get('category', 'Report'),
        is_client_visible=request.form.get('is_client_visible', 'false') == 'true',
        review_status='Pending',
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@project_bp.route('/documents/<int:did>', methods=['GET'])
@login_required
def serve_document(current_user, did):
    d = ProjectDocument.query.get_or_404(did)
    if not os.path.exists(d.file_path):
        return jsonify({'error': 'File not found'}), 404
    from flask import send_file
    mimetype = 'application/octet-stream'
    ext = d.file_name.rsplit('.', 1)[-1].lower() if '.' in d.file_name else ''
    if ext in ('jpg','jpeg'): mimetype = 'image/jpeg'
    elif ext == 'png': mimetype = 'image/png'
    elif ext in ('gif','webp','bmp','svg'): mimetype = f'image/{ext}'
    elif ext == 'pdf': mimetype = 'application/pdf'
    return send_file(d.file_path, mimetype=mimetype, as_attachment=False, download_name=d.file_name)


@project_bp.route('/documents/<int:did>/review', methods=['POST'])
@role_required('admin')
def review_doc(current_user, did):
    doc = ProjectDocument.query.get_or_404(did)
    data = request.get_json()
    doc.review_status = data.get('status', 'Approved')
    doc.reviewer_remarks = data.get('remarks')
    doc.reviewed_by = current_user.id
    if data.get('status') == 'Approved' and data.get('make_client_visible'):
        doc.is_client_visible = True
    db.session.commit()
    return jsonify({'document': doc.to_dict()})


@project_bp.route('/<int:pid>/team', methods=['GET'])
@login_required
def get_team(current_user, pid):
    Project.query.get_or_404(pid)
    return jsonify({'team': [t.to_dict() for t in ProjectTeam.query.filter_by(project_id=pid).all()]})


@project_bp.route('/<int:pid>/team', methods=['POST'])
@login_required
def add_team_member(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('user_id'):
        return jsonify({'error': 'user_id required'}), 400
    existing = ProjectTeam.query.filter_by(project_id=pid, user_id=int(data['user_id'])).first()
    if existing:
        return jsonify({'error': 'User already in team'}), 409
    member = ProjectTeam(project_id=pid, user_id=int(data['user_id']), role_in_project=data.get('role_in_project'))
    db.session.add(member)
    db.session.commit()
    return jsonify({'member': member.to_dict()}), 201


@project_bp.route('/team/<int:tid>', methods=['DELETE'])
@login_required
def remove_team_member(current_user, tid):
    member = ProjectTeam.query.get_or_404(tid)
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Removed'})


@project_bp.route('/<int:pid>/meetings', methods=['POST'])
@login_required
def add_meeting(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('title') or not data.get('meeting_date') or not data.get('meeting_link'):
        return jsonify({'error': 'title, meeting_date, and meeting_link are required'}), 400
    m = Meeting(
        title=data['title'],
        description=data.get('description'),
        project_id=pid,
        meeting_date=datetime.fromisoformat(data['meeting_date'].replace('Z', '+00:00')),
        meeting_link=data['meeting_link'],
        status=data.get('status', 'Scheduled'),
        created_by=current_user.id,
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'meeting': m.to_dict()}), 201


@project_bp.route('/<int:pid>/notes', methods=['POST'])
@login_required
def add_note(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'content required'}), 400
    n = Note(project_id=pid, content=data['content'], created_by=current_user.id)
    db.session.add(n)
    db.session.commit()
    return jsonify({'note': n.to_dict()}), 201


UPLOAD_DIR_REPORTS = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'reports')
os.makedirs(UPLOAD_DIR_REPORTS, exist_ok=True)


@project_bp.route('/<int:pid>/reports', methods=['GET'])
@login_required
def list_reports(current_user, pid):
    Project.query.get_or_404(pid)
    reports = ProjectReport.query.filter_by(project_id=pid).order_by(ProjectReport.uploaded_at.desc()).all()
    return jsonify({'reports': [r.to_dict() for r in reports]})


@project_bp.route('/<int:pid>/reports', methods=['POST'])
@login_required
def upload_report(current_user, pid):
    Project.query.get_or_404(pid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    report_type = request.form.get('report_type', 'working')
    if report_type not in ('working', 'final'):
        return jsonify({'error': 'report_type must be working or final'}), 400
    title = request.form.get('title', file.filename)
    fname = safe_filename(f'report_proj_{pid}', file.filename)
    path = os.path.join(UPLOAD_DIR_REPORTS, fname)
    file.save(path)
    report = ProjectReport(
        project_id=pid,
        report_type=report_type,
        title=title,
        description=request.form.get('description', ''),
        file_name=file.filename,
        file_path=path,
        version=int(request.form.get('version', 1)),
        uploaded_by=current_user.id,
    )
    db.session.add(report)
    db.session.commit()
    return jsonify({'report': report.to_dict()}), 201


@project_bp.route('/<int:pid>/reports/<int:rid>', methods=['DELETE'])
@login_required
def delete_report(current_user, pid, rid):
    r = ProjectReport.query.filter_by(id=rid, project_id=pid).first_or_404()
    if os.path.exists(r.file_path):
        os.remove(r.file_path)
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Report deleted'})


@project_bp.route('/reports/<int:rid>', methods=['GET'])
@login_required
def serve_report(current_user, rid):
    r = ProjectReport.query.get_or_404(rid)
    if not os.path.exists(r.file_path):
        return jsonify({'error': 'File not found'}), 404
    from flask import send_file
    return send_file(r.file_path, as_attachment=False, download_name=r.file_name)


@project_bp.route('/stages', methods=['GET'])
@login_required
def stages(current_user):
    return jsonify({'stages': PROJECT_STAGES})


# ──────── PO OUT Workflow ────────

PO_OUT_STATUSES = ['Draft', 'Pending Approval', 'Rejected', 'Approved', 'Sent', 'In Progress', 'Payment Pending', 'Closed']

def calc_balance(pid):
    proj = Project.query.get(pid)
    paid = db.session.query(db.func.coalesce(db.func.sum(PoPayment.amount), 0)).filter(PoPayment.po_id == pid).scalar()
    bal = (proj.net_amount or proj.po_amount or 0) - paid
    proj.advance_paid = paid
    proj.balance_outstanding = max(bal, 0)
    if bal <= 0:
        proj.po_out_status = 'Closed'
    elif proj.po_work_completed and bal > 0:
        proj.po_out_status = 'Payment Pending'
    db.session.commit()


@project_bp.route('/<int:pid>/po-out/approve', methods=['POST'])
@login_required
def approve_po_out(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    if proj.po_out_status != 'Pending Approval':
        return jsonify({'error': f'Cannot approve in status: {proj.po_out_status}'}), 400
    proj.po_out_status = 'Approved'
    proj.po_approver_id = current_user.id
    proj.po_approved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/reject', methods=['POST'])
@login_required
def reject_po_out(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    if proj.po_out_status != 'Pending Approval':
        return jsonify({'error': f'Cannot reject in status: {proj.po_out_status}'}), 400
    data = request.get_json()
    proj.po_out_status = 'Rejected'
    proj.po_rejected_reason = data.get('reason', '')
    proj.po_approver_id = current_user.id
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/resubmit', methods=['POST'])
@login_required
def resubmit_po_out(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    if proj.po_out_status != 'Rejected':
        return jsonify({'error': 'Can only resubmit from Rejected status'}), 400
    proj.po_out_status = 'Pending Approval'
    proj.po_resubmitted_at = datetime.utcnow()
    proj.po_rejected_reason = None
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/send', methods=['POST'])
@login_required
def send_po_out(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    if proj.po_out_status != 'Approved':
        return jsonify({'error': 'Must be Approved first'}), 400
    data = request.get_json()
    proj.po_out_status = 'Sent'
    proj.po_sent_via = data.get('send_via', 'Download PDF')
    proj.po_sent_date = datetime.utcnow()
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/work-start', methods=['POST'])
@login_required
def po_work_start(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    proj.po_out_status = 'In Progress'
    proj.po_work_started = True
    proj.po_work_started_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/work-complete', methods=['POST'])
@login_required
def po_work_complete(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    proj.po_work_completed = True
    proj.po_work_completed_at = datetime.utcnow()
    if (proj.balance_outstanding or 0) <= 0:
        proj.po_out_status = 'Closed'
    else:
        proj.po_out_status = 'Payment Pending'
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


@project_bp.route('/<int:pid>/po-out/payments', methods=['GET'])
@login_required
def list_po_payments(current_user, pid):
    Project.query.get_or_404(pid)
    payments = PoPayment.query.filter_by(po_id=pid).order_by(PoPayment.date.desc()).all()
    return jsonify({'payments': [p.to_dict() for p in payments]})


@project_bp.route('/<int:pid>/po-out/payments', methods=['POST'])
@login_required
def add_po_payment(current_user, pid):
    proj = Project.query.get_or_404(pid)
    if proj.direction != 'OUT':
        return jsonify({'error': 'Not an OUT project'}), 400
    data = request.get_json()
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({'error': 'Amount must be positive'}), 400
    try:
        pay_date = datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else datetime.utcnow().date()
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    pay = PoPayment(po_id=pid, amount=amount, date=pay_date, mode=data.get('mode'), remarks=data.get('remarks'), created_by=current_user.id)
    db.session.add(pay)
    db.session.flush()
    calc_balance(pid)
    return jsonify({'payment': pay.to_dict(), 'project': proj.to_dict()}), 201


@project_bp.route('/po-out/payments/<int:pay_id>', methods=['DELETE'])
@login_required
def delete_po_payment(current_user, pay_id):
    pay = PoPayment.query.get_or_404(pay_id)
    pid = pay.po_id
    db.session.delete(pay)
    db.session.flush()
    calc_balance(pid)
    proj = Project.query.get(pid)
    return jsonify({'payment': pay.to_dict(), 'project': proj.to_dict() if proj else None})


@project_bp.route('/documents/<int:did>/verify', methods=['POST'])
@login_required
def verify_document(current_user, did):
    doc = ProjectDocument.query.get_or_404(did)
    data = request.get_json()
    doc.is_verified = data.get('is_verified', True)
    doc.verified_by = current_user.id
    doc.verified_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'document': doc.to_dict()})
