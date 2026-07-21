"""Seed full dummy data — 10 main clients, 20+ subs, 25 projects, 20 leads, 15 employees."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, Client, Project, Lead, User
from utils import generate_id
from datetime import datetime, date, timedelta
import random

app = create_app()

EMPLOYEES = [
    ('amit', 'Amit', 'Verma'), ('priya', 'Priya', 'Sharma'), ('raj', 'Raj', 'Kumar'),
    ('neha', 'Neha', 'Singh'), ('vikram', 'Vikram', 'Patel'), ('pooja', 'Pooja', 'Gupta'),
    ('sandeep', 'Sandeep', 'Yadav'), ('anita', 'Anita', 'Jain'), ('manoj', 'Manoj', 'Reddy'),
    ('deepika', 'Deepika', 'Das'), ('arjun', 'Arjun', 'Nair'), ('kavita', 'Kavita', 'Joshi'),
    ('suresh', 'Suresh', 'Menon'), ('rekha', 'Rekha', 'Agarwal'), ('gaurav', 'Gaurav', 'Bose'),
]

MAIN_CLIENTS = [
    ('Infocus IT Services', 'Delhi', 'Rahul Sharma', 'IT', 'Active'),
    ('Delhi Metro Rail Corp', 'Delhi', 'Amit Verma', 'PSU', 'Active'),
    ('State Bank of India', 'Mumbai', 'Priya Patel', 'BFSI', 'Active'),
    ('NTPC Limited', 'Noida', 'Vikram Singh', 'PSU', 'Active'),
    ('Bharti Airtel', 'Gurgaon', 'Sunil Mittal', 'Telecom', 'Active'),
    ('Tata Consultancy Services', 'Mumbai', 'Rajesh Gopinathan', 'IT', 'Active'),
    ('Reliance Industries', 'Mumbai', 'Mukesh Ambani', 'Conglomerate', 'Active'),
    ('Apollo Hospitals', 'Hyderabad', 'Dr. Prathap Reddy', 'Healthcare', 'Active'),
    ('HDFC Bank', 'Mumbai', 'Aditya Puri', 'BFSI', 'Active'),
    ('Indian Oil Corporation', 'Delhi', 'SM Vaidya', 'PSU', 'Active'),
    ('Microsoft India', 'Hyderabad', 'Anant Maheshwari', 'IT', 'Inactive'),
    ('Google India', 'Bangalore', 'Santhosh Kumar', 'IT', 'Active'),
    ('Amazon India', 'Bangalore', 'Amit Agarwal', 'E-commerce', 'Active'),
    ('Flipkart', 'Bangalore', 'Kalyan Krishnamurthy', 'E-commerce', 'Active'),
    ('Zomato', 'Gurgaon', 'Deepinder Goyal', 'Food Tech', 'Active'),
]

SUB_CLIENTS_MAP = {
    'Delhi Metro Rail Corp': ['DMRC IT Solutions', 'DMRC Electrical', 'DMRC Civil Works', 'DMRC Safety Division'],
    'Tata Consultancy Services': ['TCS BFSI Unit', 'TCS Retail Unit', 'TCS Healthcare Unit'],
    'Reliance Industries': ['Reliance Jio', 'Reliance Retail', 'Reliance Petrochem'],
    'HDFC Bank': ['HDFC Securities', 'HDFC Life', 'HDFC Ergo'],
    'Bharti Airtel': ['Airtel Digital', 'Airtel Payments Bank', 'Airtel X-Labs'],
    'NTPC Limited': ['NTPC Solar', 'NTPC Thermal', 'NTPC Wind'],
    'Microsoft India': ['Microsoft Azure India', 'Microsoft 365 India'],
    'Amazon India': ['AWS India', 'Amazon FBA India'],
    'Flipkart': ['Flipkart Health+', 'Flipkart Wholesale'],
    'Zomato': ['Zomato Hyperpure', 'Zomato Dining'],
}

SERVICES = ['VAPT', 'IS Audit', 'ISMS Implementation', 'Security Assessment', 'Compliance Audit', 'Cloud Security', 'Network Audit']
LEAD_SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email', 'Partner']
LEAD_STAGES = ['Prospecting', 'Lead Qualification', 'Demo or Meeting', 'Proposal', 'Negotiation & Commitment']

PROJECT_STAGES = ['Created', 'Planning', 'Information Gathering', 'Execution', 'Internal Review', 'Client Review', 'Final Delivery', 'Closed']

with app.app_context():
    print("Clearing existing data...")
    db.session.execute(db.text("DELETE FROM project_team"))
    db.session.execute(db.text("DELETE FROM project_remark_reactions"))
    db.session.execute(db.text("DELETE FROM project_remarks"))
    db.session.execute(db.text("DELETE FROM po_payments"))
    db.session.execute(db.text("DELETE FROM project_documents"))
    db.session.execute(db.text("DELETE FROM project_reports"))
    db.session.execute(db.text("DELETE FROM project_phases"))
    db.session.execute(db.text("DELETE FROM tasks"))
    db.session.execute(db.text("DELETE FROM projects"))
    db.session.execute(db.text("DELETE FROM leads"))
    db.session.execute(db.text("DELETE FROM clients"))
    db.session.execute(db.text("DELETE FROM users"))
    db.session.commit()
    print("All data cleared.\n")

    # ── 1. CREATE 15 EMPLOYEES ──
    print("─" * 40)
    print("Creating 15 employees...")
    admin = User(
        emp_id='ADMIN001', email='jagbir@infocus-it.com',
        first_name='Jagbir', last_name='Singh', phone='9810000001',
        designation='Director', role='admin',
    )
    admin.set_password('pass123')
    db.session.add(admin)
    db.session.flush()
    print(f"  Admin: jagbir@infocus-it.com / pass123")

    emp_ids = []
    for username, fn, ln in EMPLOYEES:
        u = User(
            emp_id=f'EMP{len(emp_ids)+1001:04d}',
            email=f'{username}@gmail.com',
            first_name=fn, last_name=ln,
            phone=f'981{1000000 + len(emp_ids):07d}',
            designation=random.choice(['Security Analyst', 'Pentester', 'Auditor', 'Consultant', 'Project Manager', 'Compliance Officer']),
            role='user',
            department=random.choice(['Cybersecurity', 'IT Audit', 'Compliance', 'VAPT', 'Consulting']),
            is_active=True,
        )
        u.set_password('pass123')
        db.session.add(u)
        db.session.flush()
        emp_ids.append(u.id)
    print(f"  Created {len(emp_ids)} employees (firstname@gmail.com / pass123)")

    # ── 2. CREATE 15 MAIN CLIENTS ──
    print("\n─" * 40)
    print("Creating main clients...")
    main_ids = []
    for name, city, contact, industry, status in MAIN_CLIENTS:
        c = Client(
            name=name, client_code=generate_id(Client, 'ACC'),
            gst_number=f'07{random.choice(["AAAA","AAAB","AAAC"])}{name[:3].upper():3s}1234A1Z{random.randint(1,9)}' if random.random() > 0.3 else '',
            location=city, contact_name=contact, contact_email=contact.lower().replace(' ','.') + '@' + name.lower().replace(' ','')[:10] + '.com',
            contact_phone=f'+91 98{random.randint(100,999)} {random.randint(10000,99999)}',
            industry=industry, status=status, client_type='main',
        )
        db.session.add(c)
        db.session.flush()
        main_ids.append(c.id)
        print(f"  [{len(main_ids):2d}] {name} ({c.client_code}) — {city} [{status}]")

    # ── 3. CREATE 24 SUB-CLIENTS ──
    print("\n─" * 40)
    print("Creating sub-clients...")
    sub_ids = []
    for parent_name, subs in SUB_CLIENTS_MAP.items():
        parent = Client.query.filter_by(name=parent_name).first()
        if not parent: continue
        for sub_name in subs:
            sc = Client(
                name=sub_name, client_code=generate_id(Client, 'ACC'),
                location=parent.location, contact_name=f'{sub_name} Contact',
                contact_email=sub_name.lower().replace(' ','.')[:15] + '@email.com',
                contact_phone=f'+91 98{random.randint(100,999)} {random.randint(10000,99999)}',
                industry=random.choice(['IT', 'Services', 'Consulting', 'Technology']),
                status='Active', client_type='sub', parent_client_id=parent.id,
            )
            db.session.add(sc)
            db.session.flush()
            sub_ids.append(sc.id)
    print(f"  Created {len(sub_ids)} sub-clients")

    # ── 4. CREATE 25 PROJECTS ──
    print("\n─" * 40)
    print("Creating 25 projects...")
    all_client_ids = main_ids + sub_ids
    proj_titles = [
        "VAPT Assessment", "Network Security Audit", "Web Application Pentest", "Mobile App Security Review",
        "Cloud Security Audit", "ISMS Implementation", "SOC 2 Compliance", "PCI DSS Assessment",
        "Phishing Simulation", "Endpoint Security Review", "API Security Audit", "Database Security Scan",
        "Firewall Configuration Review", "Incident Response Drill", "Security Awareness Training",
        "Red Team Exercise", "Vulnerability Assessment", "Penetration Testing", "Compliance Audit",
        "Risk Assessment", "Security Architecture Review", "IAM Implementation", "Data Privacy Assessment",
        "Business Continuity Audit", "DevSecOps Review",
    ]
    for i in range(25):
        cid = random.choice(all_client_ids)
        svc = random.choice(SERVICES)
        stage = random.choice(PROJECT_STAGES)
        days_ago = random.randint(1, 365)
        p = Project(
            proj_id=generate_id(Project, 'PRJ'),
            title=f"{random.choice(proj_titles)} — {random.choice(['Q1','Q2','Q3','Q4'])} 2026",
            service_type=svc, stage=stage, client_id=cid,
            created_by=random.choice(emp_ids + [admin.id]),
            created_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.session.add(p)
    print(f"  Created 25 projects")

    # ── 5. CREATE 20 LEADS ──
    print("\n─" * 40)
    print("Creating 20 leads...")
    lead_companies = [
        "TechVista Solutions", "GreenEnergy Corp", "MediCare Group", "EduPrime Institute",
        "SafeHaven Insurance", "AeroSpace Ltd", "AgroFresh Farms", "UrbanHousing Finance",
        "QuickShip Logistics", "CyberDefense Ltd", "DataVault Systems", "CloudNine Hosting",
        "PayFlow Fintech", "SmartBuild Constructions", "HealthFirst Diagnostics",
        "TravelEase Holidays", "FoodieBay", "AutoDrive Motors", "EduSmart Technologies", "SolarGrid Energy",
    ]
    for i, company in enumerate(lead_companies):
        assigned = random.choice(emp_ids)
        l = Lead(
            lead_id=generate_id(Lead, 'LD'),
            company_name=company,
            contact_name=f"{random.choice(['Raj','Anjali','Suresh','Meera','Vivek','Deepa'])} {random.choice(['Malhotra','Kapoor','Joshi','Iyer','Rao','Saxena'])}",
            contact_email=company.lower().replace(' ','')[:12] + '@email.com',
            contact_phone=f'+91 98{random.randint(100,999)} {random.randint(10000,99999)}',
            source=random.choice(LEAD_SOURCES), type='B2B',
            stage=random.choice(LEAD_STAGES),
            subject=f"{random.choice(['Cybersecurity','Compliance','Audit','Security Assessment','Risk Management'])} services required",
            estimated_value=random.choice([250000, 500000, 750000, 1000000, 1500000, 2000000]),
            service_type=random.choice(SERVICES),
            assigned_to=assigned, created_by=admin.id,
        )
        db.session.add(l)
    print(f"  Created 20 leads")

    db.session.commit()

    # ── SUMMARY ──
    print("\n" + "=" * 45)
    print("  SEED SUMMARY")
    print("=" * 45)
    print(f"  Users:     {User.query.count()} (1 admin + 15 employees)")
    print(f"  Main Clients: {Client.query.filter_by(client_type='main').count()}")
    print(f"  Sub Clients:  {Client.query.filter_by(client_type='sub').count()}")
    print(f"  Projects:  {Project.query.count()}")
    print(f"  Leads:     {Lead.query.count()}")
    print("=" * 45)
    print("Login: jagbir@infocus-it.com / pass123")
    print("Employees: firstname@gmail.com / pass123")
    print("Done.")
