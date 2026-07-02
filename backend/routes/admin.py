from flask import Blueprint, request, jsonify
from models import db, User, UserRole, Role, Project, ProjectTeam, Permission, UserPermission
from utils import paginate
from middleware.auth import role_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/employees', methods=['GET'])
@role_required('super_admin')
def list_employees(current_user):
    query = User.query.order_by(User.first_name)
    page_result = paginate(query, request)
    users = page_result['items']
    user_ids = [u.id for u in users]

    team_map = {}
    perm_map = {}
    if user_ids:
        rows = ProjectTeam.query.filter(ProjectTeam.user_id.in_(user_ids)).all()
        pids = list(set(t.project_id for t in rows))
        projs = {p.id: p for p in Project.query.filter(Project.id.in_(pids)).all()} if pids else {}
        for t in rows:
            team_map.setdefault(t.user_id, []).append(projs.get(t.project_id))

        perm_rows = UserPermission.query.filter(UserPermission.user_id.in_(user_ids)).all()
        for pr in perm_rows:
            perm_map.setdefault(pr.user_id, {})[pr.permission.code] = pr.is_granted

    result = []
    for u in users:
        result.append({
            'id': u.id,
            'emp_id': u.emp_id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'full_name': u.full_name,
            'phone': u.phone,
            'designation': u.designation,
            'department': u.department.name if u.department else None,
            'is_active': u.is_active,
            'roles': u.roles,
            'role_ids': u.role_ids,
            'projects': [{'id': p.id, 'proj_id': p.proj_id, 'title': p.title, 'stage': p.stage} for p in team_map.get(u.id, []) if p],
            'permissions': perm_map.get(u.id, {}),
        })
    return jsonify({'employees': result, 'pagination': {'page': page_result['page'], 'per_page': page_result['per_page'], 'total': page_result['total'], 'pages': page_result['pages']}})


@admin_bp.route('/permissions', methods=['GET'])
@role_required('super_admin')
def list_permissions(current_user):
    perms = Permission.query.order_by(Permission.module, Permission.id).all()
    return jsonify({'permissions': [p.to_dict() for p in perms]})


@admin_bp.route('/users/<int:uid>/permissions', methods=['PUT'])
@role_required('super_admin')
def update_user_permissions(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    permissions = data.get('permissions', {})
    for code, granted in permissions.items():
        perm = Permission.query.filter_by(code=code).first()
        if not perm:
            continue
        existing = UserPermission.query.filter_by(user_id=uid, permission_id=perm.id).first()
        if existing:
            existing.is_granted = granted
        else:
            db.session.add(UserPermission(user_id=uid, permission_id=perm.id, is_granted=granted))
    db.session.commit()
    user_perms = UserPermission.query.filter_by(user_id=uid).all()
    perm_dict = {up.permission.code: up.is_granted for up in user_perms}
    return jsonify({'permissions': perm_dict})


@admin_bp.route('/users/<int:uid>/roles', methods=['PUT'])
@role_required('super_admin')
def update_user_roles(current_user, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json()
    role_ids = data.get('role_ids', [])
    UserRole.query.filter_by(user_id=uid).delete()
    for rid in role_ids:
        role = Role.query.get(rid)
        if role:
            db.session.add(UserRole(user_id=uid, role_id=rid))
    db.session.commit()
    return jsonify({'user': user.to_dict()})
