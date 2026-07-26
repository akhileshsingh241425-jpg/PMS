from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, Project, ProjectPhase, PlanSubmodule, PlanVersion, PlanTemplateMaster, PlanTemplateModule, PlanTemplateSubmodule, Task, Notification
from middleware.auth import login_required

plan_bp = Blueprint('plan_builder', __name__, url_prefix='/api/plan-builder')

DEFAULT_TEMPLATES = {
    'Technical Assessment': [
        {'module': 'Scoping & Pre-requisites', 'submodules': ['Scope freeze (URLs / IPs / APK)', 'Credentials & access', 'Test window approval', 'Rules of engagement'], 'deliverable': 'Signed scope document'},
        {'module': 'Information Gathering', 'submodules': ['Recon & enumeration', 'Architecture understanding', 'Role/privilege matrix mapping'], 'deliverable': 'Asset & attack-surface list'},
        {'module': 'Vulnerability Assessment', 'submodules': ['Automated scanning', 'Manual verification', 'False-positive elimination'], 'deliverable': 'Draft vulnerability list'},
        {'module': 'Penetration Testing', 'submodules': ['Exploitation (OWASP / ASVS / MASVS)', 'API testing', 'Business-logic testing', 'Privilege escalation'], 'deliverable': 'PoC evidence pack'},
        {'module': 'Reporting', 'submodules': ['Draft report with CVSS severity', 'Internal QA review', 'Report submission & walkthrough'], 'deliverable': 'Audit Report (Iteration 1)'},
        {'module': 'Confirmatory / Re-audit', 'submodules': ['Fix verification', 'Residual risk confirmation', 'Iteration 2 report'], 'deliverable': 'Compliance / re-audit report'},
        {'module': 'Certification & Closure', 'submodules': ['Safe-to-host certificate issue', 'Delivery note', 'Project closure MOM'], 'deliverable': 'Security Audit Certificate'},
    ],
    'GRC': [
        {'module': 'Initiation & Scoping', 'submodules': ['Applicable standards/regulations identification', 'Departments & locations in scope', 'Audit calendar'], 'deliverable': 'Engagement scope & plan'},
        {'module': 'Gap Assessment', 'submodules': ['Document review', 'Stakeholder interviews', 'Control testing', 'Gap register'], 'deliverable': 'Gap Assessment Report'},
        {'module': 'Risk Assessment', 'submodules': ['Asset register', 'Threat & vulnerability rating', 'Risk scoring matrix', 'Risk treatment plan'], 'deliverable': 'Risk Register & RTP'},
        {'module': 'Policy & Documentation', 'submodules': ['Policy/procedure drafting or review', 'SoA', 'Records & evidence templates'], 'deliverable': 'Policy & document set'},
        {'module': 'Compliance Mapping', 'submodules': ['Mapping to ISO 27001 / RBI / SEBI / IRDAI / CERT-In', 'DPDP requirements', 'Evidence collection tracker'], 'deliverable': 'Compliance matrix'},
        {'module': 'Internal Audit', 'submodules': ['Audit execution', 'NC reporting', 'CAPA follow-up'], 'deliverable': 'Internal Audit Report'},
        {'module': 'Reporting & Closure', 'submodules': ['Final report', 'Management presentation', 'Closure MOM'], 'deliverable': 'Final GRC Report'},
    ],
    'CS Framework Implementation': [
        {'module': 'Initiation & Scoping', 'submodules': ['Framework & boundary finalisation', 'Steering committee', 'Project charter'], 'deliverable': 'Project charter'},
        {'module': 'Gap Analysis', 'submodules': ['As-is assessment', 'Maturity scoring', 'Roadmap with priorities'], 'deliverable': 'Gap & roadmap report'},
        {'module': 'Framework Design', 'submodules': ['ISMS scope & SoA', 'Policies', 'Procedures & guidelines', 'Risk methodology'], 'deliverable': 'Approved document framework'},
        {'module': 'Risk Management', 'submodules': ['Risk assessment', 'Treatment plan', 'Residual risk acceptance'], 'deliverable': 'Risk register & RTP'},
        {'module': 'Controls Implementation', 'submodules': ['Technical & process controls deployment', 'Evidence generation', 'Metrics/KPIs'], 'deliverable': 'Control implementation tracker'},
        {'module': 'Awareness & Training', 'submodules': ['Role-based training', 'Phishing simulation', 'Awareness campaigns'], 'deliverable': 'Training records'},
        {'module': 'Internal Audit & MRM', 'submodules': ['Internal audit', 'Management review meeting', 'CAPA closure'], 'deliverable': 'IA report & MRM minutes'},
        {'module': 'Certification Support & Handover', 'submodules': ['Stage 1 / Stage 2 audit support', 'NC closure', 'Handover & sustenance plan'], 'deliverable': 'Certification + handover kit'},
    ],
}


def _notify(user_id, title, message, module_type=None, module_id=None):
    n = Notification(user_id=user_id, title=title, message=message,
                     module_type=module_type, module_id=module_id)
    db.session.add(n)


def seed_default_templates():
    for ptype, modules in DEFAULT_TEMPLATES.items():
        existing = PlanTemplateMaster.query.filter_by(project_type=ptype, is_active=True).first()
        if existing:
            continue
        tmpl = PlanTemplateMaster(project_type=ptype, name=f'{ptype} Template', is_active=True)
        db.session.add(tmpl)
        db.session.flush()
        for i, mod in enumerate(modules):
            m = PlanTemplateModule(template_id=tmpl.id, name=mod['module'], order=i)
            db.session.add(m)
            db.session.flush()
            for j, sm_name in enumerate(mod['submodules']):
                sm = PlanTemplateSubmodule(module_id=m.id, name=sm_name, default_deliverable=mod['deliverable'], order=j)
                db.session.add(sm)


# ─── TEMPLATE MASTER (Admin) ───────────────────────────────────────

@plan_bp.route('/templates', methods=['GET'])
@login_required
def list_templates(current_user):
    templates = PlanTemplateMaster.query.filter_by(is_active=True).order_by(PlanTemplateMaster.project_type).all()
    return jsonify({'templates': [t.to_dict() for t in templates]})


@plan_bp.route('/templates', methods=['POST'])
@login_required
def create_template(current_user):
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    if not data.get('project_type') or not data.get('name'):
        return jsonify({'error': 'project_type and name required'}), 400
    tmpl = PlanTemplateMaster(project_type=data['project_type'], name=data['name'],
                              description=data.get('description'), created_by=current_user.id)
    db.session.add(tmpl)
    db.session.flush()
    for i, m in enumerate(data.get('modules', [])):
        mod = PlanTemplateModule(template_id=tmpl.id, name=m['name'], order=i)
        db.session.add(mod)
        db.session.flush()
        for j, sm in enumerate(m.get('submodules', [])):
            db.session.add(PlanTemplateSubmodule(module_id=mod.id, name=sm.get('name', sm if isinstance(sm, str) else ''),
                                                  default_deliverable=sm.get('default_deliverable', m.get('deliverable')),
                                                  order=j))
    db.session.commit()
    return jsonify({'template': tmpl.to_dict()}), 201


@plan_bp.route('/templates/<int:tid>', methods=['PUT'])
@login_required
def update_template(current_user, tid):
    if current_user.role not in ('admin', 'super_admin'):
        return jsonify({'error': 'Admin access required'}), 403
    tmpl = PlanTemplateMaster.query.get_or_404(tid)
    data = request.get_json()
    if 'name' in data: tmpl.name = data['name']
    if 'description' in data: tmpl.description = data['description']
    if 'is_active' in data: tmpl.is_active = data['is_active']
    if 'modules' in data:
        for m in tmpl.modules:
            db.session.delete(m)
        for i, m in enumerate(data['modules']):
            mod = PlanTemplateModule(template_id=tmpl.id, name=m['name'], order=i)
            db.session.add(mod)
            db.session.flush()
            for j, sm in enumerate(m.get('submodules', [])):
                db.session.add(PlanTemplateSubmodule(module_id=mod.id, name=sm.get('name', sm if isinstance(sm, str) else ''),
                                                      default_deliverable=sm.get('default_deliverable'),
                                                      order=j))
    db.session.commit()
    return jsonify({'template': tmpl.to_dict()})


# ─── PLAN CRUD per Project ─────────────────────────────────────────

@plan_bp.route('/projects/<int:pid>/plan', methods=['GET'])
@login_required
def get_plan(current_user, pid):
    proj = Project.query.get_or_404(pid)
    phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()
    versions = proj.plan_versions.order_by(PlanVersion.version_number.desc()).limit(10).all()
    templates = PlanTemplateMaster.query.filter_by(is_active=True).order_by(PlanTemplateMaster.project_type).all()
    return jsonify({
        'phases': [p.to_dict() for p in phases],
        'plan_generated': proj.plan_generated,
        'plan_version': proj.plan_version or 1,
        'project_type': proj.project_type,
        'versions': [v.to_dict() for v in versions],
        'templates': [t.to_dict() for t in templates],
    })


@plan_bp.route('/projects/<int:pid>/plan/load-template', methods=['POST'])
@login_required
def load_template(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json()
    project_type = data.get('project_type') or proj.project_type
    if not project_type:
        return jsonify({'error': 'Project type not set'}), 400

    tmpl = PlanTemplateMaster.query.filter_by(project_type=project_type, is_active=True).first()
    if not tmpl:
        return jsonify({'error': f'No template found for {project_type}'}), 404

    return jsonify({'template': tmpl.to_dict()}), 200


@plan_bp.route('/projects/<int:pid>/plan/save', methods=['POST'])
@login_required
def save_plan(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json()
    phases_data = data.get('phases', [])

    # Delete existing phases and submodules
    existing = ProjectPhase.query.filter_by(project_id=pid).all()
    for p in existing:
        PlanSubmodule.query.filter_by(phase_id=p.id).delete()
        Task.query.filter_by(phase_id=p.id).update({Task.phase_id: None})
        db.session.delete(p)

    for i, ph in enumerate(phases_data):
        phase = ProjectPhase(
            project_id=pid, name=ph['name'], order=i,
            status='Pending', deliverable=ph.get('deliverable'),
            start_date=datetime.strptime(ph['start_date'], '%Y-%m-%d').date() if ph.get('start_date') else None,
            end_date=datetime.strptime(ph['end_date'], '%Y-%m-%d').date() if ph.get('end_date') else None,
            owner_id=ph.get('owner_id') or None,
            weight=float(ph.get('weight', 0)) if ph.get('weight') else 0,
            milestone_flag=ph.get('milestone_flag', False),
            plan_version=proj.plan_version or 1,
        )
        db.session.add(phase)
        db.session.flush()

        for j, sm in enumerate(ph.get('submodules', [])):
            sub = PlanSubmodule(
                phase_id=phase.id, name=sm['name'], order=j,
                deliverable=sm.get('deliverable'),
                start_date=datetime.strptime(sm['start_date'], '%Y-%m-%d').date() if sm.get('start_date') else None,
                end_date=datetime.strptime(sm['end_date'], '%Y-%m-%d').date() if sm.get('end_date') else None,
                owner_id=sm.get('owner_id') or None,
                support_ids=sm.get('support_ids') or [],
                effort_days=float(sm['effort_days']) if sm.get('effort_days') else None,
                dependency_id=sm.get('dependency_id') or None,
                milestone_flag=sm.get('milestone_flag', False),
            )
            db.session.add(sub)

    proj.plan_generated = True
    db.session.commit()
    phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()
    return jsonify({'phases': [p.to_dict() for p in phases]}), 201


# ─── VALIDATION ────────────────────────────────────────────────────

@plan_bp.route('/projects/<int:pid>/plan/validate', methods=['POST'])
@login_required
def validate_plan(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json() or {}
    phases_data = data.get('phases', [])

    errors = []
    warnings = []

    total_weight = 0
    submodule_ids = {}
    for i, ph in enumerate(phases_data):
        weight = float(ph.get('weight', 0) or 0)
        total_weight += weight

        if not ph.get('name'):
            errors.append(f'Module #{i+1}: name required')

        if not ph.get('submodules'):
            errors.append(f'Module "{ph["name"]}": at least one submodule required')
            continue

        for j, sm in enumerate(ph['submodules']):
            sid = sm.get('id') or f'{i}-{j}'
            submodule_ids[sid] = sm

            if not sm.get('name'):
                errors.append(f'Submodule #{j+1} in "{ph["name"]}": name required')

            if not sm.get('start_date'):
                errors.append(f'"{sm["name"]}": start date required')
            if not sm.get('end_date'):
                errors.append(f'"{sm["name"]}": end date required')

            if sm.get('start_date') and sm.get('end_date'):
                sd = datetime.strptime(sm['start_date'], '%Y-%m-%d').date()
                ed = datetime.strptime(sm['end_date'], '%Y-%m-%d').date()
                if sd > ed:
                    errors.append(f'"{sm["name"]}": end date before start date')
                if proj.po_expected_completion_date and ed > proj.po_expected_completion_date:
                    errors.append(f'"{sm["name"]}": end date {ed} exceeds PO delivery deadline {proj.po_expected_completion_date}')

            if not sm.get('owner_id'):
                errors.append(f'"{sm["name"]}": owner required')

            dep_id = sm.get('dependency_id')
            if dep_id:
                dep = submodule_ids.get(str(dep_id))
                if not dep:
                    errors.append(f'"{sm["name"]}": dependency {dep_id} not found')
                elif dep.get('end_date') and sm.get('start_date'):
                    dep_ed = datetime.strptime(dep['end_date'], '%Y-%m-%d').date()
                    sm_sd = datetime.strptime(sm['start_date'], '%Y-%m-%d').date()
                    if sm_sd < dep_ed:
                        errors.append(f'"{sm["name"]}": start date before dependency "{dep.get("name")}" end date')

            # Circular dependency check (2 levels deep)
            if dep_id:
                dep = submodule_ids.get(str(dep_id))
                if dep and dep.get('dependency_id') == sid:
                    errors.append(f'Circular dependency: "{sm["name"]}" <-> "{dep["name"]}"')

    if len(phases_data) > 0 and abs(total_weight - 100) > 0.01:
        errors.append(f'Module weights must total 100% (currently {total_weight:.1f}%)')

    # Capacity conflict warning
    owner_submodules = {}
    for ph in phases_data:
        for sm in ph.get('submodules', []):
            oid = sm.get('owner_id')
            if oid and sm.get('start_date') and sm.get('end_date'):
                owner_submodules.setdefault(oid, []).append(sm)
    for oid, subs in owner_submodules.items():
        for a in subs:
            for b in subs:
                if a == b: continue
                if a.get('start_date') and a.get('end_date') and b.get('start_date') and b.get('end_date'):
                    a_sd = datetime.strptime(a['start_date'], '%Y-%m-%d').date()
                    a_ed = datetime.strptime(a['end_date'], '%Y-%m-%d').date()
                    b_sd = datetime.strptime(b['start_date'], '%Y-%m-%d').date()
                    b_ed = datetime.strptime(b['end_date'], '%Y-%m-%d').date()
                    if a_sd <= b_ed and b_sd <= a_ed:
                        if a['name'] < b['name']:
                            warnings.append(f'Capacity conflict: "{a["name"]}" and "{b["name"]}" overlap for same owner')

    return jsonify({
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings,
        'total_weight': round(total_weight, 1),
    })


# ─── PUBLISH ───────────────────────────────────────────────────────

@plan_bp.route('/projects/<int:pid>/plan/publish', methods=['POST'])
@login_required
def publish_plan(current_user, pid):
    proj = Project.query.get_or_404(pid)
    data = request.get_json() or {}
    phases_data = data.get('phases', [])

    # First save the plan
    existing = ProjectPhase.query.filter_by(project_id=pid).all()
    for p in existing:
        PlanSubmodule.query.filter_by(phase_id=p.id).delete()
        Task.query.filter_by(phase_id=p.id).update({Task.phase_id: None})
        db.session.delete(p)

    for i, ph in enumerate(phases_data):
        phase = ProjectPhase(
            project_id=pid, name=ph['name'], order=i, status='Pending',
            deliverable=ph.get('deliverable'),
            start_date=datetime.strptime(ph['start_date'], '%Y-%m-%d').date() if ph.get('start_date') else None,
            end_date=datetime.strptime(ph['end_date'], '%Y-%m-%d').date() if ph.get('end_date') else None,
            owner_id=ph.get('owner_id') or None,
            weight=float(ph.get('weight', 0)) if ph.get('weight') else 0,
            milestone_flag=ph.get('milestone_flag', False),
            plan_version=(proj.plan_version or 1) + 1 if proj.plan_generated else 1,
        )
        db.session.add(phase)
        db.session.flush()

        for j, sm in enumerate(ph.get('submodules', [])):
            sub = PlanSubmodule(
                phase_id=phase.id, name=sm['name'], order=j,
                deliverable=sm.get('deliverable'),
                start_date=datetime.strptime(sm['start_date'], '%Y-%m-%d').date() if sm.get('start_date') else None,
                end_date=datetime.strptime(sm['end_date'], '%Y-%m-%d').date() if sm.get('end_date') else None,
                owner_id=sm.get('owner_id') or None,
                support_ids=sm.get('support_ids') or [],
                effort_days=float(sm['effort_days']) if sm.get('effort_days') else None,
                dependency_id=sm.get('dependency_id') or None,
                milestone_flag=sm.get('milestone_flag', False),
            )
            db.session.add(sub)
            db.session.flush()

            # Auto-create task from submodule
            task = Task(
                title=sub.name,
                project_id=pid,
                phase_id=phase.id,
                status='Open',
                priority='Normal',
                due_date=sub.end_date,
                estimated_hours=sub.effort_days * 8 if sub.effort_days else None,
                assigned_to=sub.owner_id,
                created_by=current_user.id,
            )
            db.session.add(task)

            # Schedule notification for owner
            if sub.owner_id and sub.end_date:
                reminder_date = sub.end_date - timedelta(days=2)
                if reminder_date <= datetime.utcnow().date():
                    _notify(sub.owner_id, f'Task due: {sub.name}',
                            f'Task "{sub.name}" in project {proj.proj_id} is due on {sub.end_date}',
                            'task', task.id)

    # Snapshot baseline on first publish
    is_baseline = not proj.plan_generated
    new_version = (proj.plan_version or 1) + 1 if proj.plan_generated else 1

    version = PlanVersion(
        project_id=pid,
        version_number=new_version,
        change_summary=data.get('change_summary', f'Plan v{new_version} published'),
        plan_data={'phases': phases_data},
        is_baseline=is_baseline,
        changed_by=current_user.id,
    )
    db.session.add(version)

    proj.plan_generated = True
    proj.plan_version = new_version
    if proj.stage == 'Created' or proj.stage == 'Initiated':
        proj.stage = 'Planning'

    # Notify team
    team_members = set()
    for ph in phases_data:
        if ph.get('owner_id'): team_members.add(ph['owner_id'])
        for sm in ph.get('submodules', []):
            if sm.get('owner_id'): team_members.add(sm['owner_id'])
            for sid in (sm.get('support_ids') or []):
                team_members.add(sid)
    for uid in team_members:
        if uid != current_user.id:
            _notify(uid, f'Plan published: {proj.proj_id}',
                    f'Project plan for {proj.title} (v{new_version}) has been published. New tasks assigned.',
                    'project', pid)

    db.session.commit()
    phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()
    return jsonify({
        'message': f'Plan v{new_version} published',
        'phases': [p.to_dict() for p in phases],
        'version': new_version,
        'is_baseline': is_baseline,
    }), 201


# ─── VERSIONS ──────────────────────────────────────────────────────

@plan_bp.route('/projects/<int:pid>/plan/versions', methods=['GET'])
@login_required
def list_plan_versions(current_user, pid):
    proj = Project.query.get_or_404(pid)
    versions = proj.plan_versions.order_by(PlanVersion.version_number.desc()).all()
    return jsonify({'versions': [v.to_dict() for v in versions]})


@plan_bp.route('/projects/<int:pid>/plan/versions/<int:vid>', methods=['GET'])
@login_required
def get_plan_version(current_user, pid, vid):
    version = PlanVersion.query.filter_by(id=vid, project_id=pid).first_or_404()
    return jsonify({'version': {**version.to_dict(), 'plan_data': version.plan_data}})


# ─── BASELINE vs ACTUAL ───────────────────────────────────────────

@plan_bp.route('/projects/<int:pid>/plan/baseline', methods=['GET'])
@login_required
def plan_baseline_comparison(current_user, pid):
    proj = Project.query.get_or_404(pid)
    baseline = PlanVersion.query.filter_by(project_id=pid, is_baseline=True).first()
    if not baseline:
        return jsonify({'has_baseline': False, 'message': 'No baseline plan found'})

    baseline_data = baseline.plan_data.get('phases', [])
    current_phases = ProjectPhase.query.filter_by(project_id=pid).order_by(ProjectPhase.order).all()

    actual_by_submodule = {}
    for sp in PlanSubmodule.query.join(ProjectPhase).filter(ProjectPhase.project_id == pid).all():
        actual_by_submodule[sp.name] = {
            'actual_start': sp.start_date.isoformat() if sp.start_date else None,
            'actual_end': sp.end_date.isoformat() if sp.end_date else None,
            'status': sp.status, 'progress': sp.progress,
        }

    comparison = []
    for bm in baseline_data:
        cm = next((p for p in current_phases if p.name == bm.get('name')), None)
        mod = {
            'name': bm.get('name'),
            'baseline_start': bm.get('start_date'),
            'baseline_end': bm.get('end_date'),
            'actual_start': cm.start_date.isoformat() if cm and cm.start_date else None,
            'actual_end': cm.end_date.isoformat() if cm and cm.end_date else None,
            'variance_days': None,
            'submodules': [],
        }
        if mod['baseline_start'] and mod['actual_start']:
            try:
                bs = datetime.strptime(mod['baseline_start'], '%Y-%m-%d').date()
                ac = datetime.strptime(mod['actual_start'], '%Y-%m-%d').date()
                mod['variance_days'] = (ac - bs).days
            except (ValueError, TypeError):
                pass
        for bsm in bm.get('submodules', []):
            act = actual_by_submodule.get(bsm.get('name'), {})
            var = None
            if bsm.get('end_date') and act.get('actual_end'):
                try:
                    be = datetime.strptime(bsm['end_date'], '%Y-%m-%d').date()
                    ae = datetime.strptime(act['actual_end'], '%Y-%m-%d').date()
                    var = (ae - be).days
                except (ValueError, TypeError):
                    pass
            mod['submodules'].append({
                'name': bsm.get('name'),
                'baseline_end': bsm.get('end_date'),
                'actual_end': act.get('actual_end'),
                'variance_days': var,
                'status': act.get('status', 'Unknown'),
                'progress': act.get('progress', 0),
            })
        comparison.append(mod)

    return jsonify({
        'has_baseline': True,
        'baseline_version': baseline.version_number,
        'comparison': comparison,
    })
