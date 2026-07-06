"""Seed fresh data for demo."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User, Account, Project, ProjectRemark, ProjectTeam, Task, Meeting, Note, Lead, LeadRemark, Opportunity, OpportunityRemark
from datetime import datetime, date, timedelta
import random

app = create_app()

with app.app_context():
    db.create_all()

    # Clear old data
    for table in ['finding_queries', 'client_uploads', 'meeting_requests', 'notes', 'meetings', 'tasks',
                  'project_team', 'project_remarks', 'project_documents', 'projects',
                  'lead_notes', 'lead_activities', 'lead_documents', 'lead_remarks', 'leads',
                  'opportunity_remarks', 'opportunities',
                  'accounts', 'users']:
        db.session.execute(db.text(f"DELETE FROM {table}"))
    db.session.commit()

    # ── USERS ──
    users_data = [
        {'emp_id': 'ADMIN001', 'email': 'admin@infocus-it.com', 'first_name': 'Admin', 'last_name': 'User', 'phone': '9810000001', 'designation': 'Director', 'role': 'admin'},
        {'emp_id': 'PL0001', 'email': 'lead@infocus-it.com', 'first_name': 'Project', 'last_name': 'Lead', 'phone': '9810000002', 'designation': 'Project Lead', 'role': 'user'},
        {'emp_id': 'TM0001', 'email': 'member@infocus-it.com', 'first_name': 'Team', 'last_name': 'Member', 'phone': '9810000003', 'designation': 'Security Consultant', 'role': 'user'},
    ]
    created = {}
    for u in users_data:
        user = User(emp_id=u['emp_id'], email=u['email'], first_name=u['first_name'],
                    last_name=u['last_name'], phone=u['phone'], designation=u['designation'], role=u['role'])
        user.set_password('pass123')
        db.session.add(user)
        db.session.flush()
        created[u['email']] = user
    db.session.commit()
    print("OK Created 3 users")

    admin = created['admin@infocus-it.com']
    p_lead = created['lead@infocus-it.com']
    member = created['member@infocus-it.com']

    # ── ACCOUNT (Client) ──
    acc = Account(
        acc_id='ACC0001', company_name='Test Company Pvt Ltd',
        contact_name='John Doe', contact_email='john@testcompany.com', contact_phone='9811111001',
        industry='IT & Technology', city='New Delhi', state='Delhi', country='India',
        account_type='B2B', status='Active', created_by=admin.id,
    )
    db.session.add(acc)
    db.session.flush()

    # Client user login
    client_user = User(
        emp_id='CLT001', email='client@testcompany.com', first_name='John', last_name='Doe',
        phone='9811111001', designation='Client Contact', role='client',
        account_id=acc.id, client_company_name='Test Company Pvt Ltd',
    )
    client_user.set_password('pass123')
    db.session.add(client_user)
    db.session.commit()
    print("OK Created account + client login")

    # ── 3 OPPORTUNITIES for this client ──
    opps_data = [
        {'company': 'Test Company Pvt Ltd', 'contact': 'John Doe', 'email': 'john@testcompany.com', 'phone': '9811111001',
         'source': 'Website', 'service': 'VAPT', 'value': 180000, 'stage': 'Value Proposition',
         'desc': 'Interested in VAPT for their web application portfolio.'},
        {'company': 'Test Company Pvt Ltd', 'contact': 'John Doe', 'email': 'john@testcompany.com', 'phone': '9811111001',
         'source': 'Referral', 'service': 'Cloud Security Audit', 'value': 420000, 'stage': 'Needs Analysis',
         'desc': 'Exploring cloud security assessment for AWS migration.'},
        {'company': 'Test Company Pvt Ltd', 'contact': 'John Doe', 'email': 'john@testcompany.com', 'phone': '9811111001',
         'source': 'Existing Client', 'service': 'IS Audit', 'value': 250000, 'stage': 'Prospecting',
         'desc': 'Annual IS audit requirement for compliance.'},
    ]
    for i, od in enumerate(opps_data):
        prob_map = {'Prospecting': 10, 'Qualification': 10, 'Needs Analysis': 20, 'Value Proposition': 50,
                    'Identify Decision Makers': 70, 'Perception Analysis': 80, 'Proposal/Price Quote': 90,
                    'Negotiation/Review': 90, 'Closed Won': 100, 'Closed Lost': 0}
        opp = Opportunity(
            opp_id=f'OPP{str(i+1).zfill(4)}', company_name=od['company'],
            contact_name=od['contact'], contact_email=od['email'], contact_phone=od['phone'],
            source=od['source'], service_interest=od['service'], description=od['desc'],
            stage=od['stage'], estimated_value=od['value'], probability=prob_map.get(od['stage'], 10),
            assigned_to=p_lead.id, created_by=admin.id, account_id=acc.id,
        )
        db.session.add(opp)
        db.session.flush()
        db.session.add(OpportunityRemark(opportunity_id=opp.id, text=f"Opportunity created for {od['service']}. Client is in {od['stage']} stage.", created_by=admin.id))
    db.session.commit()
    print("OK Created 3 opportunities with remarks")

    # ── 3 LEADS for this client ──
    leads_data = [
        {'subject': 'VAPT for Web Application', 'service': 'VAPT', 'value': 150000, 'stage': 'Proposal', 'desc': 'Need to test web application for OWASP Top 10 vulnerabilities.'},
        {'subject': 'IS Audit for IT Infrastructure', 'service': 'IS Audit', 'value': 280000, 'stage': 'Lead Qualification', 'desc': 'Information Systems Audit for the company IT infrastructure.'},
        {'subject': 'Cloud Security Assessment', 'service': 'Cloud Security Audit', 'value': 350000, 'stage': 'Prospecting', 'desc': 'Cloud security assessment for AWS environment.'},
    ]
    for i, ld in enumerate(leads_data):
        lead = Lead(
            lead_id=f'LD{str(i+1).zfill(4)}', company_name='Test Company Pvt Ltd',
            contact_name='John Doe', contact_email='john@testcompany.com', contact_phone='9811111001',
            source='Website', type='New Business', stage=ld['stage'],
            subject=ld['subject'], description=ld['desc'],
            estimated_value=ld['value'], service_type=ld['service'],
            assigned_to=p_lead.id, created_by=admin.id, account_id=acc.id,
        )
        db.session.add(lead)
        db.session.flush()
        db.session.add(LeadRemark(lead_id=lead.id, text=f"Lead created for {ld['service']}. Assigned to project lead.", created_by=admin.id))
    db.session.commit()
    print("OK Created 3 leads with remarks")

    # ── 3 PROJECTS for this account ──
    projects_data = [
        {'title': 'Web Application VAPT', 'service': 'VAPT', 'value': 150000, 'stage': 'Execution', 'team': [member.id]},
        {'title': 'IT Infrastructure IS Audit', 'service': 'IS Audit', 'value': 280000, 'stage': 'Planning', 'team': [member.id]},
        {'title': 'Cloud Security Audit - AWS', 'service': 'Cloud Security Audit', 'value': 350000, 'stage': 'Created', 'team': [member.id]},
    ]
    for i, p in enumerate(projects_data):
        proj = Project(
            proj_id=f'PRJ{str(i+1).zfill(4)}', title=p['title'],
            description=f"Security assessment for Test Company Pvt Ltd. Service: {p['service']}.",
            stage=p['stage'], service_type=p['service'],
            account_id=acc.id, pm_id=p_lead.id, total_value=p['value'],
            start_date=date(2026, 7, 1) + timedelta(days=i*7),
            target_date=date(2026, 8, 15) + timedelta(days=i*7),
            is_client_review_enabled=(p['stage'] == 'Client Review'),
            created_by=admin.id,
        )
        db.session.add(proj)
        db.session.flush()

        for uid in p['team']:
            db.session.add(ProjectTeam(project_id=proj.id, user_id=uid, role_in_project='Auditor'))

        db.session.add(ProjectRemark(project_id=proj.id, text=f"Project started. Team assigned for {p['service']}.", created_by=p_lead.id))
        if p['stage'] != 'Created':
            db.session.add(ProjectRemark(project_id=proj.id, text="Work in progress. Initial assessment completed.", created_by=member.id))

        db.session.add(Task(title=f"Setup scanning tools for {p['service']}", project_id=proj.id, status='Completed', priority='High', assigned_to=member.id, created_by=p_lead.id))
        db.session.add(Task(title="Prepare preliminary findings report", project_id=proj.id, status='In Progress' if p['stage'] == 'Execution' else 'Open', priority='Normal', assigned_to=member.id, created_by=p_lead.id))

        db.session.add(Meeting(title=f"Kickoff - {p['title']}", project_id=proj.id, meeting_date=datetime(2026, 7, 8+i, 10, 0), location='Google Meet', status='Completed', mom=f"Discussed scope for {p['service']}. Timeline confirmed.", created_by=p_lead.id))

    db.session.commit()
    print("OK Created 3 projects with team, tasks, meetings")

    # ── CREDENTIALS ──
    print("\n" + "="*60)
    print("             ALL LOGIN CREDENTIALS")
    print("="*60)
    print(f"{'Role':<20} {'Email':<30} {'Password':<15}")
    print("-"*60)
    print(f"{'Super Admin':<20} {'admin@infocus-it.com':<30} {'pass123':<15}")
    print(f"{'Project Lead':<20} {'lead@infocus-it.com':<30} {'pass123':<15}")
    print(f"{'Team Member':<20} {'member@infocus-it.com':<30} {'pass123':<15}")
    print(f"{'Client':<20} {'client@testcompany.com':<30} {'pass123':<15}")
    print("="*60)
