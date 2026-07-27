from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

from .user import User
from .project import Project, ProjectPhase, ProjectAsset, ProjectRemark, ProjectRemarkReaction, ProjectDocument, ProjectTeam, ProjectReport, PoPayment, PlanTemplateMaster, PlanTemplateModule, PlanTemplateSubmodule, PlanVersion, PlanSubmodule
from .activity import Task, TaskChecklistItem, TaskComment, Meeting, MeetingShare, MeetingActivity, MeetingDocument, MeetingRequestDocument, Note
from .client_portal import MeetingRequest, MeetingRequestShare, MeetingRequestActivity, ClientUpload, FindingQuery
from .lead import Lead, LeadRemark, LeadRemarkReaction, LeadDocument, LeadActivity, LeadNote, LeadAuditLog, LeadProposal
from .notification import Notification
from .enterprise import ProjectRisk, ProjectIssue, ProjectMilestone, ProjectInvoice, ProjectTimesheet, ProjectChangeRequest, ApprovalHistory
from .vulnerability import Vulnerability
from .rbac import AuditLog, has_permission
from .team import Team, TeamMember
from .attendance import Attendance
from .device_token import DeviceToken
from .location_log import LocationLog
from .conversation import ChatConversation, ChatConversationParticipant, ConversationMessage, ChatMessageStatus
from .backlog import Epic, Sprint, Issue
from .client import Client, ClientContact, ClientRemark, ClientFollowUp, ClientChangeLog, ClientReference, SectorMaster, VendorCategoryMaster, CountryMaster, StateMaster, CityMaster
from .po_out import POLineItem, TDSRecord, POVersion
from .email_integration import EmailAccount, EmailMessage, EmailFolder, EmailAuthState, EmailActivity, EmailNote, EmailAutoRule, EmailFollowUp, EmailTemplate, CATEGORIES, EMAIL_STATUSES, PRIORITIES, TAGS_PRESET
from .finding import Finding
from .leave import LeaveRequest
from .expense import ExpenseEntry
from .day_end_log import DayEndLog
from .app_setting import AppSetting, DEFAULT_SETTINGS
from .task_activity import TaskActivity

