from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

from .user import User
from .account import Account
from .project import Project, ProjectRemark, ProjectDocument, ProjectTeam
from .activity import Task, Meeting, Note
from .client_portal import MeetingRequest, ClientUpload, FindingQuery
