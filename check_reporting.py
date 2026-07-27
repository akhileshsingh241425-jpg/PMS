from app import create_app
from models import db, User, ProjectTeam, Project

app = create_app()
with app.app_context():
    emps = User.query.filter_by(role='employee').all()
    for e in emps:
        teams = ProjectTeam.query.filter_by(user_id=e.id).all()
        proj_names = []
        managers = []
        for t in teams:
            p = Project.query.get(t.project_id)
            if p:
                proj_names.append(p.title or str(p.id))
                if p.pm_id:
                    pm = User.query.get(p.pm_id)
                    if pm and pm.role == 'project_manager':
                        managers.append((p.pm_id, pm.full_name))
        uniq_mgrs = list(set(managers))
        flag = 'Y' if e.reporting_manager_id else 'N'
        print(f'{flag} | {e.full_name:20s} | role={e.role:15s} | teams={len(teams):2d} | mgrs={uniq_mgrs}')