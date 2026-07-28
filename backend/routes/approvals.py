from flask import Blueprint, request, jsonify
from models import db, User, LeaveRequest, ExpenseEntry, Notification, ApprovalRequest, ApprovalHistoryEntry
from datetime import datetime
from middleware.auth import login_required, role_required


approval_bp = Blueprint('approvals', __name__, url_prefix='/api/approvals')

def get_approvers(request_type, requester):
    """Return list of (role, user_id) for approval chain.
    For role groups (hr, finance), uses the first user's id but any user
    with that role can approve (checked by _can_approve)."""
    chain = []
    
    if request_type in ('leave', 'short_leave'):
        if requester.reporting_manager_id:
            chain.append(('manager', requester.reporting_manager_id))
        hr_user = User.query.filter_by(role='hr', is_active=True).first()
        if hr_user:
            chain.append(('hr', hr_user.id))
    
    elif request_type == 'expense':
        if requester.reporting_manager_id:
            chain.append(('manager', requester.reporting_manager_id))
        fin_user = User.query.filter_by(role='finance', is_active=True).first()
        if fin_user:
            chain.append(('finance', fin_user.id))
    
    elif request_type == 'task':
        pass
    
    elif request_type == 'vendor_payment':
        fin_user = User.query.filter_by(role='finance', is_active=True).first()
        if fin_user:
            chain.append(('finance', fin_user.id))
    
    # Fallback to admin
    if not chain:
        admin = User.query.filter(User.role.in_(['admin', 'super_admin']), User.is_active==True).first()
        if admin:
            chain.append(('admin', admin.id))
    
    return chain


def notify_user(user_id, title, message):
    """Create in-app notification"""
    n = Notification(user_id=user_id, title=title, message=message, module_type='approval')
    db.session.add(n)
    try:
        db.session.flush()
    except:
        db.session.rollback()


# ─── API Endpoints ────────────────────────────────────────────────────────────

@approval_bp.route('/all', methods=['GET'])
@login_required
def all_approvals(current_user):
    """All pending approvals (admin/super_admin only)"""
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Not authorized'}), 403
    approvals = ApprovalRequest.query.filter_by(
        status='pending'
    ).order_by(ApprovalRequest.created_at.desc()).all()
    return jsonify({'approvals': [a.to_dict() for a in approvals]})

@approval_bp.route('/all/history', methods=['GET'])
@login_required
def all_approvals_history(current_user):
    """All approval history (admin/super_admin only)"""
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Not authorized'}), 403
    approvals = ApprovalRequest.query.filter(
        ApprovalRequest.status.in_(['approved', 'rejected', 'cancelled'])
    ).order_by(ApprovalRequest.created_at.desc()).all()
    return jsonify({'approvals': [a.to_dict() for a in approvals]})


@approval_bp.route('/<int:aid>', methods=['GET'])
@login_required
def approval_detail(current_user, aid):
    approval = ApprovalRequest.query.get_or_404(aid)
    hist = ApprovalHistoryEntry.query.filter_by(
        approval_request_id=approval.id
    ).order_by(ApprovalHistoryEntry.created_at.asc()).all()
    d = approval.to_dict()
    d['history'] = [h.to_dict() for h in hist]
    return jsonify({'approval': d})

@approval_bp.route('/leave', methods=['POST'])
@login_required
def create_leave_approval(current_user):
    data = request.get_json()
    leave_id = data.get('leave_request_id')
    leave_type = data.get('leave_type', 'full_day')
    
    leave = LeaveRequest.query.get_or_404(leave_id)
    if leave.user_id != current_user.id:
        return jsonify({'error': 'Not your leave request'}), 403
    
    if leave.status != 'Pending':
        return jsonify({'error': 'Leave already processed'}), 400
    
    req_type = 'short_leave' if leave_type == 'short_leave' else 'leave'
    approvers = get_approvers(req_type, current_user)
    
    if not approvers:
        leave.status = 'Approved'
        db.session.commit()
        return jsonify({'message': 'Auto-approved (no approvers)'}), 201
    
    approval = ApprovalRequest(
        request_type=req_type,
        requester_id=current_user.id,
        target_type='leave_request',
        target_id=leave.id,
        current_level=0,
        current_approver_id=approvers[0][1],
        status='pending',
        payload={'leave_type': leave_type, 'days': float((leave.to_date - leave.from_date).days + 1) if leave.from_date and leave.to_date else 1, 'from_date': leave.from_date.isoformat() if leave.from_date else None, 'to_date': leave.to_date.isoformat() if leave.to_date else None}
    )
    db.session.add(approval)
    leave.status = 'Pending'
    db.session.commit()
    
    if approvers:
        notify_user(approvers[0][1], 'Leave Approval Required', f"{current_user.full_name} requested {leave_type} leave")
    
    return jsonify({'message': 'Approval request created', 'approval': approval.to_dict()}), 201


@approval_bp.route('/expense', methods=['POST'])
@login_required
def create_expense_approval(current_user):
    data = request.get_json()
    expense_id = data.get('expense_id')
    
    expense = ExpenseEntry.query.get_or_404(expense_id)
    if expense.user_id != current_user.id:
        return jsonify({'error': 'Not your expense'}), 403
    
    if expense.status != 'Pending':
        return jsonify({'error': 'Expense already processed'}), 400
    
    approvers = get_approvers('expense', current_user)
    
    if not approvers:
        expense.status = 'Approved'
        db.session.commit()
        return jsonify({'message': 'Auto-approved (no approvers)'}), 201
    
    approval = ApprovalRequest(
        request_type='expense',
        requester_id=current_user.id,
        target_type='expense_entry',
        target_id=expense.id,
        current_level=0,
        current_approver_id=approvers[0][1],
        status='pending',
        payload={'amount': float(expense.amount or 0), 'category': expense.category, 'date': expense.date.isoformat() if expense.date else None}
    )
    db.session.add(approval)
    expense.status = 'Pending'
    db.session.commit()
    
    if approvers:
        notify_user(approvers[0][1], 'Expense Approval Required', f"{current_user.full_name} submitted expense: ₹{expense.amount}")
    
    return jsonify({'message': 'Approval request created', 'approval': approval.to_dict()}), 201


@approval_bp.route('', methods=['GET'])
@login_required
def list_my_approvals(current_user):
    """Approvals where current user can approve (includes role-group)"""
    base = ApprovalRequest.query.filter(ApprovalRequest.status == 'pending')
    if current_user.role == 'hr':
        approvals = base.filter(
            db.or_(
                ApprovalRequest.current_approver_id == current_user.id,
                db.and_(
                    ApprovalRequest.request_type.in_(['leave', 'short_leave']),
                    ApprovalRequest.current_level >= 1
                )
            )
        ).order_by(ApprovalRequest.created_at.desc()).all()
    elif current_user.role == 'finance':
        approvals = base.filter(
            db.or_(
                ApprovalRequest.current_approver_id == current_user.id,
                db.and_(
                    ApprovalRequest.request_type.in_(['expense', 'vendor_payment']),
                    ApprovalRequest.current_level >= 1
                )
            )
        ).order_by(ApprovalRequest.created_at.desc()).all()
    else:
        approvals = base.filter(
            ApprovalRequest.current_approver_id == current_user.id
        ).order_by(ApprovalRequest.created_at.desc()).all()
    return jsonify({'approvals': [a.to_dict() for a in approvals]})


@approval_bp.route('/history', methods=['GET'])
@login_required
def approval_history(current_user):
    """All approvals involving current user or their role group"""
    base = ApprovalRequest.query
    if current_user.role == 'hr':
        approvals = base.filter(
            db.or_(
                ApprovalRequest.requester_id == current_user.id,
                ApprovalRequest.current_approver_id == current_user.id,
                ApprovalRequest.request_type.in_(['leave', 'short_leave'])
            )
        ).order_by(ApprovalRequest.created_at.desc()).all()
    elif current_user.role == 'finance':
        approvals = base.filter(
            db.or_(
                ApprovalRequest.requester_id == current_user.id,
                ApprovalRequest.current_approver_id == current_user.id,
                ApprovalRequest.request_type.in_(['expense', 'vendor_payment'])
            )
        ).order_by(ApprovalRequest.created_at.desc()).all()
    else:
        approvals = base.filter(
            db.or_(
                ApprovalRequest.requester_id == current_user.id,
                ApprovalRequest.current_approver_id == current_user.id
            )
        ).order_by(ApprovalRequest.created_at.desc()).all()
    return jsonify({'approvals': [a.to_dict() for a in approvals]})


def _can_approve(current_user, approval, approvers):
    """Check if user can approve at current level
    Exact match OR role-group match (any HR can approve HR-level, etc.)"""
    if approval.current_approver_id == current_user.id:
        return True
    role = approvers[approval.current_level][0] if approvers and approval.current_level < len(approvers) else ''
    if role == 'hr' and current_user.role == 'hr':
        return True
    if role == 'finance' and current_user.role == 'finance':
        return True
    return False


@approval_bp.route('/<int:aid>/approve', methods=['POST'])
@login_required
def approve_request(current_user, aid):
    approval = ApprovalRequest.query.get_or_404(aid)
    
    if approval.status != 'pending':
        return jsonify({'error': 'Already processed'}), 400
    
    approvers = get_approvers(approval.request_type, approval.requester)
    if not _can_approve(current_user, approval, approvers):
        return jsonify({'error': 'Not your approval'}), 403
    
    data = request.get_json() or {}
    remarks = data.get('remarks', '')

    next_level = approval.current_level + 1

    # Record history
    hist = ApprovalHistoryEntry(
        approval_request_id=approval.id,
        level=approval.current_level,
        action='approve',
        actor_id=current_user.id,
        remarks=remarks
    )
    db.session.add(hist)

    if next_level < len(approvers):
        approval.current_level = next_level
        approval.current_approver_id = approvers[next_level][1]
        approval.status = 'pending'
        next_role = approvers[next_level][0] if approvers else ''
        # Notify all users in the role group when the next level is a group level
        if next_role == 'hr':
            for u in User.query.filter_by(role='hr', is_active=True).all():
                notify_user(u.id, 'Approval Required', f"HR approval needed for {approval.requester.full_name}'s {approval.request_type}")
        elif next_role == 'finance':
            for u in User.query.filter_by(role='finance', is_active=True).all():
                notify_user(u.id, 'Approval Required', f"Finance approval needed for {approval.requester.full_name}'s {approval.request_type}")
        else:
            notify_user(approvers[next_level][1], 'Approval Required', f"Next level approval needed for {approval.requester.full_name}'s {approval.request_type}")
    else:
        # Final approval - process the request
        approval.status = 'approved'
        _process_final_approval(approval)
    
    approval.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Approved', 'approval': approval.to_dict()})


@approval_bp.route('/<int:aid>/reject', methods=['POST'])
@login_required
def reject_request(current_user, aid):
    approval = ApprovalRequest.query.get_or_404(aid)
    
    if approval.status != 'pending':
        return jsonify({'error': 'Already processed'}), 400
    
    approvers = get_approvers(approval.request_type, approval.requester)
    if not _can_approve(current_user, approval, approvers):
        return jsonify({'error': 'Not your approval'}), 403
    
    data = request.get_json() or {}
    remarks = data.get('remarks', '')
    if not remarks:
        return jsonify({'error': 'Remarks required for rejection'}), 400
    
    approval.status = 'rejected'
    approval.updated_at = datetime.utcnow()

    # Record history
    hist = ApprovalHistoryEntry(
        approval_request_id=approval.id,
        level=approval.current_level,
        action='reject',
        actor_id=current_user.id,
        remarks=remarks
    )
    db.session.add(hist)

    # Update the target request status
    _process_rejection(approval, remarks)
    
    # Notify requester
    notify_user(approval.requester_id, f'{approval.request_type.title()} Rejected', f"Your {approval.request_type} request was rejected by {current_user.full_name}: {remarks}")
    
    db.session.commit()
    
    return jsonify({'message': 'Rejected', 'approval': approval.to_dict()})


def _process_final_approval(approval):
    """Process the actual request after all approvals complete"""
    if approval.target_type == 'leave_request':
        leave = LeaveRequest.query.get(approval.target_id)
        if leave:
            leave.status = 'Approved'
    elif approval.target_type == 'expense_entry':
        expense = ExpenseEntry.query.get(approval.target_id)
        if expense:
            expense.status = 'Approved'
    
    # Notify requester
    notify_user(approval.requester_id, f'{approval.request_type.title()} Approved', f"Your {approval.request_type} request has been fully approved")


def _process_rejection(approval, remarks):
    if approval.target_type == 'leave_request':
        leave = LeaveRequest.query.get(approval.target_id)
        if leave:
            leave.status = 'Rejected'
            leave.reviewer_remarks = remarks
    elif approval.target_type == 'expense_entry':
        expense = ExpenseEntry.query.get(approval.target_id)
        if expense:
            expense.status = 'Rejected'
            expense.reviewer_remarks = remarks