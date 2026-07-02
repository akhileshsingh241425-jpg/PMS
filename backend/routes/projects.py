from datetime import datetime
from flask import Blueprint, request, jsonify
import os
from models import db, Project, ProjectRemark, ProjectDocument, ProjectTeam, Task, Meeting, Reminder, Note, User
from models.client_portal import FindingQuery, MeetingRequest
from models.project import PROJECT_STAGES
from middleware.auth import login_required, permission_required, role_required
from utils import validate_file, safe_filename, generate_id, paginate

project_bp = Blueprint('projects', __name__, url_prefix='/api/projects')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'projects')
os.makedirs(UPLOAD_DIR, exist_ok=True)


@project_bp.route('', methods=['GET'])
@login_required
def list_projects(current_user):
    query = Project.query
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
@permission_required('projects_create')
def create_project(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('account_id'):
        return jsonify({'error': 'title and account_id required'}), 400
    try:
        account_id = int(data['account_id'])
        lead_id = int(data['lead_id']) if data.get('lead_id') else None
        pm_id = int(data['pm_id']) if data.get('pm_id') else None
        total_value = float(data['total_value']) if data.get('total_value') else None
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None
        target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for numeric or date fields'}), 400
    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=data['title'],
        description=data.get('description'),
        stage=data.get('stage', 'Initiated'),
        service_type=data.get('service_type'),
        account_id=account_id,
        lead_id=lead_id,
        pm_id=pm_id,
        total_value=total_value,
        start_date=start_date,
        target_date=target_date,
        is_client_review_enabled=data.get('is_client_review_enabled', False),
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.commit()
    return jsonify({'message': 'Created', 'project': proj.to_dict()}), 201


@project_bp.route('/<int:pid>', methods=['GET'])
@login_required
def get_project(current_user, pid):
    proj = Project.query.get_or_404(pid)
    return jsonify({
        'project': proj.to_dict(),
        'remarks': [r.to_dict() for r in proj.remarks],
        'documents': [d.to_dict() for d in proj.documents],
        'team': [t.to_dict() for t in proj.team],
        'tasks': [t.to_dict() for t in Task.query.filter_by(module_type='project', module_id=pid).order_by(Task.created_at.desc()).all()],
        'meetings': [m.to_dict() for m in Meeting.query.filter_by(module_type='project', module_id=pid).order_by(Meeting.created_at.desc()).all()],
        'reminders': [r.to_dict() for r in Reminder.query.filter_by(module_type='project', module_id=pid).order_by(Reminder.remind_at.desc()).all()],
        'notes': [n.to_dict() for n in Note.query.filter_by(module_type='project', module_id=pid).order_by(Note.created_at.desc()).all()],
        'queries': [q.to_dict() for q in FindingQuery.query.filter_by(project_id=pid).order_by(FindingQuery.created_at.desc()).all()],
        'meeting_requests': [m.to_dict() for m in MeetingRequest.query.filter_by(project_id=pid).order_by(MeetingRequest.created_at.desc()).all()],
    })


@project_bp.route('/<int:pid>', methods=['PUT'])
@permission_required('projects_edit')
def update_project(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json()
    for f in ['title', 'description', 'stage', 'service_type', 'is_client_review_enabled']:
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
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format for numeric or date fields'}), 400
    db.session.commit()
    return jsonify({'project': proj.to_dict()})


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


@project_bp.route('/documents/<int:did>/review', methods=['POST'])
@role_required('super_admin')
def review_doc(current_user, did):
    """Manager approves/rejects a document."""
    doc = ProjectDocument.query.get_or_404(did)
    data = request.get_json()
    doc.review_status = data.get('status', 'Approved')  # Approved or Rejected
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


@project_bp.route('/stages', methods=['GET'])
@login_required
def stages(current_user):
    return jsonify({'stages': PROJECT_STAGES})
