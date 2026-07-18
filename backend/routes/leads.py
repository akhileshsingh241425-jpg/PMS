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

DEFAULT_PROPOSAL_TEMPLATE = """<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@page {{ size: A4; margin: 0; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: 'Times New Roman',Times,serif; font-size:12pt; line-height:1.5; color:#1F2937; background:#f0f0f0; padding:40px 20px; }}
.page {{ max-width:794px; margin:0 auto; background:#fff; padding:50px 60px; box-shadow:0 2px 12px rgba(0,0,0,.08); }}
.border-top {{ border-top:3px solid #1E3A5F; margin-bottom:20px; }}
.header {{ text-align:center; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #1E3A5F; }}
.header h1 {{ font-size:22pt; color:#1E3A5F; margin-bottom:4px; letter-spacing:1px; }}
.header .sub {{ font-size:11pt; color:#475569; }}
.ref-row {{ display:flex; justify-content:space-between; font-size:10pt; color:#475569; margin-bottom:20px; }}
.ref-row table {{ width:100%; }}
.ref-row td {{ padding:2px 0; }}
.to-block {{ margin-bottom:24px; }}
.to-block .label {{ font-weight:700; font-size:11pt; color:#1E3A5F; }}
.to-block .value {{ font-size:12pt; }}
.subject {{ font-size:13pt; font-weight:700; color:#1E3A5F; text-align:center; margin:20px 0; padding:8px 0; border-top:1px solid #CBD5E1; border-bottom:1px solid #CBD5E1; }}
.section {{ margin:20px 0; }}
.section h2 {{ font-size:14pt; color:#1E3A5F; border-bottom:1px solid #CBD5E1; padding-bottom:4px; margin-bottom:10px; }}
.section h3 {{ font-size:12pt; color:#1E3A5F; margin:10px 0 6px; }}
table {{ width:100%; border-collapse:collapse; font-size:11pt; margin:8px 0; }}
td, th {{ padding:7px 10px; text-align:left; border:1px solid #CBD5E1; vertical-align:top; }}
th {{ background:#F1F5F9; font-weight:700; color:#1E3A5F; }}
.pricing {{ margin:16px 0; }}
.pricing td:last-child {{ text-align:right; font-weight:700; }}
.total-row td {{ font-weight:700; font-size:12pt; background:#F8FAFC; }}
.terms {{ margin:16px 0; }}
.terms ol {{ margin-left:20px; }}
.terms li {{ margin:4px 0; }}
.signature {{ margin-top:30px; padding-top:20px; border-top:1px solid #CBD5E1; }}
.signature table {{ border:none; }}
.signature td {{ border:none; padding:10px 20px 10px 0; vertical-align:top; }}
.signature .line {{ border-top:1px solid #1F2937; width:200px; margin-top:30px; padding-top:4px; font-size:10pt; color:#475569; }}
.footer {{ text-align:center; font-size:9pt; color:#94A3B8; margin-top:30px; padding-top:12px; border-top:1px solid #E2E8F0; }}
</style></head><body>
<div class="page">
<div class="border-top"></div>
<div class="header">
<h1>PROPOSAL</h1>
<div class="sub">InFocus IT Solutions — Information Security Services</div>
</div>
<table class="ref-row"><tr>
<td><strong>Proposal No:</strong> {proposal_no}</td>
<td style="text-align:right"><strong>Date:</strong> {date}</td>
</tr><tr>
<td><strong>Version:</strong> v{version}</td>
<td style="text-align:right"><strong>Prepared By:</strong> {prepared_by}</td>
</tr></table>

<div class="to-block">
<div class="label">To,</div>
<div class="value">{company}<br>{contact_name}<br>{contact_email}<br>Phone: {contact_phone}</div>
</div>

<div class="subject">Subject: Proposal for {service} Services</div>

<div class="section">
<h2>1. Executive Summary</h2>
<p style="font-size:11pt;color:#475569;line-height:1.7;text-align:justify">Dear Sir/Madam,</p>
<p style="font-size:11pt;color:#475569;line-height:1.7;text-align:justify">Thank you for providing us the opportunity to submit this proposal for <strong>{service}</strong>. InFocus IT Solutions is pleased to present our comprehensive solution tailored to meet your requirements. We are confident that our approach, methodology, and experience will deliver the desired outcomes within the stipulated timeline.</p>
</div>

<div class="section">
<h2>2. Scope of Work</h2>
<p style="font-size:11pt;color:#475569;line-height:1.7;text-align:justify">{description}</p>
</div>

<div class="section">
<h2>3. Deliverables</h2>
<table>
<tr><th style="width:8%">#</th><th style="width:52%">Deliverable</th><th style="width:20%">Timeline</th><th style="width:20%">Format</th></tr>
<tr><td>1</td><td>Detailed Assessment Report</td><td>Within 2 weeks</td><td>PDF / DOCX</td></tr>
<tr><td>2</td><td>Findings & Recommendations</td><td>Within 3 weeks</td><td>PDF / PPT</td></tr>
<tr><td>3</td><td>Executive Summary Presentation</td><td>Within 4 weeks</td><td>PPT / PDF</td></tr>
<tr><td>4</td><td>Remediation Support</td><td>As per agreement</td><td>On-site / Remote</td></tr>
</table>
</div>

<div class="section">
<h2>4. Commercial Proposal</h2>
<table class="pricing">
<tr><th style="width:60%">Particulars</th><th style="width:40%">Amount (INR)</th></tr>
<tr><td>{service} — Professional Fees</td><td>₹{amount}</td></tr>
<tr><td>GST @ 18%</td><td>₹{gst}</td></tr>
<tr class="total-row"><td><strong>Total Amount (Including GST)</strong></td><td><strong>₹{total_with_gst}</strong></td></tr>
</table>
<p style="font-size:10pt;color:#475569;margin-top:4px;"><em>Amount in Words: [Amount in words]</em></p>
</div>

<div class="section">
<h2>5. Terms & Conditions</h2>
<div class="terms">
<ol>
<li><strong>Validity:</strong> This proposal is valid for <strong>15 days</strong> from the date mentioned above.</li>
<li><strong>Payment Terms:</strong> 50% advance payment upon acceptance, 40% on submission of draft report, 10% upon final delivery.</li>
<li><strong>Timeline:</strong> The project shall be completed within 4 weeks from the date of receiving the signed proposal and advance payment.</li>
<li><strong>Confidentiality:</strong> All information shared during the engagement shall be treated as strictly confidential.</li>
<li><strong>Non-Disclosure:</strong> Both parties agree to maintain confidentiality of all proprietary information exchanged.</li>
<li><strong>Force Majeure:</strong> Neither party shall be liable for delays due to circumstances beyond reasonable control.</li>
<li><strong>Governing Law:</strong> This agreement shall be governed by the laws of India.</li>
</ol>
</div>
</div>

<div class="section">
<h2>6. Notes</h2>
<p style="font-size:11pt;color:#475569;line-height:1.7;text-align:justify">{notes}</p>
</div>

<div class="signature">
<table>
<tr>
<td style="width:50%">
<div class="line">Authorized Signatory — InFocus IT Solutions</div>
</td>
<td style="width:50%">
<div class="line">Authorized Signatory — Client</div>
</td>
</tr>
</table>
</div>

<div class="footer">
<p>InFocus IT Solutions — <strong>Proposal #{proposal_no}</strong> — Page 1 of 1</p>
<p>This document is confidential and intended solely for the addressee.</p>
</div>
</div></body></html>"""


@leads_bp.route('/<int:lid>/proposals/template', methods=['GET'])
@login_required
def get_proposal_template(current_user, lid):
    lead = Lead.query.get_or_404(lid)
    today_str = datetime.utcnow().strftime('%d %B %Y')
    html = DEFAULT_PROPOSAL_TEMPLATE.format(
        proposal_no='PROP-_____',
        date=today_str,
        prepared_by=current_user.full_name,
        company=lead.company_name or 'Client Company',
        contact_name=lead.contact_name or 'Contact Person',
        contact_email=lead.contact_email or 'email@example.com',
        contact_phone=lead.contact_phone or '---',
        service=lead.service_type or 'Service',
        amount='[Enter Amount]',
        gst='[GST]',
        total_with_gst='[Total]',
        version='1',
        notes='[Enter terms & conditions here]',
        description=lead.description or '[Enter scope of work]',
    )
    return jsonify({'html': html})


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
        html_content=data.get('html_content'),
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
    for f in ['amount', 'version', 'status', 'notes', 'html_content']:
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


PROPOSAL_CSS = """
@page { size: A4; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Times New Roman',Times,serif; font-size:12pt; line-height:1.5; color:#1F2937; background:#f0f0f0; padding:40px 20px; }
.page { max-width:794px; margin:0 auto; background:#fff; padding:50px 60px; box-shadow:0 2px 12px rgba(0,0,0,.08); }
.border-top { border-top:3px solid #1E3A5F; margin-bottom:20px; }
.header { text-align:center; margin-bottom:30px; padding-bottom:20px; border-bottom:2px solid #1E3A5F; }
.header h1 { font-size:22pt; color:#1E3A5F; margin-bottom:4px; letter-spacing:1px; }
.header .sub { font-size:11pt; color:#475569; }
.ref-row td { padding:2px 12px 2px 0; font-size:10pt; color:#475569; }
.to-block { margin-bottom:24px; }
.to-block .label { font-weight:700; font-size:11pt; color:#1E3A5F; }
.to-block .value { font-size:12pt; }
.subject { font-size:13pt; font-weight:700; color:#1E3A5F; text-align:center; margin:20px 0; padding:8px 0; border-top:1px solid #CBD5E1; border-bottom:1px solid #CBD5E1; }
.section { margin:20px 0; }
.section h2 { font-size:14pt; color:#1E3A5F; border-bottom:1px solid #CBD5E1; padding-bottom:4px; margin-bottom:10px; }
.section h3 { font-size:12pt; color:#1E3A5F; margin:10px 0 6px; }
table { width:100%; border-collapse:collapse; font-size:11pt; margin:8px 0; }
td, th { padding:7px 10px; text-align:left; border:1px solid #CBD5E1; vertical-align:top; }
th { background:#F1F5F9; font-weight:700; color:#1E3A5F; }
.pricing td:last-child { text-align:right; font-weight:700; }
.total-row td { font-weight:700; font-size:12pt; background:#F8FAFC; }
.terms ol { margin-left:20px; }
.terms li { margin:4px 0; }
.sig-section { margin-top:30px; padding-top:20px; border-top:1px solid #CBD5E1; display:flex; justify-content:space-between; }
.sig-box { text-align:center; }
.sig-box img { max-height:60px; margin-bottom:6px; }
.sig-line { border-top:1px solid #1F2937; width:220px; padding-top:4px; font-size:10pt; color:#475569; }
.footer { text-align:center; font-size:9pt; color:#94A3B8; margin-top:30px; padding-top:12px; border-top:1px solid #E2E8F0; }
"""
PROPOSAL_FULL_WRAPPER_TOP = '<!DOCTYPE html>\n<html><head><meta charset="utf-8"><style>' + PROPOSAL_CSS + '</style></head><body>\n<div class="page">\n'
PROPOSAL_FULL_WRAPPER_BOTTOM = '\n</div></body></html>'

@leads_bp.route('/<int:lid>/proposals/<int:pid>/preview', methods=['GET'])
@login_required
def preview_proposal(current_user, lid, pid):
    prop = LeadProposal.query.filter_by(id=pid, lead_id=lid).first_or_404()
    if prop.html_content:
        return (PROPOSAL_FULL_WRAPPER_TOP + prop.html_content + PROPOSAL_FULL_WRAPPER_BOTTOM), 200, {'Content-Type': 'text/html; charset=utf-8'}
    amt = prop.amount or 0
    return DEFAULT_PROPOSAL_TEMPLATE.format(
        proposal_no=prop.proposal_no,
        date=prop.created_at.strftime('%d %B %Y') if prop.created_at else '',
        prepared_by=prop.preparer.full_name if prop.preparer else 'N/A',
        company='N/A', contact_name='N/A', contact_email='N/A',
        contact_phone='N/A', service='N/A', amount=str(prop.amount or ''),
        gst=str(round(amt * 0.18, 2)) if amt else '—',
        total_with_gst=str(round(amt * 1.18, 2)) if amt else '—',
        version=str(prop.version), notes=prop.notes or '', description='',
    ), 200, {'Content-Type': 'text/html; charset=utf-8'}


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
