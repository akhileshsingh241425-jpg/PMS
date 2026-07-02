"""Seed dummy data — users, accounts, projects."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User, Account, Project, ProjectRemark, ProjectDocument, ProjectTeam, Task, Meeting, Note
from datetime import datetime, date, timedelta

app = create_app()

with app.app_context():
    # Clear old data
    db.session.execute(db.text("DELETE FROM finding_queries"))
    db.session.execute(db.text("DELETE FROM client_uploads"))
    db.session.execute(db.text("DELETE FROM meeting_requests"))
    db.session.execute(db.text("DELETE FROM notes"))
    db.session.execute(db.text("DELETE FROM meetings"))
    db.session.execute(db.text("DELETE FROM tasks"))
    db.session.execute(db.text("DELETE FROM project_team"))
    db.session.execute(db.text("DELETE FROM project_remarks"))
    db.session.execute(db.text("DELETE FROM project_documents"))
    db.session.execute(db.text("DELETE FROM projects"))
    db.session.execute(db.text("DELETE FROM accounts"))
    db.session.execute(db.text("DELETE FROM users"))
    db.session.commit()

    # USERS
    users_data = [
        {'emp_id': 'ADMIN001', 'email': 'jagbir@infocus-it.com', 'first_name': 'Jagbir', 'last_name': 'Singh', 'phone': '9810000001', 'designation': 'Director', 'role': 'admin'},
        {'emp_id': 'IT0001', 'email': 'baljeet@infocus-it.com', 'first_name': 'Baljeet', 'last_name': 'Singh', 'phone': '9810000002', 'designation': 'Project Lead', 'role': 'user'},
        {'emp_id': 'IT0002', 'email': 'naveen@infocus-it.com', 'first_name': 'Naveen', 'last_name': 'Dham', 'phone': '9810000003', 'designation': 'Senior Consultant', 'role': 'user'},
        {'emp_id': 'IT0003', 'email': 'rishav@infocus-it.com', 'first_name': 'Rishav', 'last_name': 'Kumar', 'phone': '9810000004', 'designation': 'Security Consultant', 'role': 'user'},
        {'emp_id': 'IT0004', 'email': 'shivam@infocus-it.com', 'first_name': 'Shivam', 'last_name': 'Kulshrestha', 'phone': '9810000005', 'designation': 'Senior Auditor', 'role': 'user'},
        {'emp_id': 'IT0005', 'email': 'priya@infocus-it.com', 'first_name': 'Priya', 'last_name': 'Sharma', 'phone': '9810000006', 'designation': 'Auditor', 'role': 'user'},
        {'emp_id': 'IT0006', 'email': 'amit@infocus-it.com', 'first_name': 'Amit', 'last_name': 'Verma', 'phone': '9810000007', 'designation': 'Junior Analyst', 'role': 'user'},
        {'emp_id': 'BD0001', 'email': 'ravi@infocus-it.com', 'first_name': 'Ravi', 'last_name': 'Kapoor', 'phone': '9810000008', 'designation': 'BD Manager', 'role': 'user'},
        {'emp_id': 'BD0002', 'email': 'kavita@infocus-it.com', 'first_name': 'Kavita', 'last_name': 'Mehta', 'phone': '9810000009', 'designation': 'BD Executive', 'role': 'user'},
        {'emp_id': 'ADM001', 'email': 'neha@infocus-it.com', 'first_name': 'Neha', 'last_name': 'Gupta', 'phone': '9810000010', 'designation': 'Finance Manager', 'role': 'user'},
    ]

    created_users = {}
    for u in users_data:
        user = User(
            emp_id=u['emp_id'], email=u['email'], first_name=u['first_name'],
            last_name=u['last_name'], phone=u['phone'], designation=u['designation'],
            role=u['role'],
        )
        user.set_password('pass123')
        db.session.add(user)
        db.session.flush()
        created_users[u['email']] = user

    db.session.commit()
    print(f"Created {len(created_users)} users")

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

    # ACCOUNTS
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

    # PROJECTS
    projects_data = [
        {'title': 'IFCI Cloud Security Audit 2026', 'acc': 0, 'service': 'Cloud Security Audit', 'pm': baljeet.id, 'value': 350000, 'stage': 'Execution', 'team': [rishav.id, shivam.id, amit.id]},
        {'title': 'ICSI Web Application VAPT', 'acc': 1, 'service': 'VAPT', 'pm': baljeet.id, 'value': 250000, 'stage': 'Internal Review', 'team': [rishav.id, priya.id]},
        {'title': 'Amplus SCADA Network Audit', 'acc': 2, 'service': 'Network Security Audit', 'pm': naveen.id, 'value': 400000, 'stage': 'Client Review', 'team': [shivam.id, amit.id]},
        {'title': 'IFCI IS Audit FY26', 'acc': 0, 'service': 'IS Audit', 'pm': naveen.id, 'value': 200000, 'stage': 'Planning', 'team': [priya.id]},
        {'title': 'Videonetics Thick Client Audit', 'acc': 3, 'service': 'Application Security', 'pm': baljeet.id, 'value': 200000, 'stage': 'Initiated', 'team': [rishav.id]},
    ]

    for i, p in enumerate(projects_data):
        proj = Project(
            proj_id=f'PRJ{str(i+1).zfill(4)}', title=p['title'],
            description=f"Security assessment for {acc_objects[p['acc']].company_name}. Service: {p['service']}.",
            stage=p['stage'], service_type=p['service'],
            account_id=acc_objects[p['acc']].id,
            pm_id=p['pm'], total_value=p['value'],
            start_date=date(2026, 6, 1) + timedelta(days=i*7),
            target_date=date(2026, 7, 15) + timedelta(days=i*7),
            is_client_review_enabled=(p['stage'] == 'Client Review'),
            created_by=jagbir.id,
        )
        db.session.add(proj)
        db.session.flush()

        for uid in p['team']:
            db.session.add(ProjectTeam(project_id=proj.id, user_id=uid, role_in_project='Auditor'))

        db.session.add(ProjectRemark(project_id=proj.id, text=f"Project initiated. Team assigned. Starting {p['service']} for {acc_objects[p['acc']].company_name}.", created_by=p['pm']))
        if p['stage'] not in ['Initiated', 'Planning']:
            db.session.add(ProjectRemark(project_id=proj.id, text="Work in progress. Tools configured, scanning started.", created_by=p['team'][0]))

        db.session.add(Task(title=f"Setup tools for {p['service']}", project_id=proj.id, status='Completed', priority='High', assigned_to=p['team'][0], created_by=p['pm']))
        db.session.add(Task(title="Prepare initial report draft", project_id=proj.id, status='In Progress' if p['stage'] == 'Execution' else 'Open', priority='Normal', assigned_to=p['team'][0], created_by=p['pm']))

        db.session.add(Meeting(title=f"Kickoff meeting - {p['title']}", project_id=proj.id, meeting_date=datetime(2026, 6, 5+i, 10, 0), location='Online (Google Meet)', status='Completed', mom=f"Discussed scope for {p['service']}. Timeline confirmed.", created_by=p['pm']))

        if p['stage'] == 'Client Review':
            db.session.add(Note(content="Draft report shared. Please review and provide your feedback.", project_id=proj.id, is_client_note=False, created_by=p['pm']))

    db.session.commit()
    print(f"Created {len(projects_data)} projects with team, tasks, meetings")

    print("\nLOGIN CREDENTIALS - All passwords: pass123")
    print(f"\n{'Role':<20} {'Name':<25} {'Email':<35}")
    print("-"*80)
    for u in users_data:
        print(f"{u['role']:<20} {u['first_name']+' '+u['last_name']:<25} {u['email']:<35}")
    print("-"*80)
    print("\nPassword for ALL users: pass123")
