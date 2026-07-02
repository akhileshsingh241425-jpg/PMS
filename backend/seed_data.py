"""Seed dummy data — 10 users, 10 opportunities, 10 leads, 5 accounts, 5 projects."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User, Role, UserRole, Department, Opportunity, OpportunityRemark, Lead, LeadRemark, Account, Project, ProjectRemark, ProjectTeam, Task, Meeting, Note
from datetime import datetime, date, timedelta

app = create_app()

with app.app_context():
    # Clear old data
    db.session.execute(db.text("DELETE FROM notifications"))
    db.session.execute(db.text("DELETE FROM notes"))
    db.session.execute(db.text("DELETE FROM meetings"))
    db.session.execute(db.text("DELETE FROM tasks"))
    db.session.execute(db.text("DELETE FROM project_team"))
    db.session.execute(db.text("DELETE FROM project_remarks"))
    db.session.execute(db.text("DELETE FROM project_documents"))
    db.session.execute(db.text("DELETE FROM projects"))
    db.session.execute(db.text("DELETE FROM lead_remarks"))
    db.session.execute(db.text("DELETE FROM lead_documents"))
    db.session.execute(db.text("DELETE FROM leads"))
    db.session.execute(db.text("DELETE FROM opportunity_remarks"))
    db.session.execute(db.text("DELETE FROM opportunities"))
    db.session.execute(db.text("DELETE FROM accounts"))
    db.session.execute(db.text("DELETE FROM user_roles"))
    db.session.execute(db.text("DELETE FROM user_permissions"))
    db.session.execute(db.text("DELETE FROM users"))
    db.session.commit()

    # Roles
    roles = {r.code: r for r in Role.query.all()}
    depts = {d.code: d for d in Department.query.all()}

    # ═══════════ USERS (10) ═══════════
    users_data = [
        # Super Admin
        {'emp_id': 'ADMIN001', 'email': 'jagbir@infocus-it.com', 'first_name': 'Jagbir', 'last_name': 'Singh', 'phone': '9810000001', 'designation': 'Director', 'dept': 'IT', 'role': 'super_admin', 'certs': ['CISSP', 'CISA'], 'exp': 15.0},
        # Project Leads
        {'emp_id': 'IT0001', 'email': 'baljeet@infocus-it.com', 'first_name': 'Baljeet', 'last_name': 'Singh', 'phone': '9810000002', 'designation': 'Project Lead', 'dept': 'IT', 'role': 'project_lead', 'certs': ['CEH', 'OSCP'], 'exp': 8.5},
        {'emp_id': 'IT0002', 'email': 'naveen@infocus-it.com', 'first_name': 'Naveen', 'last_name': 'Dham', 'phone': '9810000003', 'designation': 'Senior Consultant', 'dept': 'IT', 'role': 'project_lead', 'certs': ['CISM', 'ISO 27001 LA'], 'exp': 10.0},
        # Consultants / Auditors
        {'emp_id': 'IT0003', 'email': 'rishav@infocus-it.com', 'first_name': 'Rishav', 'last_name': 'Kumar', 'phone': '9810000004', 'designation': 'Security Consultant', 'dept': 'IT', 'role': 'consultant', 'certs': ['CEH'], 'exp': 6.9},
        {'emp_id': 'IT0004', 'email': 'shivam@infocus-it.com', 'first_name': 'Shivam', 'last_name': 'Kulshrestha', 'phone': '9810000005', 'designation': 'Senior Auditor', 'dept': 'IT', 'role': 'consultant', 'certs': ['CEH', 'ISO 27001 LA'], 'exp': 6.9},
        {'emp_id': 'IT0005', 'email': 'priya@infocus-it.com', 'first_name': 'Priya', 'last_name': 'Sharma', 'phone': '9810000006', 'designation': 'Auditor', 'dept': 'IT', 'role': 'consultant', 'certs': ['CEH'], 'exp': 4.0},
        {'emp_id': 'IT0006', 'email': 'amit@infocus-it.com', 'first_name': 'Amit', 'last_name': 'Verma', 'phone': '9810000007', 'designation': 'Junior Analyst', 'dept': 'IT', 'role': 'employee', 'certs': [], 'exp': 1.5},
        # BD Executive
        {'emp_id': 'BD0001', 'email': 'ravi@infocus-it.com', 'first_name': 'Ravi', 'last_name': 'Kapoor', 'phone': '9810000008', 'designation': 'BD Manager', 'dept': 'BD', 'role': 'bd_executive', 'certs': [], 'exp': 5.0},
        {'emp_id': 'BD0002', 'email': 'kavita@infocus-it.com', 'first_name': 'Kavita', 'last_name': 'Mehta', 'phone': '9810000009', 'designation': 'BD Executive', 'dept': 'BD', 'role': 'bd_executive', 'certs': [], 'exp': 3.0},
        # Finance
        {'emp_id': 'ADM001', 'email': 'neha@infocus-it.com', 'first_name': 'Neha', 'last_name': 'Gupta', 'phone': '9810000010', 'designation': 'Finance Manager', 'dept': 'ADMIN', 'role': 'employee', 'certs': [], 'exp': 4.0},
    ]

    created_users = {}
    for u in users_data:
        user = User(
            emp_id=u['emp_id'], email=u['email'], first_name=u['first_name'],
            last_name=u['last_name'], phone=u['phone'], designation=u['designation'],
            department_id=depts[u['dept']].id, certifications=u['certs'],
            experience_years=u['exp']
        )
        user.set_password('pass123')
        db.session.add(user)
        db.session.flush()
        role = roles.get(u['role'])
        if role:
            db.session.add(UserRole(user_id=user.id, role_id=role.id))
        created_users[u['email']] = user

    db.session.commit()
    print(f"Created {len(created_users)} users")

    # Get user references
    jagbir = created_users['jagbir@infocus-it.com']
    baljeet = created_users['baljeet@infocus-it.com']
    naveen = created_users['naveen@infocus-it.com']
    rishav = created_users['rishav@infocus-it.com']
    shivam = created_users['shivam@infocus-it.com']
    priya = created_users['priya@infocus-it.com']
    amit = created_users['amit@infocus-it.com']
    ravi = created_users['ravi@infocus-it.com']
    kavita = created_users['kavita@infocus-it.com']
    neha = created_users['neha@infocus-it.com']

    # ═══════════ OPPORTUNITIES (10) ═══════════
    opps_data = [
        {'company': 'IFCI Limited', 'contact': 'Vivek Gupta', 'email': 'vivek@ifci.com', 'phone': '9811111001', 'source': 'Referral', 'service': 'Cloud Security Audit', 'value': 350000, 'stage': 'Closed Won', 'assigned': ravi.id},
        {'company': 'Institute of Company Secretaries', 'contact': 'Rajesh Kumar', 'email': 'rajesh@icsi.edu', 'phone': '9811111002', 'source': 'Website', 'service': 'VAPT', 'value': 250000, 'stage': 'Closed Won', 'assigned': ravi.id},
        {'company': 'Amplus Green Power', 'contact': 'Suresh Jain', 'email': 'suresh@amplus.in', 'phone': '9811111003', 'source': 'Cold Call', 'service': 'Network Security Audit', 'value': 400000, 'stage': 'Closed Won', 'assigned': kavita.id},
        {'company': 'CISF 7th Battalion', 'contact': 'Col. Sharma', 'email': 'col.sharma@cisf.gov.in', 'phone': '9811111004', 'source': 'Referral', 'service': 'Network Security Audit', 'value': 300000, 'stage': 'Proposal/Price Quote', 'assigned': ravi.id},
        {'company': 'Videonetics Technology', 'contact': 'Ankit Patel', 'email': 'ankit@videonetics.com', 'phone': '9811111005', 'source': 'LinkedIn', 'service': 'Application Security', 'value': 200000, 'stage': 'Negotiation/Review', 'assigned': kavita.id},
        {'company': 'Punjab National Bank', 'contact': 'DGM IT', 'email': 'dgm.it@pnb.co.in', 'phone': '9811111006', 'source': 'Referral', 'service': 'RBI Audit', 'value': 500000, 'stage': 'Needs Analysis', 'assigned': ravi.id},
        {'company': 'UIDAI Regional Office', 'contact': 'Director IT', 'email': 'dir.it@uidai.gov.in', 'phone': '9811111007', 'source': 'Conference', 'service': 'IS Audit', 'value': 450000, 'stage': 'Value Proposition', 'assigned': ravi.id},
        {'company': 'Tata Power Solar', 'contact': 'CTO', 'email': 'cto@tatapowersolar.com', 'phone': '9811111008', 'source': 'Partner', 'service': 'ISMS Implementation', 'value': 800000, 'stage': 'Qualification', 'assigned': kavita.id},
        {'company': 'Metro Rail Corp', 'contact': 'CISO', 'email': 'ciso@metrorail.gov.in', 'phone': '9811111009', 'source': 'Referral', 'service': 'Compliance Audit', 'value': 600000, 'stage': 'Prospecting', 'assigned': ravi.id},
        {'company': 'ABC Fintech', 'contact': 'CEO', 'email': 'ceo@abcfintech.com', 'phone': '9811111010', 'source': 'Email Campaign', 'service': 'VAPT', 'value': 150000, 'stage': 'Closed Lost', 'assigned': kavita.id},
    ]

    opp_objects = []
    for i, o in enumerate(opps_data):
        opp = Opportunity(
            opp_id=f'OPP{str(i+1).zfill(4)}', company_name=o['company'],
            contact_name=o['contact'], contact_email=o['email'], contact_phone=o['phone'],
            source=o['source'], service_interest=o['service'], estimated_value=o['value'],
            stage=o['stage'], probability={'Closed Won':100,'Closed Lost':0,'Prospecting':10,'Qualification':10,'Needs Analysis':20,'Value Proposition':50,'Proposal/Price Quote':90,'Negotiation/Review':90}.get(o['stage'], 50),
            assigned_to=o['assigned'], created_by=ravi.id,
            description=f"Client {o['company']} is looking for {o['service']} services. Initial discussion done via {o['source']}.",
        )
        if o['stage'] == 'Closed Lost':
            opp.loss_reason = 'Budget constraints — went with cheaper vendor'
        db.session.add(opp)
        db.session.flush()
        opp_objects.append(opp)

        # Add remarks
        db.session.add(OpportunityRemark(opportunity_id=opp.id, text=f"Initial contact made with {o['contact']} from {o['company']}. Interested in {o['service']}.", created_by=o['assigned']))
        if o['stage'] not in ['Prospecting', 'Qualification']:
            db.session.add(OpportunityRemark(opportunity_id=opp.id, text=f"Follow-up call done. Client confirmed interest. Need to prepare proposal.", created_by=o['assigned']))

    db.session.commit()
    print(f"Created {len(opp_objects)} opportunities")

    # ═══════════ ACCOUNTS (5) ═══════════
    accounts_data = [
        {'company': 'IFCI Limited', 'contact': 'Vivek Gupta', 'email': 'vivek@ifci.com', 'phone': '9811111001', 'industry': 'Finance & Banking', 'gst': '07AAACM6396E2ZC', 'city': 'New Delhi', 'state': 'Delhi'},
        {'company': 'Institute of Company Secretaries', 'contact': 'Rajesh Kumar', 'email': 'rajesh@icsi.edu', 'phone': '9811111002', 'industry': 'Education', 'gst': '07AABCI1234A1ZP', 'city': 'Noida', 'state': 'Uttar Pradesh'},
        {'company': 'Amplus Green Power', 'contact': 'Suresh Jain', 'email': 'suresh@amplus.in', 'phone': '9811111003', 'industry': 'Energy & Power', 'gst': '09AABCA5678B1ZQ', 'city': 'Lucknow', 'state': 'Uttar Pradesh'},
        {'company': 'Videonetics Technology', 'contact': 'Ankit Patel', 'email': 'ankit@videonetics.com', 'phone': '9811111005', 'industry': 'IT & Technology', 'gst': '06AABCV9012C1ZR', 'city': 'Gurugram', 'state': 'Haryana'},
        {'company': 'CISF 7th Battalion', 'contact': 'Col. Sharma', 'email': 'col.sharma@cisf.gov.in', 'phone': '9811111004', 'industry': 'Government', 'gst': '', 'city': 'Kishtwar', 'state': 'Jammu & Kashmir'},
    ]

    acc_objects = []
    for i, a in enumerate(accounts_data):
        acc = Account(
            acc_id=f'ACC{str(i+1).zfill(4)}', company_name=a['company'],
            contact_name=a['contact'], contact_email=a['email'], contact_phone=a['phone'],
            industry=a['industry'], gst_no=a['gst'] or None, city=a['city'], state=a['state'],
            country='India', account_type='B2B', status='Active', created_by=jagbir.id,
        )
        db.session.add(acc)
        db.session.flush()
        acc_objects.append(acc)

    db.session.commit()
    print(f"Created {len(acc_objects)} accounts")

    # ═══════════ LEADS (10) ═══════════
    leads_data = [
        {'company': 'IFCI Limited', 'service': 'Cloud Security Audit', 'stage': 'Lead Converted', 'value': 350000, 'acc': 0, 'opp': 0, 'assigned': ravi.id},
        {'company': 'Institute of Company Secretaries', 'service': 'VAPT', 'stage': 'Lead Converted', 'value': 250000, 'acc': 1, 'opp': 1, 'assigned': ravi.id},
        {'company': 'Amplus Green Power', 'service': 'Network Security Audit', 'stage': 'Lead Converted', 'value': 400000, 'acc': 2, 'opp': 2, 'assigned': kavita.id},
        {'company': 'IFCI Limited', 'service': 'IS Audit', 'stage': 'Proposal', 'value': 200000, 'acc': 0, 'opp': None, 'assigned': ravi.id},
        {'company': 'Videonetics Technology', 'service': 'Application Security', 'stage': 'Demo or Meeting', 'value': 200000, 'acc': 3, 'opp': 4, 'assigned': kavita.id},
        {'company': 'Punjab National Bank', 'service': 'RBI Audit', 'stage': 'Prospecting', 'value': 500000, 'acc': None, 'opp': 5, 'assigned': ravi.id},
        {'company': 'Tata Power Solar', 'service': 'ISMS Implementation', 'stage': 'Lead Qualification', 'value': 800000, 'acc': None, 'opp': 7, 'assigned': kavita.id},
        {'company': 'CISF 7th Battalion', 'service': 'Network Security Audit', 'stage': 'Purchase Order', 'value': 300000, 'acc': 4, 'opp': 3, 'assigned': ravi.id},
        {'company': 'Metro Rail Corp', 'service': 'Compliance Audit', 'stage': 'Negotiation & Commitment', 'value': 600000, 'acc': None, 'opp': 8, 'assigned': ravi.id},
        {'company': 'SBI Cards', 'service': 'VAPT', 'stage': 'Lead Closed', 'value': 180000, 'acc': None, 'opp': None, 'assigned': kavita.id},
    ]

    lead_objects = []
    for i, l in enumerate(leads_data):
        lead = Lead(
            lead_id=f'LD{str(i+1).zfill(4)}', company_name=l['company'],
            contact_name=accounts_data[l['acc']]['contact'] if l['acc'] is not None else 'Contact Person',
            contact_email=accounts_data[l['acc']]['email'] if l['acc'] is not None else f'contact{i}@company.com',
            contact_phone=accounts_data[l['acc']]['phone'] if l['acc'] is not None else '9800000000',
            source='Opportunity' if l['opp'] is not None else 'Referral',
            service_type=l['service'], stage=l['stage'], estimated_value=l['value'],
            assigned_to=l['assigned'],
            account_id=acc_objects[l['acc']].id if l['acc'] is not None else None,
            opportunity_id=opp_objects[l['opp']].id if l['opp'] is not None else None,
            created_by=l['assigned'],
            description=f"Client requires {l['service']} services. Verified requirement from opportunity stage.",
        )
        db.session.add(lead)
        db.session.flush()
        lead_objects.append(lead)

        db.session.add(LeadRemark(lead_id=lead.id, text=f"Lead created from opportunity. Client confirmed {l['service']} requirement.", created_by=l['assigned']))
        if l['stage'] not in ['Prospecting', 'Lead Qualification']:
            db.session.add(LeadRemark(lead_id=lead.id, text="Proposal document shared with client. Waiting for feedback.", created_by=l['assigned']))

    db.session.commit()
    print(f"Created {len(lead_objects)} leads")

    # ═══════════ PROJECTS (5) ═══════════
    projects_data = [
        {'title': 'IFCI Cloud Security Audit 2026', 'acc': 0, 'lead': 0, 'service': 'Cloud Security Audit', 'pm': baljeet.id, 'value': 350000, 'stage': 'Execution', 'team': [rishav.id, shivam.id, amit.id]},
        {'title': 'ICSI Web Application VAPT', 'acc': 1, 'lead': 1, 'service': 'VAPT', 'pm': baljeet.id, 'value': 250000, 'stage': 'Internal Review', 'team': [rishav.id, priya.id]},
        {'title': 'Amplus SCADA Network Audit', 'acc': 2, 'lead': 2, 'service': 'Network Security Audit', 'pm': naveen.id, 'value': 400000, 'stage': 'Client Review', 'team': [shivam.id, amit.id]},
        {'title': 'IFCI IS Audit FY26', 'acc': 0, 'lead': 3, 'service': 'IS Audit', 'pm': naveen.id, 'value': 200000, 'stage': 'Planning', 'team': [priya.id]},
        {'title': 'Videonetics Thick Client Audit', 'acc': 3, 'lead': 4, 'service': 'Application Security', 'pm': baljeet.id, 'value': 200000, 'stage': 'Initiated', 'team': [rishav.id]},
    ]

    for i, p in enumerate(projects_data):
        proj = Project(
            proj_id=f'PRJ{str(i+1).zfill(4)}', title=p['title'],
            description=f"Security assessment project for {acc_objects[p['acc']].company_name}. Service: {p['service']}.",
            stage=p['stage'], service_type=p['service'],
            account_id=acc_objects[p['acc']].id, lead_id=lead_objects[p['lead']].id,
            pm_id=p['pm'], total_value=p['value'],
            start_date=date(2026, 6, 1) + timedelta(days=i*7),
            target_date=date(2026, 7, 15) + timedelta(days=i*7),
            is_client_review_enabled=(p['stage'] == 'Client Review'),
            created_by=jagbir.id,
        )
        db.session.add(proj)
        db.session.flush()

        # Add team
        for uid in p['team']:
            db.session.add(ProjectTeam(project_id=proj.id, user_id=uid, role_in_project='Auditor'))

        # Add remarks
        db.session.add(ProjectRemark(project_id=proj.id, text=f"Project initiated. Team assigned. Starting {p['service']} for {acc_objects[p['acc']].company_name}.", created_by=p['pm']))
        if p['stage'] not in ['Initiated', 'Planning']:
            db.session.add(ProjectRemark(project_id=proj.id, text="Work in progress. Tools configured, scanning started.", created_by=p['team'][0]))

        # Add tasks
        db.session.add(Task(title=f"Setup tools for {p['service']}", module_type='project', module_id=proj.id, status='Completed', priority='High', assigned_to=p['team'][0], created_by=p['pm']))
        db.session.add(Task(title="Prepare initial report draft", module_type='project', module_id=proj.id, status='In Progress' if p['stage'] == 'Execution' else 'Open', priority='Normal', assigned_to=p['team'][0], created_by=p['pm']))

        # Add meeting
        db.session.add(Meeting(title=f"Kickoff meeting - {p['title']}", module_type='project', module_id=proj.id, meeting_date=datetime(2026, 6, 5+i, 10, 0), location='Online (Google Meet)', status='Completed', mom=f"Discussed scope for {p['service']}. Timeline confirmed.", created_by=p['pm']))

        # Add note for client review stage
        if p['stage'] == 'Client Review':
            db.session.add(Note(content="Draft report shared. Please review and provide your feedback.", module_type='project', module_id=proj.id, is_client_note=False, created_by=p['pm']))

    db.session.commit()
    print(f"Created {len(projects_data)} projects with team, tasks, meetings")

    # ═══════════ PRINT LOGIN CREDENTIALS ═══════════
    print("\n" + "="*60)
    print("  LOGIN CREDENTIALS — All passwords: pass123")
    print("="*60)
    print(f"\n{'Role':<20} {'Name':<25} {'Email':<35}")
    print("-"*80)
    for u in users_data:
        print(f"{u['role']:<20} {u['first_name']+' '+u['last_name']:<25} {u['email']:<35}")
    print("-"*80)
    print("\nPassword for ALL users: pass123")
    print("="*60)
