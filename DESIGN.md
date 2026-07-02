# PMS v2 — Complete System Design
## INFOCUS-IT | Cybersecurity Audit & Compliance Company

---

## 1. SYSTEM OVERVIEW

This is a **CRM + Project Management** system for a cybersecurity audit company.
Complete lifecycle: First Contact → Deal Close → Project Delivery → Payment Collection.

---

## 2. USER HIERARCHY & ROLES

```
DIRECTOR / SUPER ADMIN
├── BD Manager (Sales Head)
│   └── BD Executives (Sales team)
├── Delivery Head / Project Lead
│   ├── Senior Consultants / Auditors
│   └── Junior Analysts
└── Finance / Accounts
```

### Roles:
| Role | Who | System Access |
|------|-----|---------------|
| Super Admin | Director/Owner | Everything — create users, approve, override |
| Project Lead | Delivery head | Projects, team, document review, approve reports |
| Consultant | Senior auditor | Execute projects, upload reports, manage tasks |
| BD Executive | Sales person | Opportunities, Leads only |
| Employee | Junior staff | Only assigned tasks/projects |

### Key Rule:
- **Super Admin + Project Lead** = Can APPROVE documents
- **Consultant/Employee** = Can only SUBMIT documents
- **Client** = Can only VIEW approved documents + write Notes

---

## 3. COMPLETE WORKFLOW

```
                    ┌─────────────────────────┐
                    │  BD Executive creates    │
                    │  OPPORTUNITY              │
                    │  (First contact/referral)│
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
     Conversation          Proposal           Negotiation
     & Follow-ups          Sent              & Pricing
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │    CLOSED WON?          │
                    │    Yes → Create LEAD    │
                    │    No → Closed Lost     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  LEAD created            │
                    │  Collect verified info   │
                    │  Get PO, Sign agreement  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  Lead Converted          │
                    │  → ACCOUNT created       │
                    │  (Client master record)  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  PROJECT created under   │
                    │  Account                 │
                    │  PM assigned, team added │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
    Team does audit      Uploads report       Manager reviews
    (VAPT/IS Audit)      (document upload)    (Approve/Reject)
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  APPROVAL FLOW:          │
                    │                          │
                    │  Auditor uploads report  │
                    │       ↓                  │
                    │  Status = "Pending"      │
                    │       ↓                  │
                    │  Project Lead reviews    │
                    │       ↓                  │
                    │  Approved? → Client sees │
                    │  Rejected? → Remarks     │
                    │       ↓ (auditor fixes)  │
                    │  Re-submit → Review again│
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  CLIENT PORTAL           │
                    │  - Sees approved docs    │
                    │  - Writes Notes/Queries  │
                    │  - Super Admin responds  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  Invoice → Payment       │
                    │  Project CLOSED          │
                    └─────────────────────────┘
```

---

## 4. MODULES & FORMS

### Module 1: OPPORTUNITIES
**Purpose:** Track first contact to deal close

**Form Fields:**
- Company Name *
- Contact Person, Email, Phone
- Reference/Source (Referral, Website, LinkedIn, Event, Cold Call)
- Service Interest (VAPT, IS Audit, ISMS, RBI Audit, Compliance, Cloud, Network)
- Estimated Value (₹)
- Expected Close Date
- Assigned BD Executive
- Description/Notes

**Stages (10):**
Prospecting → Qualification → Needs Analysis → Value Proposition →
Identify Decision Makers → Perception Analysis → Proposal/Price Quote →
Negotiation/Review → Closed Won → Closed Lost

**Sub-features:**
- Conversation log (date-wise remarks by BD person)
- Tasks (follow-up calls, send proposal, etc.)
- Meetings (schedule with client)
- Reminders (for follow-ups)

**Actions:**
- Closed Won → "Convert to Lead" button
- Closed Lost → Must enter reason

---

### Module 2: LEADS
**Purpose:** After deal confirmed, collect verified info & close formalities

**Form Fields:**
- Company Name * (auto from opportunity)
- Contact Person *, Email *, Phone *
- Website
- Source (auto: from Opportunity)
- Service Type
- Description (what exactly client needs)
- Estimated Value
- Assigned To

**Stages (8):**
Prospecting → Lead Qualification → Demo/Meeting → Proposal →
Negotiation & Commitment → Purchase Order → Lead Closed → Lead Converted

**Sub-features:**
- Remarks (date-wise conversation log)
- Documents (upload proposal, PO, agreement, NDA)
- Tasks, Meetings, Reminders

**Actions:**
- "Purchase Order" stage → "Convert to Account" button
- "Lead Closed" → Deal cancelled, enter reason

---

### Module 3: ACCOUNTS (Client Master)
**Purpose:** Permanent client record — all data linked here

**Form Fields (auto-filled from Lead + editable):**
- Account ID (auto: ACC0001)
- Company Name *
- Contact Person, Email, Phone
- Website
- Address, City, State, Country, Pincode
- GST No, PAN No
- Industry (Finance, IT, Education, Govt, Energy, etc.)
- Account Type (B2B/B2C)
- Status (Active/Inactive)

**What shows inside an Account:**
- All Opportunities for this company
- All Leads for this company
- All Projects under this account
- All Documents across all projects
- All Notes (including client's)

**No separate form needed usually** — created automatically from Lead conversion.

---

### Module 4: PROJECTS
**Purpose:** Track delivery from start to finish

**Form Fields:**
- Title *
- Description
- Account * (select from accounts)
- Service Type
- Project Manager * (select from users)
- Team Members (multi-select)
- Total Value (₹)
- Start Date, Target Date
- Client Review Enabled (checkbox — if ON, client can see approved docs)

**Stages (21):**
Initiated → Onboarding → Planning → Information Gathering → Execution →
Internal Review → Client Review → Remediation Support → Final Delivery →
Invoice Raised → Payment Pending → Partial Payment → Full Payment → Closed →
On Hold → Delayed → Cancelled → Awaiting Client Response →
Awaiting Documents → Awaiting Payment → Escalated

**Sub-features:**
- **Project Remarks** (PM/Lead enters progress notes)
- **Team** (assigned members with role)
- **Documents** (with APPROVAL FLOW — see below)
- **Tasks** (assign to team members)
- **Meetings** (with client or internal)
- **Reminders** (for deadlines)
- **Notes** (client can write here if review enabled)

---

### Module 5: DOCUMENT APPROVAL FLOW (Inside Projects)

This is the **CORE feature** — how reports get reviewed before client sees them.

```
AUDITOR uploads report
    ↓
Document Status = "Submitted" 
    ↓
PROJECT LEAD / SUPER ADMIN gets notification
    ↓
Opens document → Reviews
    ↓
OPTION A: APPROVE
    → Status = "Approved"
    → If "Client Visible" checked → Shows on client portal
    ↓
OPTION B: REJECT with Remarks
    → Status = "Revision Required"
    → Remarks saved: "Page 5 findings incomplete, recheck server IPs"
    → Auditor gets notification
    ↓
AUDITOR fixes → Re-uploads (new version)
    → Status back to "Submitted"
    → Review cycle repeats
```

**Document fields:**
- File (upload)
- Category: Report, Certificate, Proposal, PO, Deliverable, Other
- Version (auto-increment on re-upload)
- Review Status: Submitted → Under Review → Revision Required → Approved
- Reviewer Remarks
- Reviewed By (auto)
- Client Visible (toggle — only after approval)

---

### Module 6: TASKS
**Purpose:** Assign work to team members (linked to any module)

**Form Fields:**
- Title *
- Description
- Linked To (Opportunity/Lead/Project)
- Assigned To * (select user)
- Priority (Low/Normal/High/Urgent)
- Due Date
- Status (Open/In Progress/Completed)

---

### Module 7: MEETINGS
**Purpose:** Schedule and track meetings

**Form Fields:**
- Title *
- Linked To (Opportunity/Lead/Project)
- Date & Time
- Location (Online/Office/Client Site)
- Status (Scheduled/Completed/Cancelled)
- MOM (Minutes of Meeting — filled after meeting)

---

### Module 8: REMINDERS
**Purpose:** Set reminders for self or others

**Form Fields:**
- Title *
- Linked To (Opportunity/Lead/Project — optional)
- Remind At (date + time)
- Remind To (self or select user)
- Done/Not Done toggle

---

### Module 9: NOTES
**Purpose:** Internal notes + Client communication

**Fields:**
- Content *
- Linked To (Project)
- Is Client Note (if client wrote it — marked differently)

**Rule:** Client can ONLY write notes on projects where "Client Review" is enabled.

---

## 5. PERMISSION MATRIX

| Action | Super Admin | Project Lead | Consultant | BD Executive | Employee | Client |
|--------|:-----------:|:------------:|:----------:|:------------:|:--------:|:------:|
| Create Opportunity | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create Lead | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create Account | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign Team | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload Document | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Document | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Make Client Visible | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Write Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (project only) |
| View Client Portal | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Respond to Query | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 6. CLIENT PORTAL (Separate Login)

Client gets a **limited view** of their account:
- See project status (current stage)
- See approved & visible documents (download)
- Write Notes (queries/feedback)
- See responses from PM/Admin

**Client CANNOT:**
- See internal remarks
- See other clients' data
- See pending/rejected documents
- Create tasks or meetings
- See team details or costs

---

## 7. NOTIFICATIONS (Future)

Trigger notifications for:
- Document submitted → PM gets alert
- Document approved → Auditor gets alert
- Document rejected → Auditor gets alert with remarks
- Task assigned → Assignee gets alert
- Reminder due → User gets alert
- Client writes note → PM gets alert
- Stage change → Relevant users get alert

---

## 8. TECH STACK

- **Backend:** Python Flask, SQLAlchemy, JWT Auth, SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide icons
- **No extra libraries** — lightweight, fast

---

## 9. DATABASE TABLES

1. `users` — All internal users
2. `roles` — Super Admin, Project Lead, Consultant, BD Executive, Employee
3. `user_roles` — Many-to-many
4. `departments` — IT, BD, Admin
5. `opportunities` — Sales pipeline
6. `opportunity_remarks` — Conversation log
7. `leads` — Qualified deals
8. `lead_remarks` — Conversation log
9. `lead_documents` — Attachments
10. `accounts` — Client master
11. `projects` — Delivery tracking
12. `project_remarks` — PM notes
13. `project_documents` — Reports (with approval flow)
14. `project_team` — Assigned members
15. `tasks` — Cross-module tasks
16. `meetings` — Cross-module meetings
17. `reminders` — Cross-module reminders
18. `notes` — Cross-module notes (client writable)
19. `client_users` — Client portal login (future)

---

## 10. UI DESIGN PRINCIPLES

- Dark sidebar, light content area
- Kanban board for Opportunities (drag & drop)
- Slide-in panels for detail views (don't navigate away)
- Multi-step wizard for creation forms
- Chat-style timeline for remarks/conversations
- Status badges with gradient colors
- Card-based layouts (not heavy tables)
- Pipeline stats at top of each module
- Document review queue for approvers
- Toast notifications for success/error

---

*This is the complete design. Implementation will follow this exactly.*
