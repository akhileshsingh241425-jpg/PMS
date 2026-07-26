import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import {
  LogIn, LogOut, Clock, CheckCircle, AlertCircle, XCircle, ListChecks,
  FileText, DollarSign, CalendarDays, Send, ChevronRight, Plus,
  Upload, Download, Eye, Edit3, Trash2, Zap, Flag, Ban, RotateCcw,
  Loader2, AlertTriangle, CheckCheck, Menu, X, User, Building, Home,
  MapPin, Briefcase, File, HelpCircle, ArrowLeft, ExternalLink,
  MessageSquare, Paperclip, Play, Pause, Target, Star
} from 'lucide-react'

const SEVERITY_STYLES = {
  CRITICAL: { bg: '#7F1D1D', text: '#FCA5A5' },
  HIGH: { bg: '#7C2D12', text: '#FDBA74' },
  MEDIUM: { bg: '#713F12', text: '#FCD34D' },
  LOW: { bg: '#1E3A5F', text: '#93C5FD' },
  INFO: { bg: '#14532D', text: '#86EFAC' },
}

const TASK_STATUS_STYLES = {
  'ALLOTTED': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'IN PROGRESS': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'BLOCKED': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  'SENT FOR APPROVAL': { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
  'REWORK': { bg: '#FFFBEB', text: '#A16207', dot: '#EAB308' },
  'APPROVED': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
}

function formatDT(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDate(ds) {
  if (!ds) return ''
  const d = new Date(ds)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

// ─── CHECK-IN GATE ─────────────────────────────────────────

function CheckInGate({ onCheckIn }) {
  const [workMode, setWorkMode] = useState('Office')
  const [loading, setLoading] = useState(false)
  const [missed, setMissed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/my-day/status').then(r => {
      if (r.data.missed_yesterday_checkout) setMissed(true)
    }).catch(() => {})
  }, [])

  const handleCheckIn = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await api.post('/api/attendance/clock-in', { work_mode: workMode })
      onCheckIn(r.data.attendance)
    } catch (e) {
      setError(e.response?.data?.error || 'Check-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <LogIn className="w-8 h-8" style={{ color: '#3B82F6' }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>Good Morning!</h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px' }}>Tap check-in to start your day</p>

        {missed && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#92400E' }}>Missed check-out yesterday</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#A16207' }}>PM has been notified. Please check out yesterday's session first.</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 10, textAlign: 'left' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Work Mode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Office', 'Remote', 'Client Site'].map(m => (
              <button key={m} onClick={() => setWorkMode(m)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 8, border: `2px solid ${workMode === m ? '#3B82F6' : '#E5E7EB'}`,
                  background: workMode === m ? '#EFF6FF' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  color: workMode === m ? '#1D4ED8' : '#6B7280', transition: 'all 0.15s',
                }}>
                {m === 'Office' ? <Building className="w-4 h-4" style={{ margin: '0 auto 4px' }} /> :
                 m === 'Remote' ? <Home className="w-4 h-4" style={{ margin: '0 auto 4px' }} /> :
                 <MapPin className="w-4 h-4" style={{ margin: '0 auto 4px' }} />}
                {m}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 16px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button onClick={handleCheckIn} disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, border: 'none',
            background: loading ? '#93C5FD' : '#3B82F6', color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}>
          {loading ? <Loader2 className="w-5 h-5" style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn className="w-5 h-5" />}
          {loading ? 'Checking in...' : 'Check-In'}
        </button>
      </div>
    </div>
  )
}

// ─── STAT CARD ─────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F172A' }}>{value}</p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{label}</p>
        </div>
      </div>
    </div>
  )
}

// ─── TASK CARD ─────────────────────────────────────────────

function TaskCard({ task, onClick }) {
  const st = TASK_STATUS_STYLES[task.status] || TASK_STATUS_STYLES['ALLOTTED']
  const overdue = task.due_date && new Date(task.due_date) < new Date() && !['APPROVED', 'COMPLETED'].includes(task.status)
  return (
    <div onClick={() => onClick(task)}
      style={{
        background: '#fff', borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
        borderLeft: `3px solid ${overdue ? '#EF4444' : st.dot}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
          {task.project_name && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>{task.project_name}</p>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: st.bg, color: st.text, whiteSpace: 'nowrap', marginLeft: 8,
        }}>{task.status}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94A3B8' }}>
        {task.due_date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: overdue ? '#EF4444' : '#94A3B8' }}>
            <Clock className="w-3 h-3" /> {formatDate(task.due_date)}
          </span>
        )}
        {task.estimated_hours && <span>{task.estimated_hours}h</span>}
        {overdue && <span style={{ color: '#EF4444', fontWeight: 600 }}>Overdue</span>}
      </div>
    </div>
  )
}

// ─── REQUEST ITEM ──────────────────────────────────────────

function RequestItem({ icon, title, subtitle, status, date, onClick }) {
  const statusColors = {
    Pending: { bg: '#FFFBEB', text: '#A16207' },
    Approved: { bg: '#F0FDF4', text: '#15803D' },
    Rejected: { bg: '#FEF2F2', text: '#B91C1C' },
    Reimbursed: { bg: '#F0FDF4', text: '#15803D' },
  }
  const sc = statusColors[status] || statusColors.Pending
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{title}</p>
        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#94A3B8' }}>{subtitle}</p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{status}</span>
      {date && <span style={{ fontSize: 10, color: '#CBD5E1' }}>{formatDate(date)}</span>}
    </div>
  )
}

// ─── FINDING FORM MODAL ────────────────────────────────────

function AddFindingModal({ task, phases, onClose, onSaved }) {
  const [form, setForm] = useState({ phase_id: '', title: '', severity: 'MEDIUM', cvss_score: '', affected_asset: '', finding_type: '', clause_ref: '', asset_id: '', description: '', impact: '', recommendation: '', cwe_ref: '' })
  const [assets, setAssets] = useState([])
  const [pocFiles, setPocFiles] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/api/my-day/tasks/${task.id}/assets`).then(r => setAssets(r.data.assets || [])).catch(() => {})
  }, [task.id])

  const handleSubmit = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      pocFiles.forEach(f => fd.append('poc_files', f))
      await api.post(`/api/my-day/tasks/${task.id}/findings`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSaved()
      onClose()
    } catch (e) { alert(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Finding</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X className="w-5 h-5" /></button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Scope Item / Module *</label>
            <select value={form.phase_id} onChange={e => setForm({ ...form, phase_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
              <option value="">Select scope item...</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Finding Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} placeholder="e.g. SQL Injection in login parameter" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Severity</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>CVSS Score</label>
              <input value={form.cvss_score} onChange={e => setForm({ ...form, cvss_score: e.target.value })} type="number" step="0.1" min="0" max="10"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Finding Type</label>
            <select value={form.finding_type} onChange={e => setForm({ ...form, finding_type: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
              <option value="">Standard (VAPT)</option>
              <option value="NC Major">NC Major</option>
              <option value="NC Minor">NC Minor</option>
              <option value="Observation">Observation</option>
              <option value="OFI">OFI</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Clause Reference</label>
            <input value={form.clause_ref} onChange={e => setForm({ ...form, clause_ref: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} placeholder="e.g. ISO 27001:2022 A.8.2" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Affected Asset</label>
            <select value={form.asset_id} onChange={e => setForm({ ...form, asset_id: e.target.value, affected_asset: e.target.options[e.target.selectedIndex]?.dataset?.name || '' })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
              <option value="">Select asset (or type manually below)</option>
              {assets.map(a => <option key={a.id} value={a.id} data-name={a.name}>{a.name}{a.asset_type ? ` (${a.asset_type})` : ''}</option>)}
            </select>
            <input value={form.affected_asset} onChange={e => setForm({ ...form, affected_asset: e.target.value, asset_id: '' })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, marginTop: 6 }} placeholder="Or type manually: URL / IP / endpoint" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description & Impact</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Recommendation</label>
            <textarea value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>CWE Reference</label>
            <input value={form.cwe_ref} onChange={e => setForm({ ...form, cwe_ref: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} placeholder="CWE-89" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>PoC Evidence</label>
            <input type="file" multiple accept="image/*,.pdf" onChange={e => setPocFiles([...e.target.files])}
              style={{ fontSize: 13 }} />
            {pocFiles.length > 0 && <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>{pocFiles.length} file(s) selected</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.title}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saving ? '#93C5FD' : '#3B82F6', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Finding'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DAY-END LOG PANEL ─────────────────────────────────────

function DayEndLogPanel({ touchedTasks, existingLog, onSave, onBack }) {
  const [entries, setEntries] = useState(() => {
    if (existingLog) return existingLog.entries
    return (touchedTasks || []).map(t => ({
      task_id: t.id,
      task_title: t.title,
      activity_done: '',
      task_status: t.status,
      hours: 0,
    }))
  })
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customEntry, setCustomEntry] = useState({ activity_done: '', hours: 0 })

  const totalHours = entries.reduce((s, e) => s + parseFloat(e.hours || 0), 0)

  const updateEntry = (idx, field, val) => {
    const upd = [...entries]
    upd[idx] = { ...upd[idx], [field]: val }
    setEntries(upd)
  }

  const addCustomEntry = () => {
    setEntries([...entries, {
      task_id: null,
      task_title: customEntry.activity_done,
      activity_done: customEntry.activity_done,
      task_status: 'Completed',
      hours: parseFloat(customEntry.hours) || 0,
      is_custom: true,
    }])
    setCustomEntry({ activity_done: '', hours: 0 })
    setShowAddCustom(false)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Day-End Log</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Log activity for each task you worked on today</p>
        </div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: totalHours > 0 ? '#F0FDF4' : '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total Hours Logged</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: totalHours > 0 ? '#15803D' : '#6B7280' }}>{totalHours.toFixed(1)}h</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #E5E7EB' }}>Task</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #E5E7EB' }}>Activity Done</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #E5E7EB' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #E5E7EB' }}>Hours</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{e.task_title || 'Untracked Work'}</span>
                  {e.is_custom && <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 6 }}>(custom)</span>}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                  <textarea value={e.activity_done} onChange={e2 => updateEntry(i, 'activity_done', e2.target.value)} rows={1}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, resize: 'vertical' }} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9' }}>
                  <select value={e.task_status} onChange={e2 => updateEntry(i, 'task_status', e2.target.value)}
                    style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12 }}>
                    <option value="IN PROGRESS">In Progress</option>
                    <option value="SENT FOR APPROVAL">Completed - Sent for Approval</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="ALLOTTED">Not Started</option>
                  </select>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <input value={e.hours} onChange={e2 => updateEntry(i, 'hours', e2.target.value)} type="number" step="0.5" min="0" max="24"
                    style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, textAlign: 'center' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => setShowAddCustom(!showAddCustom)}
        style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px dashed #D1D5DB', background: 'none', cursor: 'pointer', fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plus className="w-4 h-4" /> Add untracked work (meetings, support, travel)
      </button>

      {showAddCustom && (
        <div style={{ marginTop: 12, padding: 16, background: '#F9FAFB', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Activity</label>
            <input value={customEntry.activity_done} onChange={e => setCustomEntry({ ...customEntry, activity_done: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} placeholder="e.g. Client meeting" />
          </div>
          <div style={{ width: 100 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Hours</label>
            <input value={customEntry.hours} onChange={e => setCustomEntry({ ...customEntry, hours: e.target.value })} type="number" step="0.5" min="0"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
          </div>
          <button onClick={addCustomEntry} disabled={!customEntry.activity_done || !customEntry.hours}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add</button>
        </div>
      )}

      {!existingLog && (
        <button onClick={() => onSave(entries)}
          style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#15803D', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Submit Day-End Log
        </button>
      )}
    </div>
  )
}

// ─── LEAVE FORM MODAL ──────────────────────────────────────

function LeaveFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ leave_type: 'Casual', from_date: '', to_date: '', from_time: '', to_time: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const isShortLeave = form.leave_type === 'Short Leave'

  const handleSubmit = async () => {
    if (!form.from_date || !form.reason) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      await api.post('/api/my-day/leave', fd)
      onSaved()
      onClose()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Leave Request</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="w-5 h-5" /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Type</label>
            <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
              <option value="Casual">Casual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Earned">Earned Leave</option>
              <option value="LWP">Leave Without Pay</option>
              <option value="Short Leave">Short Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isShortLeave ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>From Date</label>
              <input value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
            </div>
            {isShortLeave ? (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>From Time</label>
                  <input value={form.from_time} onChange={e => setForm({ ...form, from_time: e.target.value })} type="time"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>To Time</label>
                  <input value={form.to_time} onChange={e => setForm({ ...form, to_time: e.target.value })} type="time"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
                </div>
              </>
            ) : (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>To Date</label>
                <input value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} type="date"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Reason</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.from_date || !form.reason}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EXPENSE FORM MODAL ────────────────────────────────────

function ExpenseFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Travel', amount: '', reason: '', project_id: '' })
  const [bill, setBill] = useState(null)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    api.get('/api/my-day/tasks?status=ALLOTTED').then(r => {
      const pids = [...new Set((r.data.tasks || []).map(t => t.project_id))]
      setProjects(pids.map(pid => ({ id: pid, name: r.data.tasks.find(t => t.project_id === pid)?.project_name || `Project #${pid}` })))
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.amount || !form.reason) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      if (bill) fd.append('bill', bill)
      await api.post('/api/my-day/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onSaved()
      onClose()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Expense Entry</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X className="w-5 h-5" /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date</label>
              <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
                <option value="Travel">Travel</option>
                <option value="Conveyance">Conveyance</option>
                <option value="Food">Food</option>
                <option value="Lodging">Lodging</option>
                <option value="Client-site expense">Client-site Expense</option>
                <option value="Tools/License">Tools/License</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Amount (₹)</label>
            <input value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} type="number" step="0.01" min="0"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Reason for Expense</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Linked Project (optional)</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}>
              <option value="">None</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Bill / Receipt</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setBill(e.target.files[0])} style={{ fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !form.amount || !form.reason}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TASK DETAIL PANEL ─────────────────────────────────────

function TaskDetailPanel({ task, onBack, onFindingAdded, onStatusChange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('activity')
  const [showFindingForm, setShowFindingForm] = useState(false)
  const [reportFile, setReportFile] = useState(null)
  const [reportTitle, setReportTitle] = useState('')

  const loadData = useCallback(async () => {
    try {
      const r = await api.get(`/api/my-day/tasks/${task.id}`)
      setData(r.data)
    } catch (e) { /* ignore */ }
    finally { setLoading(false) }
  }, [task.id])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (status) => {
    try {
      await api.put(`/api/my-day/tasks/${task.id}/status`, { status })
      onStatusChange()
      loadData()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
  }

  const handleUploadReport = async () => {
    if (!reportFile) return
    try {
      const fd = new FormData()
      fd.append('file', reportFile)
      fd.append('title', reportTitle || reportFile.name)
      await api.post(`/api/my-day/tasks/${task.id}/reports`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setReportFile(null)
      setReportTitle('')
      loadData()
    } catch (e) { alert(e.response?.data?.error || 'Failed') }
  }

  const handleFindingSaved = () => {
    loadData()
    onFindingAdded()
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</div>
  if (!data) return null

  const canTransition = task.status === 'ALLOTTED' || task.status === 'IN PROGRESS' || task.status === 'BLOCKED' || task.status === 'REWORK' || task.status === 'SENT FOR APPROVAL'

  return (
    <div>
      {showFindingForm && (
        <AddFindingModal task={task} phases={data.project_phases || []} onClose={() => setShowFindingForm(false)} onSaved={handleFindingSaved} />
      )}

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 4, background: (TASK_STATUS_STYLES[task.status] || {}).bg || '#F1F5F9', color: (TASK_STATUS_STYLES[task.status] || {}).text || '#475569' }}>{task.status}</span>
        </div>

        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{task.title}</h2>
        {task.project_name && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>{task.project_name}</p>}

        {task.due_date && (
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock className="w-4 h-4" /> Due: {formatDate(task.due_date)}
          </p>
        )}

        {/* Status Action Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {task.status === 'ALLOTTED' && (
            <button onClick={() => handleStatusChange('IN PROGRESS')}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#F97316', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Play className="w-4 h-4" /> Start Work
            </button>
          )}
          {task.status === 'IN PROGRESS' && (
            <>
              <button onClick={() => handleStatusChange('SENT FOR APPROVAL')}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send className="w-4 h-4" /> Mark for Approval
              </button>
              <button onClick={() => handleStatusChange('BLOCKED')}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ban className="w-4 h-4" /> Blocked
              </button>
            </>
          )}
          {(task.status === 'BLOCKED' || task.status === 'REWORK' || task.status === 'SENT FOR APPROVAL') && (
            <button onClick={() => handleStatusChange('IN PROGRESS')}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw className="w-4 h-4" /> Resume Work
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F1F5F9', marginTop: 20 }}>
          {[
            { key: 'activity', label: 'Activity', icon: Clock },
            { key: 'findings', label: `Findings (${(data.findings || []).length})`, icon: AlertTriangle },
            { key: 'reports', label: 'Reports', icon: FileText },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: activeTab === tab.key ? '#3B82F6' : '#94A3B8', borderBottom: `2px solid ${activeTab === tab.key ? '#3B82F6' : 'transparent'}`, marginBottom: -2,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 16 }}>
          {activeTab === 'activity' && (
            <div>
              {(!data.activities || data.activities.length === 0) ? (
                <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>No activity yet</p>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: '#E5E7EB' }} />
                  {data.activities.map((a, i) => (
                    <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                      <div style={{ position: 'absolute', left: -16, top: 4, width: 10, height: 10, borderRadius: '50%', background: a.action === 'status_change' ? '#3B82F6' : '#E5E7EB', border: '2px solid #fff' }} />
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#374151' }}>
                        {a.action === 'status_change' ? `Status changed: ${a.old_value} → ${a.new_value}` : a.action}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>{a.user_name} · {timeAgo(a.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'findings' && (
            <div>
              <button onClick={() => setShowFindingForm(true)}
                style={{ marginBottom: 12, padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus className="w-4 h-4" /> Add Finding
              </button>
              {(!data.findings || data.findings.length === 0) ? (
                <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>No findings logged</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {data.findings.map(f => (
                    <div key={f.id} style={{ padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{f.title}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: (SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.MEDIUM).bg, color: (SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.MEDIUM).text }}>{f.severity}</span>
                      </div>
                      {(f.finding_type || f.clause_ref) && (
                        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6B7280' }}>
                          {[f.finding_type, f.clause_ref].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {f.affected_asset && <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6B7280' }}>Asset: {f.affected_asset}</p>}
                      {f.description && <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{f.description}</p>}
                      {f.status && <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, display: 'inline-block' }}>Status: {f.status}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Upload Deliverable</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="Report title"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
                  <input type="file" onChange={e => setReportFile(e.target.files[0])}
                    style={{ fontSize: 12, flex: 1 }} />
                  <button onClick={handleUploadReport} disabled={!reportFile}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(!data.reports || data.reports.length === 0) ? (
                <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: 20 }}>No reports uploaded</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.reports.map(r => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{r.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>v{r.version} · {r.uploaded_by_name} · {formatDate(r.uploaded_at)}</p>
                      </div>
                      {r.file_url && (
                        <a href={r.file_url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 6, background: '#EFF6FF', color: '#3B82F6', fontSize: 11, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye className="w-3 h-3" /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN MY DAY PAGE ──────────────────────────────────────

export default function MyDayPage() {
  const [view, setView] = useState('loading')
  const [attendance, setAttendance] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [touchedTasks, setTouchedTasks] = useState([])
  const [existingLog, setExistingLog] = useState(null)
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [tab, setTab] = useState('pending')
  const [error, setError] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const r = await api.get('/api/my-day/status')
      const status = r.data
      if (status.checked_in) {
        setAttendance({ id: status.attendance_id, clock_in: status.clock_in_time, work_mode: status.work_mode })
        setView('dashboard')
        loadDashboard()
      } else {
        if (status.missed_yesterday_checkout) {
          setError('You missed check-out yesterday. Please contact your PM.')
        }
        setView('checkin')
      }
    } catch (e) { setView('checkin') }
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      const r = await api.get('/api/my-day/dashboard')
      setDashboardData(r.data)
    } catch (e) { /* ignore */ }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleCheckIn = (att) => {
    setAttendance(att)
    setView('dashboard')
    loadDashboard()
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setView('taskdetail')
  }

  const handleTaskBack = () => {
    setSelectedTask(null)
    setView('dashboard')
    loadDashboard()
  }

  const handleFindingAdded = () => { loadDashboard() }

  const handleStatusChange = () => { loadDashboard() }

  const handleCheckOut = async () => {
    setView('dayendlog')
    try {
      const r = await api.get('/api/my-day/day-end-log')
      setTouchedTasks(r.data.touched_tasks || [])
      setExistingLog(r.data.log)
    } catch (e) { /* ignore */ }
  }

  const handleDayEndLogSave = async (entries) => {
    try {
      await api.post('/api/my-day/day-end-log', { entries })
      // Now check-out
      try {
        await api.post('/api/my-day/check-out')
        setAttendance(null)
        setDashboardData(null)
        setView('checkin')
      } catch (e) {
        alert(e.response?.data?.error || 'Check-out failed')
      }
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save day-end log')
    }
  }

  const handleLeaveSaved = () => { loadDashboard() }
  const handleExpenseSaved = () => { loadDashboard() }

  const taskList = tab === 'pending' ? (dashboardData?.pending_tasks || []) :
    tab === 'overdue' ? (dashboardData?.overdue_tasks || []) :
    tab === 'approval' ? (dashboardData?.sent_for_approval || []) : []

  if (view === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="w-8 h-8" style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
      </div>
    )
  }

  if (view === 'checkin') {
    return <CheckInGate onCheckIn={handleCheckIn} />
  }

  if (view === 'taskdetail' && selectedTask) {
    return <TaskDetailPanel task={selectedTask} onBack={handleTaskBack} onFindingAdded={handleFindingAdded} onStatusChange={handleStatusChange} />
  }

  if (view === 'dayendlog') {
    return <DayEndLogPanel touchedTasks={touchedTasks} existingLog={existingLog} onSave={handleDayEndLogSave} onBack={() => { setView('dashboard'); loadDashboard() }} />
  }

  if (view === 'dashboard' && dashboardData) {
    const { stats } = dashboardData

    return (
      <div>
        {showLeaveForm && <LeaveFormModal onClose={() => setShowLeaveForm(false)} onSaved={handleLeaveSaved} />}
        {showExpenseForm && <ExpenseFormModal onClose={() => setShowExpenseForm(false)} onSaved={handleExpenseSaved} />}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Day</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              {attendance?.clock_in ? `Checked in at ${formatDT(attendance.clock_in)}` : ''}
              {attendance?.work_mode ? ` · ${attendance.work_mode}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowExpenseForm(true)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign className="w-4 h-4" /> Add Expense
            </button>
            <button onClick={() => setShowLeaveForm(true)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays className="w-4 h-4" /> Leave
            </button>
            {!dashboardData.day_end_log_submitted && (
              <button onClick={handleCheckOut}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <LogOut className="w-4 h-4" /> Check-Out
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <StatCard icon={<ListChecks className="w-5 h-5" style={{ color: '#3B82F6' }} />} label="Pending Tasks" value={stats.pending_tasks} color="#3B82F6" />
          <StatCard icon={<Send className="w-5 h-5" style={{ color: '#8B5CF6' }} />} label="Sent for Approval" value={stats.sent_for_approval} color="#8B5CF6" />
          <StatCard icon={<AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />} label="Overdue" value={stats.overdue_tasks} color="#EF4444" />
          <StatCard icon={<Ban className="w-5 h-5" style={{ color: '#F97316' }} />} label="Blocked" value={stats.blocked_tasks} color="#F97316" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 12 }}>
          {/* Left: Tasks */}
          <div>
            {/* Task tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #F1F5F9', marginBottom: 16 }}>
              {[
                { key: 'pending', label: 'Pending', count: stats.pending_tasks },
                { key: 'overdue', label: 'Overdue', count: stats.overdue_tasks },
                { key: 'approval', label: 'Sent for Approval', count: stats.sent_for_approval },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: tab === t.key ? '#0F172A' : '#94A3B8', borderBottom: `2px solid ${tab === t.key ? '#3B82F6' : 'transparent'}`, marginBottom: -2,
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                  }}>
                  {t.label}
                  <span style={{ fontSize: 10, background: tab === t.key ? '#EFF6FF' : '#F1F5F9', color: tab === t.key ? '#3B82F6' : '#94A3B8', padding: '1px 6px', borderRadius: 10 }}>{t.count}</span>
                </button>
              ))}
            </div>

            {taskList.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: '40px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <CheckCircle className="w-10 h-10" style={{ color: '#22C55E', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>All clear!</p>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0 0' }}>No {tab === 'pending' ? 'pending' : tab === 'overdue' ? 'overdue' : 'tasks for approval'} </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {taskList.map(t => <TaskCard key={t.id} task={t} onClick={handleTaskClick} />)}
              </div>
            )}
          </div>

          {/* Right panel: Requests */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarDays className="w-4 h-4" style={{ color: '#3B82F6' }} /> Leave Requests
              </h3>
              {(!dashboardData.recent_leave_requests || dashboardData.recent_leave_requests.length === 0) ? (
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>No leave requests</p>
              ) : (
                dashboardData.recent_leave_requests.slice(0, 4).map(r => (
                  <RequestItem key={r.id} icon={<CalendarDays className="w-4 h-4" style={{ color: '#6B7280' }} />}
                    title={`${r.leave_type}${r.from_date !== r.to_date ? ` (${formatDate(r.from_date)} - ${formatDate(r.to_date)})` : ` - ${formatDate(r.from_date)}`}`}
                    subtitle={r.reason} status={r.status} date={r.created_at} />
                ))
              )}
              <button onClick={() => setShowLeaveForm(true)} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, border: '1px dashed #D1D5DB', background: 'none', cursor: 'pointer', fontSize: 11, color: '#6B7280', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Plus className="w-3 h-3" /> New Leave Request
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign className="w-4 h-4" style={{ color: '#22C55E' }} /> Expenses
              </h3>
              {(!dashboardData.recent_expenses || dashboardData.recent_expenses.length === 0) ? (
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>No expenses recorded</p>
              ) : (
                dashboardData.recent_expenses.slice(0, 4).map(e => (
                  <RequestItem key={e.id} icon={<DollarSign className="w-4 h-4" style={{ color: '#6B7280' }} />}
                    title={`₹${e.amount} — ${e.category}`}
                    subtitle={e.reason} status={e.status} date={e.date} />
                ))
              )}
              <button onClick={() => setShowExpenseForm(true)} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, border: '1px dashed #D1D5DB', background: 'none', cursor: 'pointer', fontSize: 11, color: '#6B7280', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Plus className="w-3 h-3" /> New Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
