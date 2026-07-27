"""Assign reporting_manager_id for employees based on project assignments or fallback to first PM"""
from app import create_app
from models import db, User, ProjectTeam, Project

def assign_reporting_managers():
    app = create_app()
    with app.app_context():
        pms = User.query.filter(User.role.in_(['project_manager', 'admin', 'super_admin'])).all()
        print("Available managers:")
        for u in pms:
            print(f"  ID={u.id:2d} | {u.full_name:25s} | role={u.role}")
        print()

        if not pms:
            print("No managers found!")
            return

        default_mgr_id = pms[0].id
        print(f"Default fallback manager: ID={default_mgr_id} ({pms[0].full_name})")

        updated = 0
        emps = User.query.filter_by(role='employee').all()
        for e in emps:
            # Skip if already assigned
            if e.reporting_manager_id:
                print(f"  SKIP {e.full_name:20s} - already has manager ID={e.reporting_manager_id}")
                continue

            # Try to find a PM from project assignments
            teams = ProjectTeam.query.filter_by(user_id=e.id).all()
            assigned_mgr = None
            for t in teams:
                p = Project.query.get(t.project_id)
                if p and p.pm_id:
                    pm = User.query.get(p.pm_id)
                    if pm and pm.role == 'project_manager':
                        assigned_mgr = p.pm_id
                        break

            if assigned_mgr:
                e.reporting_manager_id = assigned_mgr
                mgr_name = User.query.get(assigned_mgr).full_name
                print(f"  SET  {e.full_name:20s} -> {mgr_name} (from project PM)")
            else:
                e.reporting_manager_id = default_mgr_id
                print(f"  SET  {e.full_name:20s} -> {pms[0].full_name} (fallback)")
            updated += 1

        # Set HR -> admin
        hr_users = User.query.filter_by(role='hr').all()
        admin = User.query.filter_by(role='admin').first()
        if admin:
            for hr in hr_users:
                if not hr.reporting_manager_id:
                    hr.reporting_manager_id = admin.id
                    print(f"  SET  {hr.full_name:20s} -> {admin.full_name} (HR->admin)")
                    updated += 1

        # Set Finance -> admin
        fin_users = User.query.filter_by(role='finance').all()
        for fin in fin_users:
            if not fin.reporting_manager_id:
                fin.reporting_manager_id = admin.id if admin else default_mgr_id
                mgr_name = admin.full_name if admin else pms[0].full_name
                print(f"  SET  {fin.full_name:20s} -> {mgr_name} (Finance->admin)")
                updated += 1

        db.session.commit()
        print(f"\nTotal updated: {updated}")

if __name__ == '__main__':
    assign_reporting_managers()