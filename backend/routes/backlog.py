from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Project, Epic, Sprint, Issue, User
from middleware.auth import login_required

backlog_bp = Blueprint('backlog', __name__, url_prefix='/api')

@backlog_bp.route('/projects/<int:project_id>/backlog', methods=['GET'])
@login_required
def get_backlog(current_user, project_id):
    project = Project.query.get_or_404(project_id)
    epics = [e.to_dict() for e in Epic.query.filter_by(project_id=project_id).order_by(Epic.order).all()]
    sprints = [s.to_dict() for s in Sprint.query.filter_by(project_id=project_id).order_by(Sprint.created_at).all()]
    unassigned = Issue.query.filter_by(project_id=project_id, sprint_id=None).order_by(Issue.order).all()
    return jsonify({
        'project': {'id': project.id, 'title': project.title, 'proj_id': project.proj_id},
        'epics': epics,
        'sprints': sprints,
        'unassigned_issues': [i.to_dict() for i in unassigned],
    })

@backlog_bp.route('/epics', methods=['GET'])
@login_required
def list_epics(current_user):
    q = Epic.query
    if pid := request.args.get('project_id'):
        q = q.filter_by(project_id=int(pid))
    return jsonify({'epics': [e.to_dict() for e in q.order_by(Epic.order).all()]})

@backlog_bp.route('/epics', methods=['POST'])
@login_required
def create_epic(current_user):
    data = request.get_json()
    if not data.get('project_id') or not data.get('name'):
        return jsonify({'error': 'project_id and name required'}), 400
    max_order = db.session.query(db.func.max(Epic.order)).filter_by(project_id=int(data['project_id'])).scalar() or 0
    epic = Epic(
        project_id=int(data['project_id']),
        name=data['name'],
        color=data.get('color', '#0052CC'),
        status=data.get('status', 'in_progress'),
        order=max_order + 1,
    )
    db.session.add(epic)
    db.session.commit()
    return jsonify(epic.to_dict()), 201

@backlog_bp.route('/epics/<int:epic_id>', methods=['PUT'])
@login_required
def update_epic(current_user, epic_id):
    epic = Epic.query.get_or_404(epic_id)
    data = request.get_json()
    for f in ('name', 'color', 'status'):
        if f in data:
            setattr(epic, f, data[f])
    db.session.commit()
    return jsonify(epic.to_dict())

@backlog_bp.route('/epics/<int:epic_id>', methods=['DELETE'])
@login_required
def delete_epic(current_user, epic_id):
    epic = Epic.query.get_or_404(epic_id)
    Issue.query.filter_by(epic_id=epic_id).update({'epic_id': None})
    db.session.delete(epic)
    db.session.commit()
    return jsonify({'message': 'Epic deleted'})

@backlog_bp.route('/sprints', methods=['GET'])
@login_required
def list_sprints(current_user):
    q = Sprint.query
    if pid := request.args.get('project_id'):
        q = q.filter_by(project_id=int(pid))
    return jsonify({'sprints': [s.to_dict() for s in q.order_by(Sprint.created_at).all()]})

@backlog_bp.route('/sprints', methods=['POST'])
@login_required
def create_sprint(current_user):
    data = request.get_json()
    if not data.get('project_id') or not data.get('name'):
        return jsonify({'error': 'project_id and name required'}), 400
    sprint = Sprint(
        project_id=int(data['project_id']),
        name=data['name'],
        goal=data.get('goal'),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
    )
    db.session.add(sprint)
    db.session.commit()
    return jsonify(sprint.to_dict()), 201

@backlog_bp.route('/sprints/<int:sprint_id>', methods=['PUT'])
@login_required
def update_sprint(current_user, sprint_id):
    sprint = Sprint.query.get_or_404(sprint_id)
    data = request.get_json()
    for f in ('name', 'goal', 'status'):
        if f in data:
            setattr(sprint, f, data[f])
    if data.get('start_date'):
        sprint.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('end_date'):
        sprint.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(sprint.to_dict())

@backlog_bp.route('/sprints/<int:sprint_id>/complete', methods=['POST'])
@login_required
def complete_sprint(current_user, sprint_id):
    sprint = Sprint.query.get_or_404(sprint_id)
    sprint.status = 'completed'
    Issue.query.filter_by(sprint_id=sprint_id, status='todo').update({'sprint_id': None})
    db.session.commit()
    return jsonify(sprint.to_dict())

@backlog_bp.route('/issues', methods=['GET'])
@login_required
def list_issues(current_user):
    q = Issue.query
    if pid := request.args.get('project_id'):
        q = q.filter_by(project_id=int(pid))
    if sid := request.args.get('sprint_id'):
        q = q.filter_by(sprint_id=int(sid))
    if eid := request.args.get('epic_id'):
        q = q.filter_by(epic_id=int(eid))
    if s := request.args.get('status'):
        q = q.filter_by(status=s)
    if search := request.args.get('search'):
        q = q.filter(Issue.title.ilike(f'%{search}%'))
    q = q.order_by(Issue.order)
    return jsonify({'issues': [i.to_dict() for i in q.all()]})

def _next_key(project_id):
    project = Project.query.get(project_id)
    prefix = (project.proj_id or 'PROJ')[:6].upper()
    last = Issue.query.filter(Issue.key.like(f'{prefix}-%')).order_by(Issue.id.desc()).first()
    num = 1
    if last:
        try:
            num = int(last.key.split('-')[-1]) + 1
        except (ValueError, IndexError):
            num = Issue.query.filter_by(project_id=project_id).count() + 1
    return f'{prefix}-{num:03d}'

@backlog_bp.route('/issues', methods=['POST'])
@login_required
def create_issue(current_user):
    data = request.get_json()
    if not data.get('project_id') or not data.get('title'):
        return jsonify({'error': 'project_id and title required'}), 400
    project_id = int(data['project_id'])
    max_order = db.session.query(db.func.max(Issue.order)).filter_by(project_id=project_id).scalar() or 0
    issue = Issue(
        project_id=project_id,
        epic_id=int(data['epic_id']) if data.get('epic_id') else None,
        sprint_id=int(data['sprint_id']) if data.get('sprint_id') else None,
        parent_id=int(data['parent_id']) if data.get('parent_id') else None,
        key=_next_key(project_id),
        title=data['title'],
        description=data.get('description'),
        type=data.get('type', 'task'),
        label=data.get('label'),
        priority=data.get('priority', 'medium'),
        status=data.get('status', 'todo'),
        story_points=int(data['story_points']) if data.get('story_points') else None,
        assignee_id=int(data['assignee_id']) if data.get('assignee_id') else None,
        reporter_id=current_user.id,
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        order=max_order + 1,
    )
    db.session.add(issue)
    db.session.commit()
    return jsonify(issue.to_dict()), 201

@backlog_bp.route('/issues/<int:issue_id>', methods=['PUT'])
@login_required
def update_issue(current_user, issue_id):
    issue = Issue.query.get_or_404(issue_id)
    data = request.get_json()
    for f in ('title', 'description', 'type', 'label', 'priority', 'status', 'story_points', 'order'):
        if f in data:
            setattr(issue, f, data[f])
    if 'epic_id' in data:
        issue.epic_id = int(data['epic_id']) if data['epic_id'] else None
    if 'sprint_id' in data:
        issue.sprint_id = int(data['sprint_id']) if data['sprint_id'] else None
    if 'assignee_id' in data:
        issue.assignee_id = int(data['assignee_id']) if data['assignee_id'] else None
    if data.get('due_date'):
        issue.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify(issue.to_dict())

@backlog_bp.route('/issues/<int:issue_id>', methods=['DELETE'])
@login_required
def delete_issue(current_user, issue_id):
    issue = Issue.query.get_or_404(issue_id)
    db.session.delete(issue)
    db.session.commit()
    return jsonify({'message': 'Issue deleted'})

@backlog_bp.route('/users/assignable', methods=['GET'])
@login_required
def assignable_users(current_user):
    users = User.query.filter_by(is_active=True).all()
    return jsonify({'users': [{
        'id': u.id, 'name': f'{u.first_name} {u.last_name or ""}'.strip(),
        'email': u.email, 'role': u.role,
    } for u in users]})
