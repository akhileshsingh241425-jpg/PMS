import json
from flask import Blueprint, request, jsonify
from models import db, User, ProjectTeam
from middleware.auth import role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

ROLES = [
    {'id': 1, 'code': 'super_admin', 'name': 'Super Admin'},
    {'id': 2, 'code': 'project_manager', 'name': 'Project Manager'},
    {'id': 3, 'code': 'team_leader', 'name': 'Team Leader'},
    {'id': 4, 'code': 'sales', 'name': 'Sales Representative'},
    {'id': 5, 'code': 'employee', 'name': 'Employee'},
    {'id': 6, 'code': 'client', 'name': 'Client'},
]

PERMISSIONS = [
    {'id': 1, 'code': 'view', 'name': 'View', 'module': 'dashboard'},
    {'id': 2, 'code': 'view', 'name': 'View', 'module': 'projects'},
    {'id': 3, 'code': 'create', 'name': 'Create', 'module': 'projects'},
    {'id': 4, 'code': 'view', 'name': 'View', 'module': 'leads'},
    {'id': 5, 'code': 'create', 'name': 'Create', 'module': 'leads'},
    {'id': 6, 'code': 'view', 'name': 'View', 'module': 'accounts'},
    {'id': 7, 'code': 'create', 'name': 'Create', 'module': 'accounts'},
    {'id': 8, 'code': 'view', 'name': 'View', 'module': 'opportunities'},
    {'id': 9, 'code': 'create', 'name': 'Create', 'module': 'opportunities'},
    {'id': 10, 'code': 'view', 'name': 'View', 'module': 'users'},
    {'id': 11, 'code': 'manage', 'name': 'Manage', 'module': 'users'},
]


@admin_bp.route('/employees', methods=['GET'])
@role_required('admin')
def list_employees(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        d = u.to_dict()
        team_members = ProjectTeam.query.filter_by(user_id=u.id).all()
        d['projects'] = [{
            'id': tm.project.id,
            'proj_id': tm.project.proj_id,
            'title': tm.project.title,
            'stage': tm.project.stage,
            'team_member_id': tm.id,
        } for tm in team_members if tm.project]
        result.append(d)
    return jsonify({'employees': result})


@admin_bp.route('/permissions', methods=['GET'])
@role_required('admin')
def list_permissions(current_user):
    return jsonify({'permissions': PERMISSIONS})


@admin_bp.route('/users/<int:uid>/roles', methods=['PUT'])
@role_required('admin')
def update_user_roles(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    role_ids = data.get('role_ids', [])
    role_map = {1: 'super_admin', 2: 'project_manager', 3: 'team_leader', 4: 'sales', 5: 'employee', 6: 'client'}
    if role_ids:
        user.role = role_map.get(role_ids[0], 'employee')
    db.session.commit()
    return jsonify({'user': user.to_dict()})


@admin_bp.route('/users/<int:uid>/permissions', methods=['PUT'])
@role_required('admin')
def update_user_permissions(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    perms = data.get('permissions', {})
    import json as _json
    user.permissions_json = _json.dumps(perms)
    db.session.commit()
    return jsonify({'permissions': perms})
