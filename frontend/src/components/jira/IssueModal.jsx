import { useState, useEffect } from 'react'
import api from '../../services/api'
import { X, User, Calendar, Tag, Layers, AlertTriangle, AlignLeft } from 'lucide-react'

const C = {
  blue: '#0052CC', text: '#172B4D', muted: '#5E6C84', border: '#DFE1E6', bg: '#F4F5F7',
}

const TYPES = [
  { value: 'story', label: 'Story', color: '#36B37E' },
  { value: 'bug', label: 'Bug', color: '#E34935' },
  { value: 'task', label: 'Task', color: '#0052CC' },
  { value: 'subtask', label: 'Sub-task', color: '#5E6C84' },
]
const PRIORITIES = [
  { value: 'highest', label: 'Highest', color: '#CD1317' },
  { value: 'high', label: 'High', color: '#E34935' },
  { value: 'medium', label: 'Medium', color: '#FF8B00' },
  { value: 'low', label: 'Low', color: '#36B37E' },
  { value: 'lowest', label: 'Lowest', color: '#57D9A3' },
]
const LABELS = ['BILLING', 'ACCOUNTS', 'FEEDBACK', 'VAPT', 'SECURITY', 'PERFORMANCE', 'DOCUMENTATION']
const STATUSES = ['todo', 'in_progress', 'review', 'done']

export default function IssueModal({ issue, projectId, epics, sprints, onClose, onSaved }) {
  const isEdit = !!issue
  const [form, setForm] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    type: issue?.type || 'task',
    epic_id: issue?.epic_id || '',
    sprint_id: issue?.sprint_id || '',
    label: issue?.label || '',
    priority: issue?.priority || 'medium',
    status: issue?.status || 'todo',
    assignee_id: issue?.assignee?.id || '',
    due_date: issue?.due_date || '',
  })
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/users/assignable').then(r => setUsers(r.data.users)).catch(() => {})
  }, [])

  const f = (k, v) => setForm({ ...form, [k]: v })

  const save = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, project_id: projectId }
      if (!payload.epic_id) payload.epic_id = null
      if (!payload.sprint_id) payload.sprint_id = null
      if (!payload.assignee_id) payload.assignee_id = null
      if (!payload.due_date) payload.due_date = null
      if (isEdit) {
        await api.put(`/api/issues/${issue.id}`, payload)
      } else {
        await api.post('/api/issues', payload)
      }
      onSaved()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.3)',
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: 640, maxWidth: '90vw', background: '#fff', height: '100vh',
        display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            {isEdit && (
              <div style={{ fontSize: 11, color: '#7A869A', fontWeight: 500, marginBottom: 2 }}>
                {issue.key}
              </div>
            )}
            <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: 0 }}>
              {isEdit ? 'Edit issue' : 'Create issue'}
            </h2>
          </div>
          <button onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#5E6C84', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={save} style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Issue title *"
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 4, display: 'block' }}>
              <AlignLeft className="w-3 h-3" style={{ marginRight: 4, display: 'inline' }} /> Description
            </label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4} placeholder="Describe the issue..."
              style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            {/* Type */}
            <Field label="Issue Type" icon={<Tag className="w-3 h-3" />}>
              <select value={form.type} onChange={e => f('type', e.target.value)} style={selectStyle}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>

            {/* Status */}
            <Field label="Status" icon={<Layers className="w-3 h-3" />}>
              <select value={form.status} onChange={e => f('status', e.target.value)} style={selectStyle}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </Field>

            {/* Priority */}
            <Field label="Priority" icon={<AlertTriangle className="w-3 h-3" />}>
              <select value={form.priority} onChange={e => f('priority', e.target.value)} style={selectStyle}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>

            {/* Label */}
            <Field label="Label" icon={<Tag className="w-3 h-3" />}>
              <select value={form.label} onChange={e => f('label', e.target.value)} style={selectStyle}>
                <option value="">None</option>
                {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            {/* Epic */}
            <Field label="Epic" icon={<Layers className="w-3 h-3" />}>
              <select value={form.epic_id} onChange={e => f('epic_id', e.target.value)} style={selectStyle}>
                <option value="">None</option>
                {epics.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>

            {/* Sprint */}
            <Field label="Sprint" icon={<Layers className="w-3 h-3" />}>
              <select value={form.sprint_id} onChange={e => f('sprint_id', e.target.value)} style={selectStyle}>
                <option value="">None</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>

            {/* Assignee */}
            <Field label="Assignee" icon={<User className="w-3 h-3" />}>
              <select value={form.assignee_id} onChange={e => f('assignee_id', e.target.value)} style={selectStyle}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>

            {/* Due date */}
            <Field label="Due date" icon={<Calendar className="w-3 h-3" />}>
              <input type="date" value={form.due_date} onChange={e => f('due_date', e.target.value)}
                style={{ ...selectStyle, colorScheme: 'light' }} />
            </Field>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 24,
          }}>
            <button type="button" onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: 4, border: `1px solid ${C.border}`, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: C.text }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !form.title.trim()}
              style={{ padding: '7px 16px', borderRadius: 4, border: 'none', background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#5E6C84', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon} {label}
      </label>
      {children}
    </div>
  )
}

const selectStyle = {
  width: '100%', padding: '6px 8px', border: `1px solid #DFE1E6`, borderRadius: 4,
  fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff',
  boxSizing: 'border-box',
}
