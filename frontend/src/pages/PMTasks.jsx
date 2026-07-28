import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, X, LayoutGrid, List as ListIcon, MessageSquare, CheckSquare, Send } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import Breadcrumb from '../components/Breadcrumb'

const PRIORITY_COLORS = {
  'Low': { bg: '#F0FDF4', text: '#059669' },
  'Normal': { bg: '#EFF6FF', text: '#3B82F6' },
  'Medium': { bg: '#FEF3C7', text: '#D97706' },
  'High': { bg: '#FEE2E2', text: '#DC2626' },
}

// Real task lifecycle (matches backend routes/myday.py's TASK_STATUSES —
// this is what the assignee's own MyDayPage actually drives).
const STATUS_OPTIONS = ['ALLOTTED', 'IN PROGRESS', 'BLOCKED', 'SENT FOR APPROVAL', 'REWORK', 'APPROVED']
const STATUS_STYLES = {
  'ALLOTTED': { bg: '#EFF6FF', text: '#1D4ED8' },
  'IN PROGRESS': { bg: '#FFF7ED', text: '#C2410C' },
  'BLOCKED': { bg: '#FEF2F2', text: '#B91C1C' },
  'SENT FOR APPROVAL': { bg: '#F5F3FF', text: '#6D28D9' },
  'REWORK': { bg: '#FFFBEB', text: '#A16207' },
  'APPROVED': { bg: '#F0FDF4', text: '#15803D' },
  'COMPLETED': { bg: '#F0FDF4', text: '#15803D' },
}
const BOARD_COLUMNS = ['ALLOTTED', 'IN PROGRESS', 'BLOCKED', 'SENT FOR APPROVAL', 'REWORK', 'APPROVED']

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: wide ? 640 : 560, width: '100%', maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 25px 80px rgba(0,0,0,0.2)' }}>
        {children}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F3F4F6', text: '#6B7280' }
  return <span style={{ padding: '2.5px 9px', borderRadius: 10, fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.text, whiteSpace: 'nowrap' }}>{status}</span>
}

function TaskDetailDrawer({ task, onClose, onChanged }) {
  const toast = useToast()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get(`/api/tasks/${task.id}`).then(r => setDetail(r.data)).catch(() => toast('Failed to load task detail', 'error')).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [task.id])

  const addChecklistItem = async e => {
    e.preventDefault()
    if (!newItem.trim()) return
    setBusy(true)
    try { await api.post(`/api/tasks/${task.id}/checklist`, { text: newItem }); setNewItem(''); load() }
    catch (e) { toast('Failed to add item', 'error') } finally { setBusy(false) }
  }

  const toggleItem = async item => {
    try { await api.put(`/api/checklist/${item.id}`, { is_completed: !item.is_completed }); load() }
    catch (e) { toast('Failed to update item', 'error') }
  }

  const removeItem = async item => {
    try { await api.delete(`/api/checklist/${item.id}`); load() }
    catch (e) { toast('Failed to remove item', 'error') }
  }

  const addComment = async e => {
    e.preventDefault()
    if (!newComment.trim()) return
    setBusy(true)
    try { await api.post(`/api/tasks/${task.id}/comments`, { text: newComment }); setNewComment(''); load() }
    catch (e) { toast('Failed to add comment', 'error') } finally { setBusy(false) }
  }

  const doneCount = detail?.checklist?.filter(i => i.is_completed).length || 0

  return (
    <Modal onClose={onClose} wide>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#0F172A' }}>{task.title}</h3>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>{task.project_title} · {task.assigned_name || 'Unassigned'}</p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X className="w-5 h-5" /></button>
      </div>
      <div style={{ margin: '10px 0 18px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <StatusBadge status={task.status} />
        <span style={{ padding: '2.5px 9px', borderRadius: 10, fontSize: 10.5, fontWeight: 700, background: (PRIORITY_COLORS[task.priority] || {}).bg, color: (PRIORITY_COLORS[task.priority] || {}).text }}>{task.priority}</span>
        {task.due_date && <span style={{ fontSize: 11.5, color: '#6B7280' }}>Due {new Date(task.due_date).toLocaleDateString()}</span>}
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>Loading…</p>
      ) : (
        <>
          {task.description && <p style={{ fontSize: 13, color: '#374151', margin: '0 0 18px', whiteSpace: 'pre-wrap' }}>{task.description}</p>}

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
              <CheckSquare className="w-3.5 h-3.5" /> Checklist {detail.checklist.length > 0 && `(${doneCount}/${detail.checklist.length})`}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {detail.checklist.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#F8FAFC', borderRadius: 6 }}>
                  <input type="checkbox" checked={item.is_completed} onChange={() => toggleItem(item)} style={{ cursor: 'pointer' }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: item.is_completed ? '#9CA3AF' : '#374151', textDecoration: item.is_completed ? 'line-through' : 'none' }}>{item.text}</span>
                  <button onClick={() => removeItem(item)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13 }}>×</button>
                </div>
              ))}
              {detail.checklist.length === 0 && <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: 0 }}>No checklist items yet</p>}
            </div>
            <form onSubmit={addChecklistItem} style={{ display: 'flex', gap: 6 }}>
              <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add checklist item…"
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12.5, outline: 'none' }} />
              <button disabled={busy} style={{ padding: '7px 12px', border: 'none', borderRadius: 7, background: '#F1F5F9', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
            </form>
          </div>

          <div>
            <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
              <MessageSquare className="w-3.5 h-3.5" /> Comments {detail.comments.length > 0 && `(${detail.comments.length})`}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8, maxHeight: 220, overflowY: 'auto' }}>
              {detail.comments.map(c => (
                <div key={c.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151' }}>{c.author_name || 'Unknown'}</span>
                    <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</p>
                </div>
              ))}
              {detail.comments.length === 0 && <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: 0 }}>No comments yet</p>}
            </div>
            <form onSubmit={addComment} style={{ display: 'flex', gap: 6 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment…"
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #D1D5DB', borderRadius: 7, fontSize: 12.5, outline: 'none' }} />
              <button disabled={busy} style={{ padding: '7px 12px', border: 'none', borderRadius: 7, background: '#5B21B6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Send className="w-3 h-3" /> Send
              </button>
            </form>
          </div>
        </>
      )}
    </Modal>
  )
}

export default function PMTasks() {
  const { addToast } = useToast()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('board')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [detailTask, setDetailTask] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
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
    api.get('/api/pm/projects').then(r => setProjects(r.data.projects || [])).catch(() => {})
  }

  const loadTeam = (pid) => {
    api.get('/api/pm/team').then(r => {
      const all = r.data.team || []
      setTeamMembers(pid ? all.filter(m => m.project_id === parseInt(pid)) : all)
    }).catch(() => {})
  }

  useEffect(() => { loadProjects(); loadTeam() }, [])
  useEffect(() => { loadTasks() }, [filters])
  useEffect(() => { if (form.project_id) loadTeam(form.project_id) }, [form.project_id])

  const openCreate = () => {
    setEditTask(null)
    setForm({ title: '', description: '', project_id: filters.project_id || '', assigned_to: '', priority: 'Normal', due_date: '' })
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditTask(t)
    setForm({
      title: t.title || '', description: t.description || '',
      project_id: t.project_id?.toString() || '', assigned_to: t.assigned_to?.toString() || '',
      priority: t.priority || 'Normal', due_date: t.due_date ? t.due_date.slice(0, 10) : '',
    })
    if (t.project_id) loadTeam(t.project_id)
    setShowForm(true)
  }

  const saveTask = async () => {
    if (!form.title.trim() || !form.project_id) return addToast('Title and project are required', 'error')
    setSaving(true)
    try {
      const body = { ...form, project_id: parseInt(form.project_id), assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null }
      if (editTask) await api.put(`/api/pm/tasks/${editTask.id}`, body)
      else await api.post('/api/pm/tasks', body)
      setShowForm(false)
      loadTasks()
    } catch (e) { addToast(e.response?.data?.error || 'Failed to save task', 'error') }
    finally { setSaving(false) }
  }

  const updateStatus = async (task, status) => {
    try { await api.put(`/api/pm/tasks/${task.id}`, { status }); loadTasks() }
    catch (e) { addToast(e.response?.data?.error || 'Failed to update status', 'error') }
  }

  const onDrop = (e, status) => {
    e.preventDefault()
    setDragOverCol(null)
    const taskId = parseInt(e.dataTransfer.getData('text/task-id'))
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== status) updateStatus(task, status)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  return (
    <div>
      <Breadcrumb items={[{ label: 'PM Dashboard', to: '/pm' }, { label: 'Tasks' }]} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Tasks ({tasks.length})</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={() => setView('board')} title="Board view"
              style={{ padding: '8px 10px', border: 'none', background: view === 'board' ? '#5B21B6' : '#fff', color: view === 'board' ? '#fff' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} title="List view"
              style={{ padding: '8px 10px', border: 'none', background: view === 'list' ? '#5B21B6' : '#fff', color: view === 'list' ? '#fff' : '#6B7280', cursor: 'pointer', display: 'flex' }}>
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <button onClick={openCreate}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
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
        {view === 'list' && (
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}
            style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}
          style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}>
          <option value="">All Priority</option>
          <option value="Low">Low</option><option value="Normal">Normal</option><option value="Medium">Medium</option><option value="High">High</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.overdue} onChange={e => setFilters({ ...filters, overdue: e.target.checked })} /> Overdue only
        </label>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
          <p style={{ fontSize: 15, margin: 0 }}>No tasks found</p>
        </div>
      ) : view === 'board' ? (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {BOARD_COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col)
            return (
              <div key={col}
                onDragOver={e => { e.preventDefault(); setDragOverCol(col) }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => onDrop(e, col)}
                style={{
                  minWidth: 240, width: 240, flexShrink: 0, background: dragOverCol === col ? '#F1F5F9' : '#F8FAFC',
                  borderRadius: 10, border: dragOverCol === col ? '2px dashed #5B3DF5' : '1px solid #E5E7EB', padding: 8,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 8px' }}>
                  <StatusBadge status={col} />
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 40 }}>
                  {colTasks.map(t => {
                    const pc = PRIORITY_COLORS[t.priority] || { bg: '#F3F4F6', text: '#6B7280' }
                    const overdue = t.due_date && new Date(t.due_date) < new Date() && !['APPROVED', 'COMPLETED'].includes(t.status)
                    return (
                      <div key={t.id} draggable
                        onDragStart={e => e.dataTransfer.setData('text/task-id', String(t.id))}
                        onClick={() => setDetailTask(t)}
                        style={{ background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', padding: '9px 10px', cursor: 'grab' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{t.title}</div>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF', marginBottom: 6 }}>{t.assigned_name || 'Unassigned'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ padding: '1.5px 7px', borderRadius: 8, fontSize: 9.5, fontWeight: 700, background: pc.bg, color: pc.text }}>{t.priority}</span>
                          {t.due_date && <span style={{ fontSize: 9.5, color: overdue ? '#DC2626' : '#9CA3AF', fontWeight: overdue ? 700 : 400 }}>{new Date(t.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                        </div>
                        {(t.checklist_count > 0 || t.comment_count > 0) && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: '#9CA3AF' }}>
                            {t.checklist_count > 0 && <span>☑ {t.checklist_completed}/{t.checklist_count}</span>}
                            {t.comment_count > 0 && <span>💬 {t.comment_count}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map(t => {
            const pc = PRIORITY_COLORS[t.priority] || { bg: '#F3F4F6', text: '#6B7280' }
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <select value={t.status} onChange={e => updateStatus(t, e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 11, background: '#fff', cursor: 'pointer' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', cursor: 'pointer' }} onClick={() => setDetailTask(t)}>{t.title}</div>
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

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{editTask ? 'Edit Task' : 'Create Task'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X className="w-5 h-5" /></button>
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
                  <option value="Low">Low</option><option value="Normal">Normal</option><option value="Medium">Medium</option><option value="High">High</option>
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
            {editTask && (
              <button onClick={() => { setShowForm(false); setDetailTask(editTask) }} type="button"
                style={{ padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Open checklist &amp; comments
              </button>
            )}
          </div>
        </Modal>
      )}

      {detailTask && (
        <TaskDetailDrawer task={detailTask} onClose={() => setDetailTask(null)} onChanged={loadTasks} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
