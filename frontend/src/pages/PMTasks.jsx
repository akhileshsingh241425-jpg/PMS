import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, X, Filter } from 'lucide-react'

const PRIORITY_COLORS = {
  'Low': { bg: '#F0FDF4', text: '#059669' },
  'Normal': { bg: '#EFF6FF', text: '#3B82F6' },
  'Medium': { bg: '#FEF3C7', text: '#D97706' },
  'High': { bg: '#FEE2E2', text: '#DC2626' },
}

const STATUS_OPTIONS = ['Open', 'In Progress', 'Pending', 'Completed']

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 25px 80px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  )
}

export default function PMTasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [filters, setFilters] = useState({ project_id: '', assigned_to: '', status: '', priority: '', overdue: false })
  const [form, setForm] = useState({ title: '', description: '', project_id: '', assigned_to: '', priority: 'Normal', due_date: '' })
  const [saving, setSaving] = useState(false)

  const loadTasks = () => {
    const params = new URLSearchParams()
    if (filters.project_id) params.set('project_id', filters.project_id)
    if (filters.assigned_to) params.set('assigned_to', filters.assigned_to)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.overdue) params.set('status', 'overdue')
    api.get(`/api/pm/tasks?${params}`)
      .then(r => setTasks(r.data.tasks || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const loadProjects = () => {
    api.get('/api/pm/projects')
      .then(r => setProjects(r.data.projects || []))
      .catch(() => {})
  }

  const loadTeam = (pid) => {
    api.get('/api/pm/team')
      .then(r => {
        const all = r.data.team || []
        setTeamMembers(pid ? all.filter(m => m.project_id === parseInt(pid)) : all)
      })
      .catch(() => {})
  }

  useEffect(() => { loadTasks(); loadProjects(); loadTeam() }, [])

  useEffect(() => {
    if (form.project_id) loadTeam(form.project_id)
  }, [form.project_id])

  const openCreate = () => {
    setEditTask(null)
    setForm({ title: '', description: '', project_id: '', assigned_to: '', priority: 'Normal', due_date: '' })
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditTask(t)
    setForm({
      title: t.title || '',
      description: t.description || '',
      project_id: t.project_id?.toString() || '',
      assigned_to: t.assigned_to?.toString() || '',
      priority: t.priority || 'Normal',
      due_date: t.due_date ? t.due_date.slice(0, 10) : '',
    })
    if (t.project_id) loadTeam(t.project_id)
    setShowForm(true)
  }

  const saveTask = async () => {
    if (!form.title.trim() || !form.project_id) return alert('Title and project are required')
    setSaving(true)
    try {
      const body = { ...form, project_id: parseInt(form.project_id), assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null }
      if (editTask) {
        await api.put(`/api/pm/tasks/${editTask.id}`, body)
      } else {
        await api.post('/api/pm/tasks', body)
      }
      setShowForm(false)
      loadTasks()
    } catch (e) { alert(e.response?.data?.error || 'Failed to save task') }
    finally { setSaving(false) }
  }

  const updateStatus = async (task, status) => {
    try {
      await api.put(`/api/pm/tasks/${task.id}`, { status })
      loadTasks()
    } catch (e) { alert('Failed to update status') }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks ({tasks.length})</h1>
        <button onClick={openCreate}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filters.project_id} onChange={e => setFilters({ ...filters, project_id: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={e => setFilters({ ...filters, assigned_to: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
          <option value="">All Assignees</option>
          {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="overdue">Overdue</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
          <option value="">All Priority</option>
          <option value="Low">Low</option>
          <option value="Normal">Normal</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#9CA3AF' }}>
          <p style={{ fontSize: 15, margin: 0 }}>No tasks found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(t => {
            const pc = PRIORITY_COLORS[t.priority] || { bg: '#F3F4F6', text: '#6B7280' }
            return (
              <div key={t.id} style={{
                background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <select value={t.status} onChange={e => updateStatus(t, e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }} onClick={() => openEdit(t)}>{t.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {t.project_title || ''} · {t.assigned_name || 'Unassigned'}
                    {t.due_date ? ` · Due ${new Date(t.due_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.text }}>{t.priority}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{editTask ? 'Edit Task' : 'Create Task'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Project *</label>
              <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Assignee</label>
              <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                <option value="">Select member</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.role_in_project || m.designation || ''})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={saveTask} disabled={saving}
              style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1, marginTop: 8 }}>
              {saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
