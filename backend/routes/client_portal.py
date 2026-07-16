"""Client Portal API — meeting requests, uploads, queries, notes."""
import jwt, os
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from models import db, User, Account, Project, ProjectDocument, MeetingRequestDocument, Note
from models.client_portal import MeetingRequest, ClientUpload, FindingQuery
from utils import validate_file, safe_filename, rate_limit

portal_bp = Blueprint('portal', __name__, url_prefix='/api/portal')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'client')
os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_client_token(client_user):
    return jwt.encode({'user_id': client_user.id, 'account_id': client_user.account_id, 'type': 'client', 'exp': datetime.utcnow() + timedelta(hours=24)}, current_app.config['SECRET_KEY'], algorithm='HS256')


def client_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            if data.get('type') != 'client':
                return jsonify({'error': 'Invalid token'}), 401
            user = User.query.get(data['user_id'])
            if not user or not user.is_active:
                return jsonify({'error': 'Inactive'}), 401
            # Auto-fix missing account_id on any request
            if not user.account_id:
                acc = Account.query.filter_by(company_name=user.client_company_name).first()
                if not acc:
                    acc = Account.query.order_by(Account.id.desc()).first()
                if acc:
                    user.account_id = acc.id
                    db.session.commit()
            return f(user, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
    return wrapper


# AUTH
@portal_bp.route('/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=60)
def client_login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email'), role='client').first()
    if not user or not user.check_password(data.get('password', '')):
        return jsonify({'error': 'Invalid credentials'}), 401
    if not user.is_active:
        return jsonify({'error': 'Account inactive'}), 403

    # Auto-fix missing account_id
    if not user.account_id:
        acc = Account.query.filter_by(company_name=user.client_company_name).first()
        if not acc:
            acc = Account.query.order_by(Account.id.desc()).first()
        if acc:
            user.account_id = acc.id
            db.session.commit()

    return jsonify({'token': generate_client_token(user), 'user': user.to_dict()})


@portal_bp.route('/me', methods=['GET'])
@client_auth
def client_me(user):
    return jsonify({'user': user.to_dict()})


@portal_bp.route('/me', methods=['PUT'])
@client_auth
def update_profile(user):
    data = request.get_json()
    if 'name' in data: user.first_name = data['name']
    if 'phone' in data: user.phone = data['phone']
    if data.get('new_password'):
        if not user.check_password(data.get('current_password', '')):
            return jsonify({'error': 'Current password incorrect'}), 400
        if len(data['new_password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        user.set_password(data['new_password'])
    db.session.commit()
    return jsonify({'user': user.to_dict()})


# DASHBOARD
@portal_bp.route('/dashboard', methods=['GET'])
@client_auth
def dashboard(user):
    projects = Project.query.filter_by(account_id=user.account_id).all()
    active_projects = [p for p in projects if p.stage not in ('Closed', 'Cancelled')]
    meetings = MeetingRequest.query.filter_by(account_id=user.account_id, status='Confirmed').count()
    queries_open = FindingQuery.query.filter_by(account_id=user.account_id, status='Open').count()
    return jsonify({
        'active_projects': len(active_projects),
        'total_projects': len(projects),
        'upcoming_meetings': meetings,
        'open_queries': queries_open,
        'projects': [{'id': p.id, 'proj_id': p.proj_id, 'title': p.title, 'stage': p.stage, 'service_type': p.service_type, 'pm_name': p.pm.full_name if p.pm else None} for p in active_projects[:5]],
    })


# PROJECTS
@portal_bp.route('/projects', methods=['GET'])
@client_auth
def client_projects(user):
    projects = Project.query.filter_by(account_id=user.account_id).order_by(Project.updated_at.desc()).all()
    return jsonify({'projects': [{'id': p.id, 'proj_id': p.proj_id, 'title': p.title, 'service_type': p.service_type, 'stage': p.stage, 'start_date': p.start_date.isoformat() if p.start_date else None, 'target_date': p.target_date.isoformat() if p.target_date else None, 'pm_name': p.pm.full_name if p.pm else None, 'updated_at': p.updated_at.isoformat() if p.updated_at else None} for p in projects]})


@portal_bp.route('/projects/<int:pid>', methods=['GET'])
@client_auth
def client_project_detail(user, pid):
    project = Project.query.get_or_404(pid)
    if project.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    docs = ProjectDocument.query.filter_by(project_id=pid, is_client_visible=True, review_status='Approved').order_by(ProjectDocument.uploaded_at.desc()).all()
    notes = Note.query.filter_by(project_id=pid).order_by(Note.created_at.desc()).all()
    uploads = ClientUpload.query.filter_by(project_id=pid, account_id=user.account_id).order_by(ClientUpload.uploaded_at.desc()).all()
    return jsonify({
        'project': {'id': project.id, 'proj_id': project.proj_id, 'title': project.title, 'description': project.description, 'service_type': project.service_type, 'stage': project.stage, 'start_date': project.start_date.isoformat() if project.start_date else None, 'target_date': project.target_date.isoformat() if project.target_date else None, 'pm_name': project.pm.full_name if project.pm else None, 'is_client_review_enabled': project.is_client_review_enabled},
        'documents': [d.to_dict() for d in docs],
        'notes': [n.to_dict() for n in notes],
        'client_uploads': [u.to_dict() for u in uploads],
    })


# NOTES
@portal_bp.route('/projects/<int:pid>/notes', methods=['POST'])
@client_auth
def client_add_note(user, pid):
    project = Project.query.get_or_404(pid)
    if project.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    if not project.is_client_review_enabled:
        return jsonify({'error': 'Client review not enabled'}), 403
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'content required'}), 400
    note = Note(content=data['content'], project_id=pid, is_client_note=True, created_by=user.id)
    db.session.add(note)
    db.session.commit()
    return jsonify({'note': note.to_dict()}), 201


# MEETING REQUESTS
@portal_bp.route('/meetings', methods=['GET'])
@client_auth
def list_meetings(user):
    meetings = MeetingRequest.query.filter_by(account_id=user.account_id).order_by(MeetingRequest.created_at.desc()).all()
    return jsonify({'meetings': [m.to_dict() for m in meetings]})


@portal_bp.route('/meetings', methods=['POST'])
@client_auth
def request_meeting(user):
    data = request.get_json()
    if not data.get('preferred_date') or not data.get('agenda') or not data.get('meeting_link'):
        return jsonify({'error': 'preferred_date, agenda, and meeting_link are required'}), 400
    try:
        project_id = int(data['project_id']) if data.get('project_id') else None
        preferred_date = datetime.fromisoformat(data['preferred_date'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid format'}), 400
    m = MeetingRequest(
        account_id=user.account_id,
        project_id=project_id,
        requested_by=user.id,
        preferred_date=preferred_date,
        agenda=data['agenda'],
        meeting_link=data['meeting_link'],
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'meeting': m.to_dict()}), 201


@portal_bp.route('/meetings/<int:mid>', methods=['GET'])
@client_auth
def get_meeting(user, mid):
    meeting = MeetingRequest.query.get_or_404(mid)
    if meeting.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'meeting': meeting.to_dict()})


@portal_bp.route('/meetings/<int:mid>', methods=['PATCH'])
@client_auth
def update_meeting(user, mid):
    meeting = MeetingRequest.query.get_or_404(mid)
    if meeting.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    action = data.get('action')
    if action == 'cancel':
        if meeting.status not in ('Requested', 'Confirmed', 'Rescheduled'):
            return jsonify({'error': 'Cannot cancel this meeting'}), 400
        meeting.status = 'Cancelled'
    elif action == 'reschedule':
        if meeting.status != 'Requested':
            return jsonify({'error': 'Can only reschedule requested meetings'}), 400
        try:
            meeting.preferred_date = datetime.fromisoformat(data['preferred_date'])
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid date format'}), 400
        meeting.status = 'Requested'
    elif action == 'notes':
        if 'meeting_notes' in data:
            meeting.meeting_notes = data['meeting_notes']
    else:
        return jsonify({'error': 'Invalid action'}), 400
    db.session.commit()
    return jsonify({'meeting': meeting.to_dict()})


# CLIENT UPLOADS
@portal_bp.route('/projects/<int:pid>/uploads', methods=['GET'])
@client_auth
def list_uploads(user, pid):
    uploads = ClientUpload.query.filter_by(project_id=pid, account_id=user.account_id).order_by(ClientUpload.uploaded_at.desc()).all()
    return jsonify({'uploads': [u.to_dict() for u in uploads]})


@portal_bp.route('/projects/<int:pid>/uploads', methods=['POST'])
@client_auth
def upload_file(user, pid):
    project = Project.query.get_or_404(pid)
    if project.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    fname = safe_filename(f'client_{user.account_id}_{pid}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    upload = ClientUpload(
        account_id=user.account_id, project_id=pid, uploaded_by=user.id,
        file_name=file.filename, file_path=path, file_type=ext,
        category=request.form.get('category', 'Other'),
        description=request.form.get('description', ''),
    )
    db.session.add(upload)
    db.session.commit()
    return jsonify({'upload': upload.to_dict()}), 201


# MEETING REQUEST DOCUMENTS
MEETING_REQ_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'meeting_requests')
os.makedirs(MEETING_REQ_UPLOAD_DIR, exist_ok=True)


@portal_bp.route('/meetings/<int:mid>/documents', methods=['GET'])
@client_auth
def list_meeting_req_docs(user, mid):
    mr = MeetingRequest.query.get_or_404(mid)
    if mr.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    docs = MeetingRequestDocument.query.filter_by(meeting_request_id=mid).order_by(MeetingRequestDocument.uploaded_at.desc()).all()
    return jsonify({'documents': [d.to_dict() for d in docs]})


@portal_bp.route('/meetings/<int:mid>/documents', methods=['POST'])
@client_auth
def upload_meeting_req_doc(user, mid):
    mr = MeetingRequest.query.get_or_404(mid)
    if mr.account_id != user.account_id:
        return jsonify({'error': 'Access denied'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    fname = safe_filename(f'mreq_{mid}', file.filename)
    path = os.path.join(MEETING_REQ_UPLOAD_DIR, fname)
    file.save(path)
    doc = MeetingRequestDocument(
        meeting_request_id=mid,
        file_name=file.filename, file_path=path, file_type=ext,
        description=request.form.get('description', ''),
        uploaded_by=user.id,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@portal_bp.route('/meetings/<int:mid>/documents/<int:did>', methods=['GET'])
@client_auth
def download_meeting_req_doc(user, mid, did):
    from flask import send_file
    doc = MeetingRequestDocument.query.get_or_404(did)
    return send_file(doc.file_path, as_attachment=False, download_name=doc.file_name)


# FINDING QUERIES
@portal_bp.route('/queries', methods=['GET'])
@client_auth
def list_queries(user):
    queries = FindingQuery.query.filter_by(account_id=user.account_id).order_by(FindingQuery.created_at.desc()).all()
    return jsonify({'queries': [q.to_dict() for q in queries]})


@portal_bp.route('/queries', methods=['POST'])
@client_auth
def raise_query(user):
    data = request.get_json()
    if not data.get('subject') or not data.get('question') or not data.get('project_id'):
        return jsonify({'error': 'subject, question, and project_id required'}), 400
    try:
        project_id = int(data['project_id'])
        document_id = int(data['document_id']) if data.get('document_id') else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid project_id or document_id'}), 400
    q = FindingQuery(
        account_id=user.account_id,
        project_id=project_id,
        document_id=document_id,
        raised_by=user.id,
        subject=data['subject'],
        question=data['question'],
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({'query': q.to_dict()}), 201
