# PMS Development Plan (Phase-Wise)

Based on SRS v1.0 — Current Codebase Gap Analysis

---

## Phase 1 — Core Workflow (Priority: HIGH)

### 1.1 Lead Proposals Submodule
- **Backend**: New model `Proposal` (proposal_no, version, date, amount, prepared_by, status, lead_id, attachments)
- **Backend**: New route `/api/leads/<id>/proposals` (CRUD)
- **Frontend**: Proposal section inside Lead Detail page (list, create, status change)
- **Frontend**: File upload for proposal attachments (PDF, Word, Excel)
- **Effort**: 2-3 days

### 1.2 Lead → Account Conversion Popup
- **Backend**: Enhance `POST /api/accounts` to accept `lead_id` and auto-copy lead data (company_name, contact, email, phone, address, website, industry)
- **Backend**: Link converted lead to newly created account (`lead.account_id = new_account.id`)
- **Backend**: Mark lead as read-only after conversion
- **Frontend**: When lead status changes to "Converted", show modal "Create Account?" with YES/NO
- **Frontend**: On YES, pre-fill account form with lead data, POST to create account
- **Frontend**: On success, redirect to new account detail page
- **Effort**: 2-3 days

### 1.3 Lead History Inside Account
- **Backend**: `GET /api/accounts/<id>/leads` — returns linked lead with remarks, proposals, documents
- **Frontend**: New "Lead History" tab in Account Detail page
- **Effort**: 1 day

---

## Phase 2 — Project Reports & Timeline (Priority: HIGH)

### 2.1 Project Reports Submodule
- **Backend**: New model `ProjectReport` (id, project_id, type=working|final, title, description, file_path, uploaded_by, uploaded_at, version)
- **Backend**: New route `/api/projects/<id>/reports` (CRUD, file upload)
- **Frontend**: New "Reports" tab in Project Detail page with two sections:
  - Working Reports (interim, partial, draft)
  - Final Report (final deliverable)
- **Effort**: 2 days

### 2.2 Account Activity Timeline
- **Backend**: Unified timeline endpoint `GET /api/accounts/<id>/timeline` — merges activities, audit logs, project updates, meeting logs, document uploads, notes — sorted by timestamp
- **Frontend**: Chronological timeline view in Account Detail page
- **Effort**: 1-2 days

---

## Phase 3 — Admin Panel & RBAC (Priority: MEDIUM)

### 3.1 Admin API Endpoints
- `GET /api/admin/employees` — list all users with roles
- `POST /api/admin/employees` — create user with role assignment
- `PUT /api/admin/employees/<id>` — update user, change role(s)
- `DELETE /api/admin/employees/<id>` — deactivate/delete user
- `GET /api/admin/permissions` — list available permissions
- `PUT /api/admin/permissions/<role>` — update role permissions
- `GET /api/auth/roles` — list available roles
- `GET /api/auth/departments` — list departments
- **Effort**: 2-3 days

### 3.2 Frontend Admin Panel
- Fix `Admin.jsx` and `Users.jsx` to work with real APIs
- Multi-role assignment UI
- Permission editing UI
- **Effort**: 2 days

---

## Phase 4 — Global Search & Dashboard (Priority: MEDIUM)

### 4.1 Global Search
- **Backend**: `GET /api/search?q=<query>` — search across leads (title, name, company), accounts (company_name, contact_name), projects (title), contacts, employees
- **Backend**: Use SQL `LIKE` or FTS5 for SQLite
- **Frontend**: Search bar in navbar/sidebar, dropdown results grouped by module
- **Effort**: 1-2 days

### 4.2 Dashboard Enhancement
- **Backend**: Add more endpoints/widgets:
  - Employee workload (tasks per employee)
  - Team performance metrics
  - Calendar events (upcoming meetings)
- **Frontend**: Add quick action buttons, widget-based layout
- **Effort**: 2 days

---

## Phase 5 — Employee Portal, Teams & Client Portal (Priority: MEDIUM)

### 5.1 Employee Portal
- **Backend**: `GET /api/me/projects`, `GET /api/me/tasks`, `GET /api/me/meetings` — filtered by current user
- **Frontend**: Dedicated "My Workspace" page showing assigned projects, tasks, meetings
- **Effort**: 2 days

### 5.2 Team Module
- **Backend**: Model `Team` (id, name, leader_id, department) + `TeamMember` (team_id, user_id)
- **Backend**: CRUD routes for teams, team assignment to projects
- **Frontend**: Team management page, team assignment UI in project form
- **Effort**: 2-3 days

### 5.3 Client Portal Enhancement
- **Backend**: More client-facing endpoints (tasks, meetings, timeline)
- **Frontend**: Enhance `ClientPortal.jsx` — add Tasks view, Meetings view, Timeline view
- **Effort**: 2 days

---

## Phase 6 — Polish & Testing (Priority: LOW)

### 6.1 Testing
- Backend unit tests for all new routes
- Frontend integration testing

### 6.2 Bug Fixes
- Audit trail completeness
- Notification triggers for all actions
- Edge cases (empty states, error handling)

### 6.3 Performance
- Add indexes to frequently queried columns
- Optimize pagination queries

---

## Timeline Estimate

| Phase | Days | Dependencies |
|-------|------|-------------|
| Phase 1 | 5-7 | None |
| Phase 2 | 3-4 | None |
| Phase 3 | 4-5 | None |
| Phase 4 | 3-4 | None |
| Phase 5 | 5-6 | Phase 3 (for proper RBAC) |
| Phase 6 | 3-4 | All phases |

**Total: ~23-30 days**

---

## Recommendation

Start with **Phase 1** (Lead Proposals + Lead→Account Conversion) since this is the core business workflow that makes the PMS functional. Without it, leads can't properly convert to accounts, and the entire hierarchy breaks.
