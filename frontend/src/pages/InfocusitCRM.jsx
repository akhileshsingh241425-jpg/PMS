import { useState } from "react";

// ── COLORS ──────────────────────────────────────────────
const B = "#1a237e"; // dark navy header
const BL = "#283593";
const NAV_BG = "#1565c0";
const NAV_ACTIVE = "#0d47a1";
const FIELD_BG = "#fffde7"; // light yellow like Excel input cells
const SECTION_HDR = "#1a237e";
const TABLE_HDR = "#1565c0";
const BORDER = "#90caf9";
const WHITE = "#ffffff";
const LIGHT = "#e3f2fd";
const TEXT = "#0d1b4b";
const MUTED = "#546e7a";
const RED = "#c62828";
const GREEN = "#2e7d32";

// ── HELPERS ─────────────────────────────────────────────
const now = () => new Date().toLocaleDateString("en-IN");
const uid = () => Math.floor(Math.random() * 900000 + 100000);

const Row = ({ children, gap = 16, style = {} }) => (
  <div style={{ display: "flex", gap, flexWrap: "wrap", alignItems: "flex-start", ...style }}>{children}</div>
);

const FieldBox = ({ label, value, onChange, type = "text", span = 1, options, readOnly, rows, placeholder }) => {
  const w = span === "full" ? "100%" : span === 2 ? "calc(50% - 8px)" : span === 3 ? "calc(33.33% - 11px)" : "calc(25% - 12px)";
  return (
    <div style={{ width: w, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 2, letterSpacing: 0.3 }}>{label}</div>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={readOnly}
          style={{ width: "100%", padding: "5px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, background: readOnly ? "#f5f5f5" : FIELD_BG, fontSize: 13, color: TEXT, outline: "none" }}>
          <option value="">-- Select --</option>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} readOnly={readOnly} placeholder={placeholder}
          style={{ width: "100%", padding: "5px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, background: readOnly ? "#f5f5f5" : FIELD_BG, fontSize: 13, color: TEXT, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange ? onChange(e.target.value) : null} readOnly={readOnly} placeholder={placeholder}
          style={{ width: "100%", padding: "5px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, background: readOnly ? "#f5f5f5" : FIELD_BG, fontSize: 13, color: TEXT, outline: "none", boxSizing: "border-box" }} />
      )}
    </div>
  );
};

const SectionBar = ({ title }) => (
  <div style={{ background: SECTION_HDR, color: WHITE, fontWeight: 700, fontSize: 13, padding: "6px 12px", marginTop: 16, marginBottom: 8, letterSpacing: 0.5, borderRadius: 2 }}>{title}</div>
);

const GrayLine = () => <div style={{ borderTop: `1px solid ${BORDER}`, margin: "10px 0" }} />;

const Btn = ({ children, onClick, color = B, small }) => (
  <button onClick={onClick} style={{ background: color, color: WHITE, border: "none", borderRadius: 4, padding: small ? "4px 10px" : "7px 18px", fontSize: small ? 11 : 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3 }}>{children}</button>
);

const Badge = ({ label }) => {
  const col = { Active: GREEN, Closed: RED, "In Progress": "#1565c0", Pending: "#e65100", Won: GREEN, Lost: RED, New: "#6a1b9a", Open: "#1565c0" }[label] || MUTED;
  return <span style={{ background: col + "18", color: col, border: `1px solid ${col}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>{label}</span>;
};

// ── TABLE COMPONENT ──────────────────────────────────────
const DataTable = ({ cols, rows, onRow }) => (
  <div style={{ overflowX: "auto", marginTop: 8 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>{cols.map(c => <th key={c} style={{ background: TABLE_HDR, color: WHITE, padding: "7px 10px", textAlign: "left", fontWeight: 700, whiteSpace: "nowrap", border: `1px solid ${BL}` }}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 20, color: MUTED, border: `1px solid ${BORDER}` }}>No records found</td></tr>}
        {rows.map((r, i) => (
          <tr key={i} onClick={() => onRow && onRow(r)} style={{ background: i % 2 === 0 ? WHITE : LIGHT, cursor: onRow ? "pointer" : "default" }}>
            {Object.values(r).map((v, j) => (
              <td key={j} style={{ padding: "6px 10px", border: `1px solid ${BORDER}`, whiteSpace: "nowrap" }}>
                {typeof v === "string" && ["Active", "Closed", "In Progress", "Pending", "Won", "Lost", "New", "Open"].includes(v) ? <Badge label={v} /> : String(v ?? "")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── REMARK ROWS ──────────────────────────────────────────
const RemarkRows = ({ remarks, setRemarks, label = "BS" }) => {
  const dates = ["20-06-26", "21-06-26", "22-06-26", "23-06-26"];
  return (
    <div>
      {dates.map(d => (
        <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, minWidth: 90, paddingTop: 6 }}>{label} {d}</div>
          <textarea value={remarks[d] || ""} onChange={e => setRemarks(r => ({ ...r, [d]: e.target.value }))} rows={2}
            style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, background: FIELD_BG, fontSize: 12, fontFamily: "inherit", resize: "vertical" }} />
        </div>
      ))}
    </div>
  );
};

// ── ACTIVITIES SECTION ───────────────────────────────────
const ActivitiesSection = ({ meetings, setMeetings, reminders, setReminders, documents, setDocuments, notes, setNotes, tasks, setTasks, showMOM }) => {
  const [newMtg, setNewMtg] = useState("");
  const [newRem, setNewRem] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [mom, setMom] = useState("");

  const hasTasks = tasks !== undefined;

  return (
    <div>
      {showMOM && (
        <>
          <SectionBar title="MOM (Minutes of Meeting)" />
          <textarea value={mom} onChange={e => setMom(e.target.value)} rows={3}
            style={{ width: "100%", padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 4, background: FIELD_BG, fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        </>
      )}
      <SectionBar title={hasTasks ? "Activities" : "All Activities"} />
      {hasTasks ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>Meetings</div>
              <div style={{ padding: 10 }}>
                {meetings.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>• {m}</div>)}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newMtg} onChange={e => setNewMtg(e.target.value)} placeholder="Add meeting…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                  <Btn small onClick={() => { if (newMtg) { setMeetings(m => [...m, newMtg]); setNewMtg(""); } }}>+</Btn>
                </div>
              </div>
            </div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>TASKS</div>
              <div style={{ padding: 10 }}>
                {tasks.map((t, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>✅ {t}</div>)}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add task…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                  <Btn small onClick={() => { if (newTask) { setTasks(t => [...t, newTask]); setNewTask(""); } }}>+</Btn>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>REMINDERS</div>
              <div style={{ padding: 10 }}>
                {reminders.map((r, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>🔔 {r}</div>)}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newRem} onChange={e => setNewRem(e.target.value)} placeholder="Add reminder…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                  <Btn small onClick={() => { if (newRem) { setReminders(r => [...r, newRem]); setNewRem(""); } }}>+</Btn>
                </div>
              </div>
            </div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>NOTES</div>
              <div style={{ padding: 10 }}>
                {notes.map((n, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>📝 {n}</div>)}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add note…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                  <Btn small onClick={() => { if (newNote) { setNotes(n => [...n, newNote]); setNewNote(""); } }}>+</Btn>
                </div>
              </div>
            </div>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>DOCUMENTS</div>
            <div style={{ padding: 10 }}>
              {documents.map((d, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>📄 {d}</div>)}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newDoc} onChange={e => setNewDoc(e.target.value)} placeholder="Document name…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                <Btn small onClick={() => { if (newDoc) { setDocuments(d => [...d, newDoc]); setNewDoc(""); } }}>+</Btn>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>Meetings</div>
            <div style={{ padding: 10 }}>
              {meetings.map((m, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>• {m}</div>)}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newMtg} onChange={e => setNewMtg(e.target.value)} placeholder="Add meeting…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                <Btn small onClick={() => { if (newMtg) { setMeetings(m => [...m, newMtg]); setNewMtg(""); } }}>+</Btn>
              </div>
            </div>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>Reminder</div>
            <div style={{ padding: 10 }}>
              {reminders.map((r, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>🔔 {r}</div>)}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newRem} onChange={e => setNewRem(e.target.value)} placeholder="Add reminder…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                <Btn small onClick={() => { if (newRem) { setReminders(r => [...r, newRem]); setNewRem(""); } }}>+</Btn>
              </div>
            </div>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>Documents</div>
            <div style={{ padding: 10 }}>
              {documents.map((d, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>📄 {d}</div>)}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newDoc} onChange={e => setNewDoc(e.target.value)} placeholder="Document name…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                <Btn small onClick={() => { if (newDoc) { setDocuments(d => [...d, newDoc]); setNewDoc(""); } }}>+</Btn>
              </div>
            </div>
          </div>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ background: BL, color: WHITE, fontWeight: 700, fontSize: 12, padding: "5px 10px" }}>Notes {showMOM ? "(for client input)" : ""}</div>
            <div style={{ padding: 10 }}>
              {notes.map((n, i) => <div key={i} style={{ fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${BORDER}` }}>📝 {n}</div>)}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add note…" style={{ flex: 1, padding: "4px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 12, background: FIELD_BG }} />
                <Btn small onClick={() => { if (newNote) { setNotes(n => [...n, newNote]); setNewNote(""); } }}>+</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════
// MODULE: DASHBOARD
// ════════════════════════════════════════════
function Dashboard({ setTab, counts }) {
  const tiles = [
    { label: "Clients", icon: "🏢", key: "accounts", tab: "accounts" },
    { label: "Leads", icon: "📋", key: "leads", tab: "leads" },
    { label: "Projects", icon: "📁", key: "projects", tab: "projects" },
    { label: "Opportunities", icon: "💡", key: "opps", tab: "opportunities" },
    { label: "Tasks", icon: "✅", key: "tasks", tab: "tasks" },
    { label: "Meetings", icon: "📅", key: "meetings", tab: "meetings" },
    { label: "Reminders", icon: "🔔", key: "reminders", tab: "reminders" },
    { label: "Purchase Order", icon: "🛒", key: "po", tab: "po" },
    { label: "Invoices", icon: "🧾", key: "invoices", tab: "invoices" },
    { label: "Billings", icon: "💰", key: "billings", tab: "billings" },
    { label: "Reports", icon: "📊", key: "reports", tab: "reports" },
    { label: "Attendance", icon: "🕐", key: "attendance", tab: "attendance" },
    { label: "Clients", icon: "👥", key: "clients", tab: "accounts" },
    { label: "Employees", icon: "👤", key: "employees", tab: "employees" },
    { label: "Certificates", icon: "🏆", key: "certs", tab: "certs" },
    { label: "Expenses", icon: "💸", key: "expenses", tab: "expenses" },
  ];
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${B},${NAV_BG})`, borderRadius: 10, padding: "22px 28px", marginBottom: 24, color: WHITE }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Welcome, Infocusit</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>CRM Dashboard — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[{ l: "Total Leads", v: counts.leads, c: "#1565c0" }, { l: "Active Projects", v: counts.projects, c: "#2e7d32" }, { l: "Opportunities", v: counts.opps, c: "#6a1b9a" }, { l: "Tasks Open", v: counts.tasks, c: "#e65100" }].map(s => (
          <div key={s.l} style={{ background: WHITE, border: `2px solid ${s.c}22`, borderRadius: 10, padding: "16px 20px", borderLeft: `4px solid ${s.c}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 0.5 }}>{s.l}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Module tiles */}
      <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12 }}>Quick Navigation</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {tiles.map(t => (
          <div key={t.label} onClick={() => setTab(t.tab)} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "18px 16px", cursor: "pointer", textAlign: "center", transition: "all .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = LIGHT}
            onMouseLeave={e => e.currentTarget.style.background = WHITE}>
            <div style={{ fontSize: 26 }}>{t.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginTop: 6 }}>{t.label}</div>
            {counts[t.key] !== undefined && <div style={{ fontSize: 18, fontWeight: 900, color: B, marginTop: 2 }}>{counts[t.key]}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// MODULE: ACCOUNTS
// ════════════════════════════════════════════
const BLANK_ACCOUNT = () => ({
  clientId: "CLI-" + uid(), company: "", nature: "", gst: "",
  clientName: "", phone: "", email: "", website: "",
  address: "", state: "", country: "", status: "Active",
  updatedOn: now(), createdOn: now(),
  remarks: {}, meetings: [], reminders: [], documents: [], notes: [], tasks: [],
});

function Accounts({ accounts, setAccounts }) {
  const [view, setView] = useState("list"); // list | form
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_ACCOUNT());
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(BLANK_ACCOUNT()); setEditing(null); setView("form"); };
  const openEdit = (a) => { setForm({ ...a }); setEditing(a.clientId); setView("form"); };
  const save = () => {
    if (!form.company) return alert("Company name required");
    setAccounts(p => editing ? p.map(a => a.clientId === editing ? form : a) : [...p, form]);
    setView("list");
  };

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Clients</div>
        <Btn onClick={openNew}>+ New Client</Btn>
      </div>
      <DataTable
        cols={["Client ID", "Company Name", "Client Name", "Phone", "Email", "Nature", "Status", "Created On"]}
        rows={accounts.map(a => ({ "Client ID": a.clientId, "Company Name": a.company, "Client Name": a.clientName, "Phone": a.phone, "Email": a.email, "Nature": a.nature, "Status": a.status, "Created On": a.createdOn }))}
        onRow={r => openEdit(accounts.find(a => a.clientId === r["Client ID"]))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{editing ? "Edit Client" : "New Client"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={save} color={GREEN}>💾 Save</Btn>
          <Btn onClick={() => setView("list")} color={MUTED}>← Back</Btn>
        </div>
      </div>

      {/* Client Details */}
      <SectionBar title="Client Details" />
      <Row>
        <FieldBox label="Client ID" value={form.clientId} readOnly />
        <FieldBox label="Company Name" value={form.company} onChange={v => F("company", v)} />
        <FieldBox label="Nature of Business" value={form.nature} onChange={v => F("nature", v)} />
        <FieldBox label="GST No." value={form.gst} onChange={v => F("gst", v)} />
      </Row>
      <Row>
        <FieldBox label="Client Name" value={form.clientName} onChange={v => F("clientName", v)} span="full" />
      </Row>
      <Row>
        <FieldBox label="Phone" value={form.phone} onChange={v => F("phone", v)} span="full" />
      </Row>
      <Row>
        <FieldBox label="Email" value={form.email} onChange={v => F("email", v)} span={2} />
        <FieldBox label="Website" value={form.website} onChange={v => F("website", v)} span={2} />
      </Row>
      <Row>
        <FieldBox label="Address" value={form.address} onChange={v => F("address", v)} span={3} />
        <FieldBox label="State" value={form.state} onChange={v => F("state", v)} span={3} />
        <FieldBox label="Country" value={form.country} onChange={v => F("country", v)} span={3} />
      </Row>
      <Row>
        <FieldBox label="Status" value={form.status} onChange={v => F("status", v)} options={["Active", "Inactive", "Closed"]} span={3} />
        <FieldBox label="Updated" value={form.updatedOn} readOnly span={3} />
        <FieldBox label="Created" value={form.createdOn} readOnly span={3} />
      </Row>

      {/* Projects Table */}
      <SectionBar title="PROJECTS" />
      <DataTable
        cols={["PROJECT NO", "PROJECT NAME", "STAGE", "ASSIGN TO", "PROJECT MANAGER", "STATUS", "Created By", "Closed By", "DATE CREATED", "DATE CLOSED", "DATE UPDATED"]}
        rows={[
          { no: "20260311", name: "VAPT", stage: "", assign: "", pm: "", status: "", cb: "", clb: "", dc: "", dcl: "", du: "" },
          { no: "20260312", name: "RCA", stage: "", assign: "", pm: "", status: "", cb: "", clb: "", dc: "", dcl: "", du: "" },
          { no: "20260313", name: "IT Audit", stage: "", assign: "", pm: "", status: "", cb: "", clb: "", dc: "", dcl: "", du: "" },
          { no: "20260314", name: "Compliance", stage: "", assign: "", pm: "", status: "", cb: "", clb: "", dc: "", dcl: "", du: "" },
          { no: "20260315", name: "Application Audit", stage: "", assign: "", pm: "", status: "", cb: "", clb: "", dc: "", dcl: "", du: "" },
        ]}
      />

      {/* Leads Table */}
      <SectionBar title="LEADS" />
      <DataTable
        cols={["LEAD NAME", "PHONE", "EMAIL", "LEAD SOURCE", "ASSIGN TO", "STATUS", "Created By", "Closed By", "DATE CREATED", "DATE CLOSED", "DATE UPDATED"]}
        rows={[]}
      />

      {/* Opportunities */}
      <SectionBar title="OPPORTUNITIES" />
      <DataTable
        cols={["Name", "PHONE", "EMAIL", "LEAD SOURCE", "ASSIGN TO", "STATUS", "Created By", "Closed By", "DATE CREATED", "DATE CLOSED", "DATE UPDATED"]}
        rows={[]}
      />

      {/* Activities */}
      <ActivitiesSection
        meetings={form.meetings} setMeetings={v => F("meetings", typeof v === "function" ? v(form.meetings) : v)}
        reminders={form.reminders} setReminders={v => F("reminders", typeof v === "function" ? v(form.reminders) : v)}
        documents={form.documents} setDocuments={v => F("documents", typeof v === "function" ? v(form.documents) : v)}
        notes={form.notes} setNotes={v => F("notes", typeof v === "function" ? v(form.notes) : v)}
        tasks={form.tasks} setTasks={v => F("tasks", typeof v === "function" ? v(form.tasks) : v)}
      />
    </div>
  );
}

// ════════════════════════════════════════════
// MODULE: LEADS
// ════════════════════════════════════════════
const BLANK_LEAD = () => ({
  id: "LEAD-" + uid(), name: "", phone: "", email: "", website: "",
  company: "", address: "", state: "", pincode: "",
  source: "", type: "", status: "New", assignedTo: "",
  createdBy: "", createdOn: now(), closedOn: "", lastUpdated: now(),
  subject: "", description: "", remarks: {},
  proposal: "", meetings: [], reminders: [], documents: [], notes: [],
});

function Leads({ leads, setLeads }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_LEAD());
  const [search, setSearch] = useState("");
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(BLANK_LEAD()); setEditing(null); setView("form"); };
  const openEdit = (l) => { setForm({ ...l }); setEditing(l.id); setView("form"); };
  const save = () => {
    if (!form.name) return alert("Name required");
    setLeads(p => editing ? p.map(l => l.id === editing ? form : l) : [...p, form]);
    setView("list");
  };
  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase()));

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Leads</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 13 }} />
          <Btn onClick={openNew}>+ New Lead</Btn>
        </div>
      </div>
      <DataTable
        cols={["Lead ID", "Name", "Company", "Phone", "Email", "Source", "Type", "Status", "Assigned To", "Created On"]}
        rows={filtered.map(l => ({ "Lead ID": l.id, Name: l.name, Company: l.company, Phone: l.phone, Email: l.email, Source: l.source, Type: l.type, Status: l.status, "Assigned To": l.assignedTo, "Created On": l.createdOn }))}
        onRow={r => openEdit(leads.find(l => l.id === r["Lead ID"]))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>LEADS — {editing ? "Edit" : "New"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={save} color={GREEN}>💾 Save</Btn>
          <Btn onClick={() => setView("list")} color={MUTED}>← Back</Btn>
        </div>
      </div>

      <Row>
        <FieldBox label="Name" value={form.name} onChange={v => F("name", v)} />
        <FieldBox label="Phone" value={form.phone} onChange={v => F("phone", v)} />
        <FieldBox label="Email" value={form.email} onChange={v => F("email", v)} />
        <FieldBox label="Website" value={form.website} onChange={v => F("website", v)} />
      </Row>
      <Row>
        <FieldBox label="Company" value={form.company} onChange={v => F("company", v)} />
        <FieldBox label="Address" value={form.address} onChange={v => F("address", v)} />
        <FieldBox label="State" value={form.state} onChange={v => F("state", v)} />
        <FieldBox label="Pincode" value={form.pincode} onChange={v => F("pincode", v)} />
      </Row>
      <Row>
        <FieldBox label="Lead Source" value={form.source} onChange={v => F("source", v)} options={["Website", "Referral", "LinkedIn", "Email", "Cold Call", "Event", "Other"]} />
        <FieldBox label="Lead Type" value={form.type} onChange={v => F("type", v)} options={["Hot", "Warm", "Cold", "B2B", "B2C"]} />
        <FieldBox label="Lead Status" value={form.status} onChange={v => F("status", v)} options={["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "Closed"]} />
        <FieldBox label="Assigned To" value={form.assignedTo} onChange={v => F("assignedTo", v)} options={["Baljeet Singh", "Arjun Mehra", "Priya Nair", "Rohit Das"]} />
      </Row>
      <Row>
        <FieldBox label="Lead Created By" value={form.createdBy} onChange={v => F("createdBy", v)} />
        <FieldBox label="Lead Created On" value={form.createdOn} readOnly />
        <FieldBox label="Lead Closed On" value={form.closedOn} onChange={v => F("closedOn", v)} type="date" />
        <FieldBox label="Last Updated" value={form.lastUpdated} readOnly />
      </Row>

      <SectionBar title="Lead Subject" />
      <FieldBox label="" value={form.subject} onChange={v => F("subject", v)} span="full" placeholder="Enter lead subject…" />

      <SectionBar title="Lead Description" />
      <FieldBox label="" value={form.description} onChange={v => F("description", v)} span="full" rows={4} placeholder="Detailed description…" />

      <SectionBar title="Lead Remarks" />
      <RemarkRows remarks={form.remarks} setRemarks={v => F("remarks", typeof v === "function" ? v(form.remarks) : v)} />

      <SectionBar title="Proposal" />
      <FieldBox label="" value={form.proposal} onChange={v => F("proposal", v)} span="full" rows={3} placeholder="Proposal details…" />

      <ActivitiesSection
        meetings={form.meetings} setMeetings={v => F("meetings", typeof v === "function" ? v(form.meetings) : v)}
        reminders={form.reminders} setReminders={v => F("reminders", typeof v === "function" ? v(form.reminders) : v)}
        documents={form.documents} setDocuments={v => F("documents", typeof v === "function" ? v(form.documents) : v)}
        notes={form.notes} setNotes={v => F("notes", typeof v === "function" ? v(form.notes) : v)}
      />
    </div>
  );
}

// ════════════════════════════════════════════
// MODULE: OPPORTUNITIES
// ════════════════════════════════════════════
const BLANK_OPP = () => ({
  id: "OPP-" + uid(), name: "", phone: "", email: "", website: "",
  company: "", address: "", state: "", pincode: "",
  source: "", businessType: "", probability: "50%", assignedTo: "",
  createdBy: "", createdOn: now(), closedOn: "", lastUpdated: now(),
  title: "", description: "", meetings: [], reminders: [], documents: [], notes: [],
});

function Opportunities({ opps, setOpps }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_OPP());
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(BLANK_OPP()); setEditing(null); setView("form"); };
  const openEdit = (o) => { setForm({ ...o }); setEditing(o.id); setView("form"); };
  const save = () => {
    if (!form.name) return alert("Name required");
    setOpps(p => editing ? p.map(o => o.id === editing ? form : o) : [...p, form]);
    setView("list");
  };

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Opportunities</div>
        <Btn onClick={openNew}>+ New Opportunity</Btn>
      </div>
      <DataTable
        cols={["ID", "Name", "Company", "Phone", "Business Type", "Probability", "Assigned To", "Status", "Created On"]}
        rows={opps.map(o => ({ ID: o.id, Name: o.name, Company: o.company, Phone: o.phone, "Business Type": o.businessType, Probability: o.probability, "Assigned To": o.assignedTo, Status: "Open", "Created On": o.createdOn }))}
        onRow={r => openEdit(opps.find(o => o.id === r["ID"]))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>OPPORTUNITY — {editing ? "Edit" : "New"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={save} color={GREEN}>💾 Save</Btn>
          <Btn onClick={() => setView("list")} color={MUTED}>← Back</Btn>
        </div>
      </div>

      <Row>
        <FieldBox label="Name" value={form.name} onChange={v => F("name", v)} />
        <FieldBox label="Phone" value={form.phone} onChange={v => F("phone", v)} />
        <FieldBox label="Email" value={form.email} onChange={v => F("email", v)} />
        <FieldBox label="Website" value={form.website} onChange={v => F("website", v)} />
      </Row>
      <Row>
        <FieldBox label="Company" value={form.company} onChange={v => F("company", v)} />
        <FieldBox label="Address" value={form.address} onChange={v => F("address", v)} />
        <FieldBox label="State" value={form.state} onChange={v => F("state", v)} />
        <FieldBox label="Pincode" value={form.pincode} onChange={v => F("pincode", v)} />
      </Row>
      <Row>
        <FieldBox label="Source" value={form.source} onChange={v => F("source", v)} options={["Website", "Referral", "LinkedIn", "Email", "Cold Call", "Event"]} />
        <FieldBox label="Business Type" value={form.businessType} onChange={v => F("businessType", v)} options={["IT Security", "Compliance", "VAPT", "Audit", "Consulting"]} />
        <FieldBox label="Probability" value={form.probability} onChange={v => F("probability", v)} options={["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"]} />
        <FieldBox label="Assigned To" value={form.assignedTo} onChange={v => F("assignedTo", v)} options={["Baljeet Singh", "Arjun Mehra", "Priya Nair", "Rohit Das"]} />
      </Row>
      <Row>
        <FieldBox label="Created By" value={form.createdBy} onChange={v => F("createdBy", v)} />
        <FieldBox label="Created On" value={form.createdOn} readOnly />
        <FieldBox label="Closed On" value={form.closedOn} onChange={v => F("closedOn", v)} type="date" />
        <FieldBox label="Last Updated" value={form.lastUpdated} readOnly />
      </Row>

      <SectionBar title="Title" />
      <FieldBox label="" value={form.title} onChange={v => F("title", v)} span="full" placeholder="Opportunity title…" />

      <SectionBar title="Description" />
      <FieldBox label="" value={form.description} onChange={v => F("description", v)} span="full" rows={4} placeholder="Opportunity description…" />

      <ActivitiesSection
        meetings={form.meetings} setMeetings={v => F("meetings", typeof v === "function" ? v(form.meetings) : v)}
        reminders={form.reminders} setReminders={v => F("reminders", typeof v === "function" ? v(form.reminders) : v)}
        documents={form.documents} setDocuments={v => F("documents", typeof v === "function" ? v(form.documents) : v)}
        notes={form.notes} setNotes={v => F("notes", typeof v === "function" ? v(form.notes) : v)}
      />
    </div>
  );
}

// ════════════════════════════════════════════
// MODULE: PROJECTS
// ════════════════════════════════════════════
const BLANK_PROJECT = () => ({
  id: "PRJ-" + uid(), name: "", phone: "", email: "", website: "",
  company: "", address: "", state: "", pincode: "",
  source: "", type: "", status: "In Progress", assignedTo: "", pm: "",
  createdBy: "", createdOn: now(), closedOn: "", lastUpdated: now(),
  subject: "", description: "", remarks: {},
  meetings: [], reminders: [], documents: [], notes: [],
});

function Projects({ projects, setProjects }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_PROJECT());
  const [search, setSearch] = useState("");
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(BLANK_PROJECT()); setEditing(null); setView("form"); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p.id); setView("form"); };
  const save = () => {
    if (!form.name) return alert("Name required");
    setProjects(p => editing ? p.map(pr => pr.id === editing ? form : pr) : [...p, form]);
    setView("list");
  };
  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.company.toLowerCase().includes(search.toLowerCase()));

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Projects</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 13 }} />
          <Btn onClick={openNew}>+ New Project</Btn>
        </div>
      </div>
      <DataTable
        cols={["Project ID", "Name", "Company", "Type", "Status", "Assigned To", "Project Manager", "Created On", "Closed On"]}
        rows={filtered.map(p => ({ "Project ID": p.id, Name: p.name, Company: p.company, Type: p.type, Status: p.status, "Assigned To": p.assignedTo, "Project Manager": p.pm, "Created On": p.createdOn, "Closed On": p.closedOn }))}
        onRow={r => openEdit(projects.find(p => p.id === r["Project ID"]))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>PROJECT — {editing ? "Edit" : "New"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={save} color={GREEN}>💾 Save</Btn>
          <Btn onClick={() => setView("list")} color={MUTED}>← Back</Btn>
        </div>
      </div>

      <Row>
        <FieldBox label="Name" value={form.name} onChange={v => F("name", v)} />
        <FieldBox label="Phone" value={form.phone} onChange={v => F("phone", v)} />
        <FieldBox label="Email" value={form.email} onChange={v => F("email", v)} />
        <FieldBox label="Website" value={form.website} onChange={v => F("website", v)} />
      </Row>
      <Row>
        <FieldBox label="Company" value={form.company} onChange={v => F("company", v)} />
        <FieldBox label="Address" value={form.address} onChange={v => F("address", v)} />
        <FieldBox label="State" value={form.state} onChange={v => F("state", v)} />
        <FieldBox label="Pincode" value={form.pincode} onChange={v => F("pincode", v)} />
      </Row>
      <Row>
        <FieldBox label="Lead Source" value={form.source} onChange={v => F("source", v)} options={["Website", "Referral", "LinkedIn", "Email", "Cold Call", "Direct"]} />
        <FieldBox label="Lead Type" value={form.type} onChange={v => F("type", v)} options={["VAPT", "RCA", "IT Audit", "Compliance", "Application Audit", "Pentest"]} />
        <FieldBox label="Lead Status" value={form.status} onChange={v => F("status", v)} options={["In Progress", "Pending", "Completed", "On Hold", "Cancelled"]} />
        <FieldBox label="Assigned To" value={form.assignedTo} onChange={v => F("assignedTo", v)} options={["Baljeet Singh", "Arjun Mehra", "Priya Nair", "Rohit Das"]} />
      </Row>
      <Row style={{ marginTop: 0 }}>
        <div style={{ width: "calc(75% - 12px)" }} />
        <FieldBox label="Project Manager" value={form.pm} onChange={v => F("pm", v)} options={["Baljeet Singh", "Arjun Mehra", "Priya Nair"]} />
      </Row>
      <Row>
        <FieldBox label="Lead Created By" value={form.createdBy} onChange={v => F("createdBy", v)} />
        <FieldBox label="Lead Created On" value={form.createdOn} readOnly />
        <FieldBox label="Lead Closed On" value={form.closedOn} onChange={v => F("closedOn", v)} type="date" />
        <FieldBox label="Last Updated" value={form.lastUpdated} readOnly />
      </Row>

      <SectionBar title="Subject" />
      <FieldBox label="" value={form.subject} onChange={v => F("subject", v)} span="full" placeholder="Project subject…" />

      <SectionBar title="Description" />
      <FieldBox label="" value={form.description} onChange={v => F("description", v)} span="full" rows={4} placeholder="Project description…" />

      <SectionBar title="Lead Remarks" />
      <RemarkRows remarks={form.remarks} setRemarks={v => F("remarks", typeof v === "function" ? v(form.remarks) : v)} />

      <ActivitiesSection
        meetings={form.meetings} setMeetings={v => F("meetings", typeof v === "function" ? v(form.meetings) : v)}
        reminders={form.reminders} setReminders={v => F("reminders", typeof v === "function" ? v(form.reminders) : v)}
        documents={form.documents} setDocuments={v => F("documents", typeof v === "function" ? v(form.documents) : v)}
        notes={form.notes} setNotes={v => F("notes", typeof v === "function" ? v(form.notes) : v)}
        showMOM
      />
    </div>
  );
}

// ════════════════════════════════════════════
// MODULE: TASKS
// ════════════════════════════════════════════
const BLANK_TASK = () => ({
  id: "TSK-" + uid(), task: "", activityDate: "", activityTime: "8:00AM",
  reminder: "30 Minutes Before", repeat: false,
  taskType: "To do", priority: "None", queue: "None",
  assignedTo: "Baljeet Singh", notes: "", status: "Open",
  createdOn: now(),
});

function Tasks({ tasks, setTasks }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_TASK());
  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(BLANK_TASK()); setEditing(null); setView("form"); };
  const openEdit = (t) => { setForm({ ...t }); setEditing(t.id); setView("form"); };
  const save = () => {
    if (!form.task) return alert("Task required");
    setTasks(p => editing ? p.map(t => t.id === editing ? form : t) : [...p, form]);
    setView("list");
  };

  if (view === "list") return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Tasks</div>
        <Btn onClick={openNew}>+ New Task</Btn>
      </div>
      <DataTable
        cols={["Task ID", "Task", "Type", "Priority", "Assigned To", "Activity Date", "Status", "Created On"]}
        rows={tasks.map(t => ({ "Task ID": t.id, Task: t.task, Type: t.taskType, Priority: t.priority, "Assigned To": t.assignedTo, "Activity Date": t.activityDate, Status: t.status, "Created On": t.createdOn }))}
        onRow={r => openEdit(tasks.find(t => t.id === r["Task ID"]))}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>TASKS — {editing ? "Edit" : "New"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={save} color={GREEN}>💾 Save</Btn>
          <Btn onClick={() => setView("list")} color={MUTED}>← Back</Btn>
        </div>
      </div>

      <SectionBar title="TASKS" />
      <FieldBox label="Enter your Task" value={form.task} onChange={v => F("task", v)} span="full" placeholder="Type your task here…" />

      <div style={{ marginTop: 14 }}>
        <Row>
          <FieldBox label="Activity Date" value={form.activityDate} onChange={v => F("activityDate", v)} type="date" span={3} />
          <FieldBox label="at" value={form.activityTime} onChange={v => F("activityTime", v)} options={["6:00AM","7:00AM","8:00AM","9:00AM","10:00AM","11:00AM","12:00PM","1:00PM","2:00PM","3:00PM","4:00PM","5:00PM","6:00PM","7:00PM","8:00PM"]} span={3} />
          <FieldBox label="Send Reminder" value={form.reminder} onChange={v => F("reminder", v)} options={["5 Minutes Before","10 Minutes Before","15 Minutes Before","30 Minutes Before","1 Hour Before","1 Day Before"]} span={3} />
        </Row>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={form.repeat} onChange={e => F("repeat", e.target.checked)} id="repeat" style={{ width: 15, height: 15 }} />
          <label htmlFor="repeat" style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>Set to repeat</label>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "Task type", key: "taskType", options: ["To do", "Call", "Email", "Meeting", "Follow up"] },
            { label: "Priority", key: "priority", options: ["None", "Low", "Medium", "High", "Critical"] },
            { label: "Queue", key: "queue", options: ["None", "Sales", "Support", "Technical", "Admin"] },
            { label: "Activity assigned to", key: "assignedTo", options: ["Baljeet Singh", "Arjun Mehra", "Priya Nair", "Rohit Das"] },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{f.label}</div>
              <select value={form[f.key]} onChange={e => F(f.key, e.target.value)} style={{ width: "100%", padding: "5px 8px", border: `1px solid ${BORDER}`, borderRadius: 4, background: FIELD_BG, fontSize: 13 }}>
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
              <div style={{ fontSize: 12, color: "#1565c0", fontWeight: 700, marginTop: 3 }}>{form[f.key]}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionBar title="Notes" />
      <FieldBox label="" value={form.notes} onChange={v => F("notes", v)} span="full" rows={4} placeholder="Task notes…" />
    </div>
  );
}

// ════════════════════════════════════════════
// PLACEHOLDER MODULE
// ════════════════════════════════════════════
function ComingSoon({ name }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginTop: 12 }}>{name}</div>
      <div style={{ fontSize: 14, marginTop: 6 }}>Module coming soon</div>
    </div>
  );
}

// ════════════════════════════════════════════
// NAV TABS
// ════════════════════════════════════════════
const NAV_ITEMS = [
  "Dashboard","Clients","Leads","Projects","Opportunities","Tasks","Meetings","Reminders","Purchase Order","Invoices","Billings","Reports","Attendance","Employees","Certificates","Expenses"
];

// ════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════
export default function InfocusitCRM() {
  const [tab, setTab] = useState("Dashboard");
  const [accounts, setAccounts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [opps, setOpps] = useState([]);
  const [tasks, setTasks] = useState([]);

  const counts = { accounts: accounts.length, leads: leads.length, projects: projects.length, opps: opps.length, tasks: tasks.length };

  return (
    <div style={{ minHeight: "100vh", background: "#eaf0fb", fontFamily: "Arial, sans-serif" }}>
      {/* TOP BAR */}
      <div style={{ background: B, color: WHITE, padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 48, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20 }}>🛡️</div>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.3 }}>Infocusit CRM</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12, alignItems: "center" }}>
          <span>📅 {new Date().toLocaleDateString("en-IN")}</span>
          <span>⏰ {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          <span style={{ background: "#1565c0", padding: "3px 10px", borderRadius: 4 }}>🔑 Login ID</span>
          <span style={{ background: RED, padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}>Logout</span>
        </div>
      </div>

      {/* NAV BAR */}
      <div style={{ background: NAV_BG, display: "flex", overflowX: "auto", padding: "0 8px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)", position: "sticky", top: 48, zIndex: 99 }}>
        {NAV_ITEMS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? NAV_ACTIVE : "transparent", color: WHITE, border: "none", padding: "10px 14px", fontSize: 12, fontWeight: tab === t ? 800 : 500, cursor: "pointer", whiteSpace: "nowrap", borderBottom: tab === t ? "3px solid #ffeb3b" : "3px solid transparent", transition: "all .15s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ background: WHITE, borderRadius: 10, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", minHeight: "calc(100vh - 160px)" }}>
          {tab === "Dashboard" && <Dashboard setTab={setTab} counts={counts} />}
          {tab === "Clients" && <Accounts accounts={accounts} setAccounts={setAccounts} />}
          {tab === "Leads" && <Leads leads={leads} setLeads={setLeads} />}
          {tab === "Projects" && <Projects projects={projects} setProjects={setProjects} />}
          {tab === "Opportunities" && <Opportunities opps={opps} setOpps={setOpps} />}
          {tab === "Tasks" && <Tasks tasks={tasks} setTasks={setTasks} />}
          {tab === "Clients" && <Accounts accounts={accounts} setAccounts={setAccounts} />}
          {!["Dashboard","Clients","Leads","Projects","Opportunities","Tasks"].includes(tab) && <ComingSoon name={tab} />}
        </div>
      </div>
    </div>
  );
}