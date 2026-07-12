from datetime import datetime
from flask import Blueprint, request, jsonify
import os
from models import db, Lead, LeadRemark, LeadDocument, LeadActivity, LeadNote, LeadAuditLog, LeadProposal, Account, Notification, User, Project, ProjectRemark, Note, Opportunity
from middleware.auth import login_required
from utils import validate_file, safe_filename, generate_id, paginate, safe_float, safe_int

leads_bp = Blueprint('leads', __name__, url_prefix='/api/leads')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'leads')
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _audit(lead_id, action, prev, new, user_id):
    log = LeadAuditLog(lead_id=lead_id, action=action,
                       previous_value=str(prev) if prev else None,
                       new_value=str(new) if new else None,
                       changed_by=user_id)
    db.session.add(log)


def _notify(user_id, title, message, module_type=None, module_id=None, notif_type='info'):
    n = Notification(user_id=user_id, title=title, message=message,
                     module_type=module_type, module_id=module_id, type=notif_type)
    db.session.add(n)
    try:
        from flask import current_app
        u = User.query.get(user_id)
        if u and u.email and current_app.config.get('MAIL_SERVER'):
            from email_utils import send_notification_email
            send_notification_email(u.email, u.full_name or u.first_name, title, message, module_type, module_id, current_app.config.get('FRONTEND_URL', 'http://localhost:5174'))
    except Exception:
        pass


def _get_approvers(lead):
    """Return list of user IDs who can approve (manager or admin)."""
    approvers = set()
    creator = User.query.get(lead.created_by)
    if creator and creator.reporting_manager_id:
        approvers.add(creator.reporting_manager_id)
    admins = User.query.filter(User.role == 'admin', User.is_active == True).all()
    for a in admins:
        approvers.add(a.id)
    return list(approvers)


@leads_bp.route('', methods=['GET'])
@login_required
def list_leads(current_user):
    lead_query = Lead.query
    opp_query = Opportunity.query
    if current_user.role != 'admin':
        lead_query = lead_query.filter(db.or_(
            Lead.assigned_to == current_user.id,
            Lead.created_by == current_user.id,
        ))
        opp_query = opp_query.filter(db.or_(
            Opportunity.assigned_to == current_user.id,
            Opportunity.created_by == current_user.id,
        ))
    if s := request.args.get('search'):
        lead_query = lead_query.filter(db.or_(
            Lead.company_name.ilike(f'%{s}%'),
            Lead.contact_name.ilike(f'%{s}%'),
            Lead.contact_email.ilike(f'%{s}%'),
            Lead.lead_id.ilike(f'%{s}%'),
        ))
        opp_query = opp_query.outerjoin(Account, Opportunity.account_id == Account.id).filter(db.or_(
            Opportunity.company_name.ilike(f'%{s}%'),
            Opportunity.contact_name.ilike(f'%{s}%'),
            Opportunity.contact_email.ilike(f'%{s}%'),
            Opportunity.opp_id.ilike(f'%{s}%'),
            Account.company_name.ilike(f'%{s}%'),
        ))
    if st := request.args.get('stage'):
        lead_query = lead_query.filter_by(stage=st)
        opp_query = opp_query.filter_by(stage=st)
    lead_query = lead_query.order_by(Lead.updated_at.desc()).all()
    opp_query = opp_query.order_by(Opportunity.updated_at.desc()).all()

    lead_data = [{'type': 'lead', **l.to_dict()} for l in lead_query]
    opp_data = [{'type': 'opportunity', **o.to_dict()} for o in opp_query]
    combined = sorted(lead_data + opp_data, key=lambda x: x.get('updated_at') or x.get('created_at') or '', reverse=True)

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    total = len(combined)
    start = (page - 1) * per_page
    end = start + per_page
    items = combined[start:end]

    return jsonify({
        'leads': items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page if total else 0,
        },
    })


@leads_bp.route('', methods=['POST'])
@login_required
def create_lead(current_user):
    data = request.get_json()
    if not data.get('company_name'):
        return jsonify({'error': 'company_name is required'}), 400

    if not data.get('referring_account_id'):
        existing_account = Account.query.filter_by(company_name=data['company_name']).first()
        if existing_account:
            source = data.get('source') or 'Existing Client'
            opp = Opportunity(
                opp_id=generate_id(Opportunity, 'OPP'),
                company_name=data['company_name'],
                contact_name=data.get('contact_name'),
                contact_email=data.get('contact_email'),
                contact_phone=data.get('contact_phone'),
                source=source,
                service_interest=data.get('service_type'),
                description=data.get('description'),
                stage='Prospecting',
                estimated_value=safe_float(data.get('estimated_value')),
                account_id=existing_account.id,
                assigned_to=safe_int(data.get('assigned_to')),
                created_by=current_user.id,
            )
            db.session.add(opp)
            db.session.commit()
            return jsonify({
                'message': 'Opportunity created from existing account',
                'opportunity': opp.to_dict(),
                'type': 'opportunity',
            }), 201

    lead = Lead(
        lead_id=generate_id(Lead, 'LD'),
        company_name=data['company_name'],
        contact_name=data.get('contact_name'),
        contact_email=data.get('contact_email'),
        contact_phone=data.get('contact_phone'),
        website=data.get('website'),
        address=data.get('address'),
        state=data.get('state'),
        pincode=data.get('pincode'),
        source=data.get('source'),
        type=data.get('type'),
        stage=data.get('stage', 'Prospecting'),
        subject=data.get('subject'),
        description=data.get('description'),
        estimated_value=safe_float(data.get('estimated_value')),
        service_type=data.get('service_type'),
        assigned_to=safe_int(data.get('assigned_to')),
        created_by=current_user.id,
        referring_account_id=safe_int(data.get('referring_account_id')),
        referral_date=datetime.utcnow() if data.get('referring_account_id') else None,
    )
    db.session.add(lead)
    db.session.flush()
    _audit(lead.id, 'Lead Created', None, f'Stage: Prospecting', current_user.id)
    db.session.commit()
    return jsonify({'message': 'Lead created', 'lead': lead.to_dict(), 'type': 'lead'}), 201


@leads_bp.route('/<int:lid>', methods=['GET'])
@login_required
def get_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    remarks = LeadRemark.query.filter_by(lead_id=lid, deleted_at=None).order_by(LeadRemark.created_at.desc()).all()
    documents = LeadDocument.query.filter_by(lead_id=lid).order_by(LeadDocument.uploaded_at.desc()).all()
    activities = LeadActivity.query.filter_by(lead_id=lid).order_by(LeadActivity.activity_date.desc()).all()
    notes = LeadNote.query.filter_by(lead_id=lid).order_by(LeadNote.created_at.desc()).all()
    audit_logs = LeadAuditLog.query.filter_by(lead_id=lid).order_by(LeadAuditLog.changed_at.desc()).all()
    return jsonify({
        'lead': lead.to_dict(),
        'remarks': [r.to_dict() for r in remarks],
        'documents': [d.to_dict() for d in documents],
        'activities': [a.to_dict() for a in activities],
        'notes': [n.to_dict() for n in notes],
        'audit_logs': [a.to_dict() for a in audit_logs],
    })


@leads_bp.route('/<int:lid>', methods=['PUT'])
@login_required
def update_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.is_readonly:
        return jsonify({'error': 'Lead is read-only. Cannot edit closed or converted leads.'}), 403
    data = request.get_json()

    old_stage = lead.stage
    for f in ['company_name', 'contact_name', 'contact_email', 'contact_phone',
              'website', 'address', 'state', 'pincode', 'source', 'type',
              'stage', 'subject', 'description', 'service_type']:
        if f in data:
            setattr(lead, f, data[f])

    if 'estimated_value' in data:
        lead.estimated_value = data['estimated_value'] if data['estimated_value'] else None
    if 'assigned_to' in data:
        lead.assigned_to = data['assigned_to'] if data.get('assigned_to') else None

    if lead.stage != old_stage:
        _audit(lid, 'Stage Changed', old_stage, lead.stage, current_user.id)

    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@leads_bp.route('/<int:lid>', methods=['DELETE'])
@login_required
def delete_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.is_readonly and current_user.role != 'admin':
        return jsonify({'error': 'Only admins can delete closed leads.'}), 403
    db.session.delete(lead)
    db.session.commit()
    return jsonify({'message': 'Lead deleted'})


@leads_bp.route('/<int:lid>/close', methods=['POST'])
@login_required
def close_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    data = request.get_json()
    outcome = data.get('outcome')  # 'won' or 'lost'
    if outcome not in ('won', 'lost'):
        return jsonify({'error': 'outcome must be won or lost'}), 400

    stage = 'Lead Closed (Won)' if outcome == 'won' else 'Lead Closed (Lost)'
    lead.stage = stage
    lead.closed_on = datetime.utcnow()
    lead.closed_by = current_user.id
    lead.is_readonly = True

    _audit(lid, f'Closed {outcome.capitalize()}', 'In Progress', stage, current_user.id)

    if outcome == 'won':
        manager_ids = _get_approvers(lead)
        for uid in manager_ids:
            _notify(uid, 'Lead Closed Won',
                    f'Lead {lead.lead_id} ({lead.company_name}) has been closed won. Approval needed for account creation.',
                    'lead', lead.id, 'approval')

    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@leads_bp.route('/<int:lid>/convert-to-account', methods=['POST'])
@login_required
def convert_lead_to_account(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.stage not in ('Lead Closed (Won)', 'Purchase Order'):
        return jsonify({'error': 'Lead must be in Lead Closed (Won) or Purchase Order stage to convert.'}), 400
    if lead.account_id:
        return jsonify({'error': 'Account already linked to this lead.'}), 400

    data = request.get_json() or {}
    is_referred = lead.referral_opportunity_id is not None or lead.referring_account_id is not None
    acc = Account(
        acc_id=generate_id(Account, 'ACC'),
        company_name=data.get('company_name', lead.company_name),
        contact_name=data.get('contact_name', lead.contact_name),
        contact_email=data.get('contact_email', lead.contact_email),
        contact_phone=data.get('contact_phone', lead.contact_phone),
        website=data.get('website', lead.website),
        address=data.get('address', lead.address),
        state=data.get('state', lead.state),
        pincode=data.get('pincode', lead.pincode),
        industry=data.get('industry', lead.service_type),
        acquisition_source='Customer Referral' if is_referred else data.get('acquisition_source'),
        referred_by_account_id=lead.referring_account_id if is_referred else None,
        referral_opportunity_id=lead.referral_opportunity_id if is_referred else None,
        converted_lead_id=lead.id,
        conversion_date=datetime.utcnow(),
        created_by=current_user.id,
    )
    db.session.add(acc)
    db.session.flush()

    lead.account_id = acc.id
    lead.stage = 'Converted to Account'
    lead.account_created_by = current_user.id
    lead.account_created_at = datetime.utcnow()
    lead.is_readonly = True

    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=f'{lead.company_name} - Implementation',
        description=f'Project auto-created from lead {lead.lead_id} ({lead.company_name}). {lead.description or ""}',
        stage='Created',
        service_type=lead.service_type,
        account_id=acc.id,
        pm_id=current_user.id,
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.flush()

    copied_count = {'remarks': 0, 'notes': 0, 'activities': 0, 'proposals': 0, 'documents': 0}

    for r in LeadRemark.query.filter_by(lead_id=lid).all():
        if not r.deleted_at:
            pr = ProjectRemark(project_id=proj.id, text=f'[From Lead] {r.text}', created_by=r.created_by)
            db.session.add(pr)
            copied_count['remarks'] += 1

    for n in LeadNote.query.filter_by(lead_id=lid).all():
        pn = Note(project_id=proj.id, content=f'[From Lead] {n.content}', created_by=n.created_by)
        db.session.add(pn)
        copied_count['notes'] += 1

    for a in LeadActivity.query.filter_by(lead_id=lid).all():
        desc = a.description or ''
        pn = Note(project_id=proj.id,
                  content=f'[From Lead] Activity ({a.activity_type}): {a.title}. {desc}',
                  created_by=a.created_by)
        db.session.add(pn)
        copied_count['activities'] += 1

    for p in LeadProposal.query.filter_by(lead_id=lid).all():
        pr = ProjectRemark(project_id=proj.id,
                           text=f'[From Lead] Proposal #{p.proposal_no}: amount={p.amount}, status={p.status}, version={p.version}. {p.notes or ""}',
                           created_by=p.prepared_by or current_user.id)
        db.session.add(pr)
        copied_count['proposals'] += 1

    for d in LeadDocument.query.filter_by(lead_id=lid).all():
        pr = ProjectRemark(project_id=proj.id,
                           text=f'[From Lead] Document: {d.file_name} (category: {d.category or "N/A"})',
                           created_by=d.uploaded_by or current_user.id)
        db.session.add(pr)
        copied_count['documents'] += 1

    summary = f'Account {acc.acc_id} and Project {proj.proj_id} created. Copied: {copied_count["remarks"]} remarks, {copied_count["notes"]} notes, {copied_count["activities"]} activities, {copied_count["proposals"]} proposals, {copied_count["documents"]} documents.'
    _audit(lid, 'Converted to Account', lead.stage, summary, current_user.id)
    _notify(lead.created_by, 'Lead Converted',
            f'Lead {lead.lead_id} ({lead.company_name}) converted to account {acc.acc_id} with project {proj.proj_id}.',
            'lead', lead.id, 'success')

    db.session.commit()
    return jsonify({'lead': lead.to_dict(), 'account': acc.to_dict(), 'project': proj.to_dict()}), 201


@leads_bp.route('/<int:lid>/request-approval', methods=['POST'])
@login_required
def request_approval(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.stage != 'Lead Closed (Won)':
        return jsonify({'error': 'Lead must be Closed Won before requesting approval.'}), 400
    if lead.approval_status == 'pending_approval':
        return jsonify({'error': 'Approval already requested.'}), 400
    if lead.approval_status == 'approved':
        return jsonify({'error': 'Already approved.'}), 400

    lead.approval_status = 'pending_approval'
    _audit(lid, 'Approval Requested', None, 'Pending Approval', current_user.id)

    manager_ids = _get_approvers(lead)
    for uid in manager_ids:
        _notify(uid, 'Account Creation Approval Requested',
                f'{current_user.full_name} requested account creation for lead {lead.lead_id} ({lead.company_name}).',
                'lead', lead.id, 'approval')
    if not manager_ids:
        _notify(current_user.id, 'No Approver Found',
                'No reporting manager or admin found to approve your request. Contact your administrator.',
                'lead', lead.id, 'warning')

    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@leads_bp.route('/<int:lid>/approve', methods=['POST'])
@login_required
def approve_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.approval_status != 'pending_approval':
        return jsonify({'error': 'No pending approval request.'}), 400
    if current_user.id not in _get_approvers(lead) and current_user.role != 'admin':
        return jsonify({'error': 'You are not authorized to approve this request.'}), 403

    lead.approval_status = 'approved'
    lead.approved_by = current_user.id
    lead.approved_at = datetime.utcnow()

    # Check if account already exists for this company
    existing_acc = Account.query.filter_by(company_name=lead.company_name).first()
    if existing_acc:
        acc = existing_acc
        acc_note = f'linked to existing account {acc.acc_id}'
    else:
        is_referred = lead.referral_opportunity_id is not None or lead.referring_account_id is not None
        acc = Account(
            acc_id=generate_id(Account, 'ACC'),
            company_name=lead.company_name,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            website=lead.website,
            address=lead.address,
            state=lead.state,
            pincode=lead.pincode,
            industry=lead.service_type,
            acquisition_source='Customer Referral' if is_referred else None,
            referred_by_account_id=lead.referring_account_id if is_referred else None,
            referral_opportunity_id=lead.referral_opportunity_id if is_referred else None,
            converted_lead_id=lead.id,
            conversion_date=datetime.utcnow(),
            created_by=current_user.id,
        )
        db.session.add(acc)
        db.session.flush()
        acc_note = f'new account {acc.acc_id} created'

    lead.account_id = acc.id
    lead.stage = 'Converted to Account'
    lead.account_created_by = current_user.id
    lead.account_created_at = datetime.utcnow()
    lead.is_readonly = True

    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=f'{lead.company_name} - Implementation',
        description=f'Project auto-created from lead {lead.lead_id} ({lead.company_name}). {lead.description or ""}',
        stage='Created',
        service_type=lead.service_type,
        account_id=acc.id,
        pm_id=current_user.id,
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.flush()

    copied_count = {'remarks': 0, 'notes': 0, 'activities': 0, 'proposals': 0, 'documents': 0}

    for r in LeadRemark.query.filter_by(lead_id=lid).all():
        if not r.deleted_at:
            pr = ProjectRemark(project_id=proj.id, text=f'[From Lead] {r.text}', created_by=r.created_by)
            db.session.add(pr)
            copied_count['remarks'] += 1

    for n in LeadNote.query.filter_by(lead_id=lid).all():
        pn = Note(project_id=proj.id, content=f'[From Lead] {n.content}', created_by=n.created_by)
        db.session.add(pn)
        copied_count['notes'] += 1

    for a in LeadActivity.query.filter_by(lead_id=lid).all():
        desc = a.description or ''
        pn = Note(project_id=proj.id,
                  content=f'[From Lead] Activity ({a.activity_type}): {a.title}. {desc}',
                  created_by=a.created_by)
        db.session.add(pn)
        copied_count['activities'] += 1

    for p in LeadProposal.query.filter_by(lead_id=lid).all():
        pr = ProjectRemark(project_id=proj.id,
                           text=f'[From Lead] Proposal #{p.proposal_no}: amount={p.amount}, status={p.status}, version={p.version}. {p.notes or ""}',
                           created_by=p.prepared_by or current_user.id)
        db.session.add(pr)
        copied_count['proposals'] += 1

    for d in LeadDocument.query.filter_by(lead_id=lid).all():
        pr = ProjectRemark(project_id=proj.id,
                           text=f'[From Lead] Document: {d.file_name} (category: {d.category or "N/A"})',
                           created_by=d.uploaded_by or current_user.id)
        db.session.add(pr)
        copied_count['documents'] += 1

    summary = f'Approved & {acc_note}. Project {proj.proj_id} created. Copied: {copied_count["remarks"]} remarks, {copied_count["notes"]} notes, {copied_count["activities"]} activities, {copied_count["proposals"]} proposals, {copied_count["documents"]} documents.'
    _audit(lid, 'Approved', 'Pending Approval', summary, current_user.id)
    _notify(lead.created_by, 'Approval Approved',
            f'Your request for lead {lead.lead_id} ({lead.company_name}) was approved. {acc_note}. Project {proj.proj_id} created.',
            'lead', lead.id, 'success')

    db.session.commit()
    return jsonify({
        'lead': lead.to_dict(),
        'account': acc.to_dict(),
        'project': proj.to_dict(),
    })


@leads_bp.route('/<int:lid>/create-project', methods=['POST'])
@login_required
def create_project_from_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.stage != 'Converted to Account':
        return jsonify({'error': 'Lead must be converted to account first.'}), 400
    if not lead.account_id:
        return jsonify({'error': 'Lead has no linked account.'}), 400
    data = request.get_json()
    if not data.get('title'):
        return jsonify({'error': 'Project title is required'}), 400
    if not data.get('pm_id'):
        return jsonify({'error': 'Project Manager (pm_id) is required'}), 400
    proj = Project(
        proj_id=generate_id(Project, 'PRJ'),
        title=data['title'],
        description=data.get('description', lead.description),
        stage='Created',
        service_type=data.get('service_type', lead.service_type),
        account_id=lead.account_id,
        pm_id=int(data['pm_id']),
        total_value=float(data['total_value']) if data.get('total_value') else lead.estimated_value,
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else datetime.utcnow().date(),
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        created_by=current_user.id,
    )
    db.session.add(proj)
    db.session.commit()
    _audit(lid, 'Project Created', None, f'Project {proj.proj_id} created', current_user.id)
    return jsonify({'project': proj.to_dict()}), 201


@leads_bp.route('/<int:lid>/reject', methods=['POST'])
@login_required
def reject_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if lead.approval_status != 'pending_approval':
        return jsonify({'error': 'No pending approval request.'}), 400
    if current_user.id not in _get_approvers(lead) and current_user.role != 'admin':
        return jsonify({'error': 'You are not authorized to reject this request.'}), 403

    data = request.get_json()
    reason = data.get('reason', 'No reason provided')
    if not reason.strip():
        return jsonify({'error': 'Rejection reason is required.'}), 400

    lead.approval_status = 'rejected'
    lead.stage = 'Approval Rejected'
    lead.rejection_reason = reason
    lead.approved_by = current_user.id
    lead.approved_at = datetime.utcnow()
    lead.is_readonly = False

    _audit(lid, 'Rejected', 'Pending Approval', f'Rejected: {reason}', current_user.id)
    _notify(lead.created_by, 'Approval Rejected',
            f'Your request for lead {lead.lead_id} ({lead.company_name}) was rejected. Reason: {reason}',
            'lead', lead.id, 'error')

    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@leads_bp.route('/<int:lid>/reopen', methods=['POST'])
@login_required
def reopen_lead(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    if current_user.role != 'admin':
        return jsonify({'error': 'Only admins can reopen leads.'}), 403
    if lead.stage not in ('Lead Closed (Won)', 'Lead Closed (Lost)', 'Approval Rejected', 'Converted to Account'):
        return jsonify({'error': 'Lead is not in a closed state.'}), 400

    old_stage = lead.stage
    lead.stage = 'Prospecting'
    lead.closed_on = None
    lead.closed_by = None
    lead.approval_status = None
    lead.approved_by = None
    lead.approved_at = None
    lead.rejection_reason = None
    lead.account_id = None
    lead.account_created_by = None
    lead.account_created_at = None
    lead.is_readonly = False

    _audit(lid, 'Reopened', old_stage, 'Prospecting', current_user.id)
    db.session.commit()
    return jsonify({'lead': lead.to_dict()})


@leads_bp.route('/<int:lid>/audit', methods=['GET'])
@login_required
def get_audit_logs(current_user, lid):
    Lead.query.get_or_404(lid)
    logs = LeadAuditLog.query.filter_by(lead_id=lid).order_by(LeadAuditLog.changed_at.desc()).all()
    return jsonify({'audit_logs': [l.to_dict() for l in logs]})


# --- Proposal routes ---

@leads_bp.route('/<int:lid>/proposals', methods=['GET'])
@login_required
def list_proposals(current_user, lid):
    Lead.query.get_or_404(lid)
    proposals = LeadProposal.query.filter_by(lead_id=lid).order_by(LeadProposal.created_at.desc()).all()
    return jsonify({'proposals': [p.to_dict() for p in proposals]})


@leads_bp.route('/<int:lid>/proposals', methods=['POST'])
@login_required
def create_proposal(current_user, lid):
    Lead.query.get_or_404(lid)
    data = request.get_json()
    if not data.get('amount'):
        return jsonify({'error': 'amount is required'}), 400
    prop = LeadProposal(
        proposal_no=generate_id(LeadProposal, 'PROP'),
        lead_id=lid,
        version=data.get('version', 1),
        amount=data.get('amount'),
        prepared_by=current_user.id,
        status=data.get('status', 'Draft'),
        notes=data.get('notes'),
    )
    db.session.add(prop)
    db.session.flush()
    _audit(lid, 'Proposal Created', None, f'Proposal {prop.proposal_no} worth ₹{prop.amount}', current_user.id)
    db.session.commit()
    return jsonify({'proposal': prop.to_dict()}), 201


@leads_bp.route('/<int:lid>/proposals/<int:pid>', methods=['PUT'])
@login_required
def update_proposal(current_user, lid, pid):
    prop = LeadProposal.query.filter_by(id=pid, lead_id=lid).first_or_404()
    data = request.get_json()
    old_status = prop.status
    for f in ['amount', 'version', 'status', 'notes']:
        if f in data:
            setattr(prop, f, data[f])
    if prop.status != old_status:
        _audit(lid, 'Proposal Status Changed', old_status, prop.status, current_user.id)
    db.session.commit()
    return jsonify({'proposal': prop.to_dict()})


@leads_bp.route('/<int:lid>/proposals/<int:pid>', methods=['DELETE'])
@login_required
def delete_proposal(current_user, lid, pid):
    prop = LeadProposal.query.filter_by(id=pid, lead_id=lid).first_or_404()
    db.session.delete(prop)
    db.session.commit()
    return jsonify({'message': 'Proposal deleted'})


# --- Existing sub-resource routes (unchanged) ---

@leads_bp.route('/<int:lid>/remarks', methods=['POST'])
@login_required
def add_remark(current_user, lid):
    Lead.query.get_or_404(lid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text is required'}), 400
    r = LeadRemark(lead_id=lid, text=data['text'][:1000], created_by=current_user.id)
    db.session.add(r)
    db.session.flush()
    _audit(lid, 'Remark Added', None, f'Remark by {current_user.full_name}', current_user.id)
    db.session.commit()
    return jsonify({'remark': r.to_dict()}), 201


@leads_bp.route('/<int:lid>/remarks/<int:rid>', methods=['PUT'])
@login_required
def update_remark(current_user, lid, rid):
    r = LeadRemark.query.filter_by(id=rid, lead_id=lid, deleted_at=None).first_or_404()
    if current_user.role != 'admin' and r.created_by != current_user.id:
        return jsonify({'error': 'You can only edit your own remarks'}), 403
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text is required'}), 400
    r.text = data['text'][:1000]
    r.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'remark': r.to_dict()})


@leads_bp.route('/<int:lid>/remarks/<int:rid>/react', methods=['POST'])
@login_required
def toggle_reaction(current_user, lid, rid):
    r = LeadRemark.query.filter_by(id=rid, lead_id=lid, deleted_at=None).first_or_404()
    data = request.get_json()
    emoji = data.get('emoji', '').strip()
    if not emoji or len(emoji) > 5:
        return jsonify({'error': 'Invalid emoji'}), 400
    existing = LeadRemarkReaction.query.filter_by(remark_id=rid, user_id=current_user.id, emoji=emoji).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'action': 'removed', 'remark': r.to_dict()})
    reaction = LeadRemarkReaction(remark_id=rid, user_id=current_user.id, emoji=emoji)
    db.session.add(reaction)
    db.session.commit()
    return jsonify({'action': 'added', 'remark': r.to_dict()}), 201


@leads_bp.route('/<int:lid>/documents', methods=['POST'])
@login_required
def upload_document(current_user, lid):
    Lead.query.get_or_404(lid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    fname = safe_filename(f'lead_{lid}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    doc = LeadDocument(
        lead_id=lid,
        file_name=file.filename,
        file_path=path,
        category=request.form.get('category', 'Proposal'),
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.flush()
    _audit(lid, 'Document Uploaded', None, file.filename, current_user.id)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@leads_bp.route('/<int:lid>/activities', methods=['POST'])
@login_required
def add_activity(current_user, lid):
    Lead.query.get_or_404(lid)
    data = request.get_json()
    if not data.get('title') or not data.get('activity_type'):
        return jsonify({'error': 'title and activity_type are required'}), 400
    a = LeadActivity(
        lead_id=lid,
        activity_type=data['activity_type'],
        title=data['title'],
        description=data.get('description'),
        activity_date=datetime.fromisoformat(data['activity_date']) if data.get('activity_date') else datetime.utcnow(),
        created_by=current_user.id,
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({'activity': a.to_dict()}), 201


@leads_bp.route('/<int:lid>/activities/<int:aid>', methods=['PUT'])
@login_required
def update_activity(current_user, lid, aid):
    a = LeadActivity.query.filter_by(id=aid, lead_id=lid).first_or_404()
    data = request.get_json()
    if 'description' in data:
        a.description = data['description']
    if 'title' in data:
        a.title = data['title']
    db.session.commit()
    return jsonify({'activity': a.to_dict()})


@leads_bp.route('/documents/<int:did>', methods=['GET'])
@login_required
def serve_document(current_user, did):
    d = LeadDocument.query.get_or_404(did)
    if not os.path.exists(d.file_path):
        return jsonify({'error': 'File not found'}), 404
    from flask import send_file
    return send_file(d.file_path, as_attachment=False, download_name=d.file_name)


@leads_bp.route('/<int:lid>/remarks/<int:rid>', methods=['DELETE'])
@login_required
def delete_remark(current_user, lid, rid):
    r = LeadRemark.query.filter_by(id=rid, lead_id=lid, deleted_at=None).first_or_404()
    if current_user.role != 'admin' and r.created_by != current_user.id:
        return jsonify({'error': 'You can only delete your own remarks'}), 403
    r.soft_delete()
    db.session.commit()
    return jsonify({'message': 'Remark deleted'})


@leads_bp.route('/<int:lid>/activities/<int:aid>', methods=['DELETE'])
@login_required
def delete_activity(current_user, lid, aid):
    a = LeadActivity.query.filter_by(id=aid, lead_id=lid).first_or_404()
    db.session.delete(a)
    db.session.commit()
    return jsonify({'message': 'Activity deleted'})


@leads_bp.route('/<int:lid>/documents/<int:did>', methods=['DELETE'])
@login_required
def delete_document(current_user, lid, did):
    d = LeadDocument.query.filter_by(id=did, lead_id=lid).first_or_404()
    if os.path.exists(d.file_path):
        os.remove(d.file_path)
    db.session.delete(d)
    db.session.commit()
    return jsonify({'message': 'Document deleted'})


@leads_bp.route('/<int:lid>/notes/<int:nid>', methods=['DELETE'])
@login_required
def delete_note(current_user, lid, nid):
    n = LeadNote.query.filter_by(id=nid, lead_id=lid).first_or_404()
    db.session.delete(n)
    db.session.commit()
    return jsonify({'message': 'Note deleted'})


@leads_bp.route('/<int:lid>/notes', methods=['POST'])
@login_required
def add_note(current_user, lid):
    Lead.query.get_or_404(lid)
    data = request.get_json()
    if not data.get('content'):
        return jsonify({'error': 'content is required'}), 400
    n = LeadNote(lead_id=lid, content=data['content'], created_by=current_user.id)
    db.session.add(n)
    db.session.commit()
    return jsonify({'note': n.to_dict()}), 201
