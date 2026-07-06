from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, ProjectRisk, ProjectIssue, ProjectMilestone, ProjectInvoice, ProjectTimesheet, ProjectChangeRequest, ApprovalHistory, Project, User
from middleware.auth import login_required

enterprise_bp = Blueprint('enterprise', __name__, url_prefix='/api/projects')


# ─── Risks ───────────────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/risks', methods=['GET'])
@login_required
def list_risks(current_user, pid):
    return jsonify({'risks': [r.to_dict() for r in ProjectRisk.query.filter_by(project_id=pid).order_by(ProjectRisk.created_at.desc()).all()]})

@enterprise_bp.route('/<int:pid>/risks', methods=['POST'])
@login_required
def create_risk(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    r = ProjectRisk(project_id=pid, title=data['title'], description=data.get('description'),
                    category=data.get('category'), impact=data.get('impact', 'Medium'),
                    probability=data.get('probability', 'Medium'), severity=data.get('severity', 'Medium'),
                    status=data.get('status', 'Open'), mitigation=data.get('mitigation'),
                    owner_id=data.get('owner_id'), created_by=current_user.id)
    db.session.add(r)
    db.session.commit()
    _add_approval_log('project', pid, 'risk_created', f'Risk: {data["title"]}', current_user.id)
    return jsonify({'risk': r.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/risks/<int:rid>', methods=['PUT'])
@login_required
def update_risk(current_user, pid, rid):
    r = ProjectRisk.query.filter_by(id=rid, project_id=pid).first_or_404()
    for f in ['title', 'description', 'category', 'impact', 'probability', 'severity', 'status', 'mitigation', 'owner_id']:
        if f in request.get_json():
            setattr(r, f, request.get_json()[f])
    db.session.commit()
    return jsonify({'risk': r.to_dict()})

@enterprise_bp.route('/<int:pid>/risks/<int:rid>', methods=['DELETE'])
@login_required
def delete_risk(current_user, pid, rid):
    r = ProjectRisk.query.filter_by(id=rid, project_id=pid).first_or_404()
    db.session.delete(r)
    db.session.commit()
    return jsonify({'message': 'Risk deleted'})


# ─── Issues ──────────────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/issues', methods=['GET'])
@login_required
def list_issues(current_user, pid):
    return jsonify({'issues': [i.to_dict() for i in ProjectIssue.query.filter_by(project_id=pid).order_by(ProjectIssue.created_at.desc()).all()]})

@enterprise_bp.route('/<int:pid>/issues', methods=['POST'])
@login_required
def create_issue(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    i = ProjectIssue(project_id=pid, title=data['title'], description=data.get('description'),
                     priority=data.get('priority', 'Medium'), status=data.get('status', 'Open'),
                     resolution=data.get('resolution'), raised_by=current_user.id,
                     assigned_to=data.get('assigned_to'))
    db.session.add(i)
    db.session.commit()
    _add_approval_log('project', pid, 'issue_created', f'Issue: {data["title"]}', current_user.id)
    return jsonify({'issue': i.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/issues/<int:iid>', methods=['PUT'])
@login_required
def update_issue(current_user, pid, iid):
    i = ProjectIssue.query.filter_by(id=iid, project_id=pid).first_or_404()
    data = request.get_json()
    for f in ['title', 'description', 'priority', 'status', 'resolution', 'assigned_to']:
        if f in data:
            setattr(i, f, data[f])
    if data.get('status') == 'Resolved' and not i.resolved_at:
        i.resolved_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'issue': i.to_dict()})

@enterprise_bp.route('/<int:pid>/issues/<int:iid>', methods=['DELETE'])
@login_required
def delete_issue(current_user, pid, iid):
    i = ProjectIssue.query.filter_by(id=iid, project_id=pid).first_or_404()
    db.session.delete(i)
    db.session.commit()
    return jsonify({'message': 'Issue deleted'})


# ─── Milestones ──────────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/milestones', methods=['GET'])
@login_required
def list_milestones(current_user, pid):
    return jsonify({'milestones': [m.to_dict() for m in ProjectMilestone.query.filter_by(project_id=pid).order_by(ProjectMilestone.due_date.asc()).all()]})

@enterprise_bp.route('/<int:pid>/milestones', methods=['POST'])
@login_required
def create_milestone(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    due = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None
    m = ProjectMilestone(project_id=pid, title=data['title'], description=data.get('description'),
                         due_date=due, status=data.get('status', 'Pending'), created_by=current_user.id)
    db.session.add(m)
    db.session.commit()
    return jsonify({'milestone': m.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/milestones/<int:mid>', methods=['PUT'])
@login_required
def update_milestone(current_user, pid, mid):
    m = ProjectMilestone.query.filter_by(id=mid, project_id=pid).first_or_404()
    data = request.get_json()
    for f in ['title', 'description', 'status']:
        if f in data:
            setattr(m, f, data[f])
    if data.get('due_date'):
        m.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    if data.get('status') == 'Completed' and not m.completed_at:
        m.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'milestone': m.to_dict()})

@enterprise_bp.route('/<int:pid>/milestones/<int:mid>', methods=['DELETE'])
@login_required
def delete_milestone(current_user, pid, mid):
    m = ProjectMilestone.query.filter_by(id=mid, project_id=pid).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return jsonify({'message': 'Milestone deleted'})


# ─── Invoices ────────────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/invoices', methods=['GET'])
@login_required
def list_invoices(current_user, pid):
    return jsonify({'invoices': [i.to_dict() for i in ProjectInvoice.query.filter_by(project_id=pid).order_by(ProjectInvoice.created_at.desc()).all()]})

@enterprise_bp.route('/<int:pid>/invoices', methods=['POST'])
@login_required
def create_invoice(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('invoice_no') or not data.get('amount'):
        return jsonify({'error': 'invoice_no and amount required'}), 400
    inv = ProjectInvoice(project_id=pid, invoice_no=data['invoice_no'], amount=float(data['amount']),
                         tax=float(data.get('tax', 0)), total=float(data.get('total', 0)) or (float(data['amount']) + float(data.get('tax', 0))),
                         status=data.get('status', 'Draft'),
                         issued_date=datetime.strptime(data['issued_date'], '%Y-%m-%d').date() if data.get('issued_date') else None,
                         due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
                         paid_date=datetime.strptime(data['paid_date'], '%Y-%m-%d').date() if data.get('paid_date') else None,
                         notes=data.get('notes'), created_by=current_user.id)
    db.session.add(inv)
    db.session.commit()
    return jsonify({'invoice': inv.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/invoices/<int:iid>', methods=['PUT'])
@login_required
def update_invoice(current_user, pid, iid):
    inv = ProjectInvoice.query.filter_by(id=iid, project_id=pid).first_or_404()
    data = request.get_json()
    for f in ['invoice_no', 'amount', 'tax', 'total', 'status', 'notes']:
        if f in data:
            setattr(inv, f, data[f])
    for f in ['issued_date', 'due_date', 'paid_date']:
        if f in data:
            setattr(inv, f, datetime.strptime(data[f], '%Y-%m-%d').date() if data[f] else None)
    db.session.commit()
    return jsonify({'invoice': inv.to_dict()})

@enterprise_bp.route('/<int:pid>/invoices/<int:iid>', methods=['DELETE'])
@login_required
def delete_invoice(current_user, pid, iid):
    inv = ProjectInvoice.query.filter_by(id=iid, project_id=pid).first_or_404()
    db.session.delete(inv)
    db.session.commit()
    return jsonify({'message': 'Invoice deleted'})


# ─── Timesheets ──────────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/timesheets', methods=['GET'])
@login_required
def list_timesheets(current_user, pid):
    return jsonify({'timesheets': [t.to_dict() for t in ProjectTimesheet.query.filter_by(project_id=pid).order_by(ProjectTimesheet.date.desc()).all()]})

@enterprise_bp.route('/<int:pid>/timesheets', methods=['POST'])
@login_required
def create_timesheet(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('hours') or not data.get('date'):
        return jsonify({'error': 'hours and date required'}), 400
    t = ProjectTimesheet(project_id=pid, user_id=current_user.id,
                         date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
                         hours=float(data['hours']), description=data.get('description'),
                         status='Submitted')
    db.session.add(t)
    db.session.commit()
    return jsonify({'timesheet': t.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/timesheets/<int:tid>', methods=['PUT'])
@login_required
def update_timesheet(current_user, pid, tid):
    t = ProjectTimesheet.query.filter_by(id=tid, project_id=pid).first_or_404()
    data = request.get_json()
    if 'hours' in data:
        t.hours = float(data['hours'])
    if 'description' in data:
        t.description = data['description']
    if 'status' in data:
        t.status = data['status']
        if data['status'] == 'Approved':
            t.approved_by = current_user.id
    db.session.commit()
    return jsonify({'timesheet': t.to_dict()})

@enterprise_bp.route('/<int:pid>/timesheets/<int:tid>', methods=['DELETE'])
@login_required
def delete_timesheet(current_user, pid, tid):
    t = ProjectTimesheet.query.filter_by(id=tid, project_id=pid).first_or_404()
    db.session.delete(t)
    db.session.commit()
    return jsonify({'message': 'Timesheet deleted'})


# ─── Change Requests ─────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/change-requests', methods=['GET'])
@login_required
def list_change_requests(current_user, pid):
    return jsonify({'change_requests': [c.to_dict() for c in ProjectChangeRequest.query.filter_by(project_id=pid).order_by(ProjectChangeRequest.created_at.desc()).all()]})

@enterprise_bp.route('/<int:pid>/change-requests', methods=['POST'])
@login_required
def create_change_request(current_user, pid):
    Project.query.get_or_404(pid)
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'title required'}), 400
    cr = ProjectChangeRequest(project_id=pid, title=data['title'], description=data.get('description'),
                              reason=data.get('reason'), impact=data.get('impact'),
                              priority=data.get('priority', 'Medium'), status='Pending',
                              requested_by=current_user.id)
    db.session.add(cr)
    db.session.commit()
    _add_approval_log('project', pid, 'change_request_created', f'CR: {data["title"]}', current_user.id)
    return jsonify({'change_request': cr.to_dict()}), 201

@enterprise_bp.route('/<int:pid>/change-requests/<int:cid>', methods=['PUT'])
@login_required
def update_change_request(current_user, pid, cid):
    cr = ProjectChangeRequest.query.filter_by(id=cid, project_id=pid).first_or_404()
    data = request.get_json()
    for f in ['title', 'description', 'reason', 'impact', 'priority', 'status']:
        if f in data:
            setattr(cr, f, data[f])
    if data.get('status') == 'Approved' and not cr.approved_at:
        cr.approved_by = current_user.id
        cr.approved_at = datetime.utcnow()
        _add_approval_log('project', pid, 'change_request_approved', f'CR approved: {cr.title}', current_user.id)
    db.session.commit()
    return jsonify({'change_request': cr.to_dict()})

@enterprise_bp.route('/<int:pid>/change-requests/<int:cid>', methods=['DELETE'])
@login_required
def delete_change_request(current_user, pid, cid):
    cr = ProjectChangeRequest.query.filter_by(id=cid, project_id=pid).first_or_404()
    db.session.delete(cr)
    db.session.commit()
    return jsonify({'message': 'Change request deleted'})


# ─── Approval History ────────────────────────────────────────────────────────

@enterprise_bp.route('/<int:pid>/approvals', methods=['GET'])
@login_required
def list_approvals(current_user, pid):
    return jsonify({'approvals': [a.to_dict() for a in ApprovalHistory.query.filter_by(module_type='project', module_id=pid).order_by(ApprovalHistory.created_at.desc()).all()]})


# ─── Helper ──────────────────────────────────────────────────────────────────

def _add_approval_log(module_type, module_id, action, remarks, user_id):
    log = ApprovalHistory(module_type=module_type, module_id=module_id, action=action, remarks=remarks, action_by=user_id)
    db.session.add(log)
