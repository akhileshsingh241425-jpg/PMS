import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  LayoutDashboard, FolderOpen, ListChecks, Calendar, FileText,
  Users, Bell, UserCircle, CheckSquare, Clock, MessageSquare,
  ExternalLink, Download, Upload, Plus, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Edit3, Trash2, File, Image, Archive,
  Play, Pause, Target, Briefcase, TrendingUp, Star,
} from 'lucide-react'

const STATUS_STYLES = {
  'Open': { bg: '#F3F4F6', text: '#6B7280' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF' },
  'Review': { bg: '#FEF3C7', text: '#92400E' },
  'Completed': { bg: '#D1FAE5', text: '#065F46' },
  'Pending': { bg: '#FEF3C7', text: '#92400E' },
  'Scheduled': { bg: '#DBEAFE', text: '#1E40AF' },
  'Ongoing': { bg: '#DBEAFE', text: '#1E40AF' },
  'Cancelled': { bg: '#FEE2E2', text: '#991B1B' },
}

const PRIORITY_STYLES = {
  'High': { bg: '#FEE2E2', text: '#DC2626' },
  'Medium': { bg: '#FEF3C7', text: '#D97706' },
  'Normal': { bg: '#F3F4F6', text: '#6B7280' },
  'Low': { bg: '#D1FAE5', text: '#059669' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDT(ds) {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(ds) {
  if (!ds) return '—'
  return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileIcon(type) {
  if (['jpg','jpeg','png','gif','webp','svg'].includes(type)) return Image
  if (['zip','rar','7z','gz'].includes(type)) return Archive
  return File
}

// ===== DASHBOARD =====
function Dashboard({ data }) {
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
  const { project_counts, task_counts, upcoming_meetings, today_tasks, overdue_tasks, notifications } = data

  const Card = ({ label, value, color, bg }) => (
    <div style={{ padding: '20px', background: bg || '#fff', borderRadius: 12, border: '1px solid #E2E8F0', flex: 1, minWidth: 140 }}>
      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: color || '#1F2937', margin: 0 }}>{value}</p>
    </div>
  )

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <Card label="Active Projects" value={project_counts.active} color="#3B82F6" bg="#EFF6FF" />
        <Card label="Total Tasks" value={task_counts.total} color="#6B7280" />
        <Card label="In Progress" value={task_counts.in_progress} color="#F59E0B" bg="#FFFBEB" />
        <Card label="Completed" value={task_counts.completed} color="#10B981" bg="#F0FDF4" />
        <Card label="Overdue" value={task_counts.overdue} color="#EF4444" bg="#FEF2F2" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Meetings */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>Upcoming Meetings</h3>
          {upcoming_meetings.length > 0 ? upcoming_meetings.slice(0, 4).map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Calendar className="w-4 h-4" style={{ color: '#5B3DF5', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{m.title}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{formatDT(m.meeting_date)}</p>
              </div>
              {m.meeting_link && (
                <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 10px', borderRadius: 6, background: '#059669', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                  Join
                </a>
              )}
            </div>
          )) : <p style={{ fontSize: 13, color: '#94A3B8' }}>No upcoming meetings</p>}
        </div>

        {/* Notifications */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>Recent Notifications</h3>
          {notifications.length > 0 ? notifications.slice(0, 4).map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <Bell className="w-4 h-4" style={{ color: n.is_read ? '#94A3B8' : '#5B3DF5', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{n.title}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{n.message} · {timeAgo(n.created_at)}</p>
              </div>
            </div>
          )) : <p style={{ fontSize: 13, color: '#94A3B8' }}>No notifications</p>}
        </div>

        {/* Overdue Tasks */}
        {overdue_tasks.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#991B1B', margin: '0 0 14px' }}>Overdue Tasks ({overdue_tasks.length})</h3>
            {overdue_tasks.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #FECACA' }}>
                <AlertCircle className="w-4 h-4" style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#991B1B', margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: '#B91C1C', margin: '2px 0 0' }}>Due: {formatDate(t.due_date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ===== MY PROJECTS =====
function MyProjects({ projects, onSelect }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>My Projects</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {projects.map(p => (
          <div key={p.id} onClick={() => onSelect(p)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen className="w-5 h-5" style={{ color: '#4F46E5' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: 0 }}>{p.title}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{p.account_name} · {p.pm_name}</p>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: STATUS_STYLES[p.stage]?.bg || '#F3F4F6', color: STATUS_STYLES[p.stage]?.text || '#6B7280' }}>{p.stage}</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#9CA3AF' }} />
          </div>
        ))}
        {projects.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No projects assigned</p>}
      </div>
    </div>
  )
}

// ===== PROJECT DETAIL =====
function ProjectDetail({ data, onBack }) {
  const [tab, setTab] = useState('overview')
  if (!data) return null
  const { project, tasks, team, documents, meetings } = data

  const TABS = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'tasks', label: 'Tasks', icon: ListChecks },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'meetings', label: 'Meetings', icon: Calendar },
  ]

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500, padding: '0 0 16px' }}>
        <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} /> Back to Projects
      </button>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderOpen className="w-5 h-5" style={{ color: '#4F46E5' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{project.title}</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>{project.account_name} · {project.proj_id}</p>
            </div>
            <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: STATUS_STYLES[project.stage]?.bg || '#F3F4F6', color: STATUS_STYLES[project.stage]?.text || '#6B7280' }}>{project.stage}</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', overflowX: 'auto' }}>
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px',
                border: 'none', borderBottom: active ? '2px solid #5B3DF5' : '2px solid transparent',
                background: active ? '#fff' : 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#5B3DF5' : '#64748B',
                whiteSpace: 'nowrap',
              }}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </div>
        <div style={{ padding: 24 }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Description</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{project.description || '—'}</p></div>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Project Manager</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{project.pm_name || '—'}</p></div>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Start Date</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{formatDate(project.start_date)}</p></div>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Target Date</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{formatDate(project.target_date)}</p></div>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Service Type</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{project.service_type || '—'}</p></div>
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10 }}><p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Team Size</p><p style={{ fontSize: 13, color: '#1F2937', margin: 0 }}>{team.length} members</p></div>
            </div>
          )}
          {tab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.length > 0 ? tasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_STYLES[t.priority]?.text || '#6B7280', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>Due: {formatDate(t.due_date)} · {t.priority}</p>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: STATUS_STYLES[t.status]?.bg || '#F3F4F6', color: STATUS_STYLES[t.status]?.text || '#6B7280' }}>{t.status}</span>
                </div>
              )) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: 30 }}>No tasks</p>}
            </div>
          )}
          {tab === 'team' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {team.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5' }}>{t.user_name?.[0]}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{t.user_name}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{t.designation || t.role_in_project || 'Team Member'}</p>
                  </div>
                </div>
              ))}
              {team.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 30 }}>No team members</p>}
            </div>
          )}
          {tab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {documents.map(d => {
                const Icon = getFileIcon(d.file_type)
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                    <Icon className="w-5 h-5" style={{ color: '#5B3DF5', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{d.file_name}</p>
                      <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{d.uploaded_by_name} · {timeAgo(d.uploaded_at)}</p>
                    </div>
                    <button onClick={() => { const a = document.createElement('a'); a.href = `/api/projects/documents/${d.id}`; a.target = '_blank'; a.click() }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#6B7280' }}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
              {documents.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 30 }}>No documents</p>}
            </div>
          )}
          {tab === 'meetings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meetings.map(m => (
                <div key={m.id} style={{ padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', margin: 0 }}>{m.title}</p>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: STATUS_STYLES[m.status]?.bg, color: STATUS_STYLES[m.status]?.text }}>{m.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{formatDT(m.meeting_date)}</p>
                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none' }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
                    </a>
                  )}
                </div>
              ))}
              {meetings.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 30 }}>No meetings</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== MY TASKS =====
function MyTasks({ data }) {
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data) {
      setTasks(data.tasks || [])
      setLoading(false)
    }
  }, [data])

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks
  const FILTERS = ['', 'Pending', 'In Progress', 'Review', 'Completed', 'overdue']

  if (selected) {
    return <TaskDetail taskId={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>My Tasks</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 8, border: filter === f ? '2px solid #5B3DF5' : '1px solid #D1D5DB', background: filter === f ? '#F5F3FF' : '#fff', color: filter === f ? '#5B3DF5' : '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            {f || 'All'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => (
          <div key={t.id} onClick={() => setSelected(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_STYLES[t.priority]?.text || '#6B7280', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{t.title}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>
                Due: {formatDate(t.due_date)} · {t.priority} · {t.checklist_completed}/{t.checklist_count} checklist
              </p>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: STATUS_STYLES[t.status]?.bg || '#F3F4F6', color: STATUS_STYLES[t.status]?.text || '#6B7280' }}>{t.status}</span>
            {t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed' && (
              <AlertCircle className="w-4 h-4" style={{ color: '#EF4444' }} />
            )}
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No tasks</p>}
      </div>
    </div>
  )
}

// ===== TASK DETAIL =====
function TaskDetail({ taskId, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/api/employee/tasks/${taskId}`).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(load, [taskId])

  const updateStatus = async (status) => {
    try {
      await api.put(`/api/employee/tasks/${taskId}/status`, { status })
      load()
    } catch(e) { alert('Failed to update status') }
  }

  const addChecklist = async () => {
    if (!newCheckItem.trim()) return
    try { await api.post(`/api/employee/tasks/${taskId}/checklist`, { text: newCheckItem }); setNewCheckItem(''); load() }
    catch(e) { alert('Failed') }
  }

  const toggleChecklist = async (item) => {
    try { await api.put(`/api/employee/checklist/${item.id}`, { is_completed: !item.is_completed }); load() }
    catch(e) { alert('Failed') }
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    try { await api.post(`/api/employee/tasks/${taskId}/comments`, { text: newComment }); setNewComment(''); load() }
    catch(e) { alert('Failed') }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>Failed to load</div>
  const { task, checklist, comments } = data

  const STATUS_ACTIONS = []
  if (task.status !== 'In Progress') STATUS_ACTIONS.push({ label: 'Start', status: 'In Progress', color: '#D97706', icon: Play })
  if (task.status !== 'Completed') STATUS_ACTIONS.push({ label: 'Complete', status: 'Completed', color: '#059669', icon: CheckCircle })
  if (task.status !== 'Review') STATUS_ACTIONS.push({ label: 'Review', status: 'Review', color: '#5B3DF5', icon: CheckSquare })

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500, padding: '0 0 16px' }}>
        <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} /> Back to Tasks
      </button>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{task.title}</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>{task.description || 'No description'}</p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: STATUS_STYLES[task.status]?.bg, color: STATUS_STYLES[task.status]?.text }}>{task.status}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {STATUS_ACTIONS.map(a => (
            <button key={a.status} onClick={() => updateStatus(a.status)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: a.color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Checklist */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 12px' }}>Checklist ({checklist.filter(i => i.is_completed).length}/{checklist.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {checklist.map(i => (
                <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: i.is_completed ? '#94A3B8' : '#1F2937', cursor: 'pointer', textDecoration: i.is_completed ? 'line-through' : 'none' }}>
                  <input type="checkbox" checked={i.is_completed} onChange={() => toggleChecklist(i)} style={{ accentColor: '#5B3DF5' }} />
                  {i.text}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Add checklist item..."
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none' }}
                onKeyDown={e => e.key === 'Enter' && addChecklist()} />
              <button onClick={addChecklist} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#5B3DF5', color: '#fff', cursor: 'pointer' }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 12px' }}>Comments ({comments.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {comments.map(c => (
                <div key={c.id} style={{ padding: '10px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>{c.author_name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{c.text}</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0' }}>{timeAgo(c.created_at)}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add comment..."
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none' }}
                onKeyDown={e => e.key === 'Enter' && addComment()} />
              <button onClick={addComment} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#5B3DF5', color: '#fff', cursor: 'pointer' }}>
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MEETINGS =====
function MeetingsView({ meetings, meetingRequests }) {
  const all = [
    ...(meetings || []).map(m => ({ ...m, _type: 'meeting', _date: m.meeting_date, _title: m.title, _status: m.status })),
    ...(meetingRequests || []).map(mr => ({ ...mr, _type: 'request', _date: mr.preferred_date, _title: mr.agenda, _status: mr.status, meeting_link: mr.meeting_link })),
  ].sort((a, b) => new Date(b._date) - new Date(a._date))

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Meetings</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {all.length > 0 ? all.map(m => (
          <div key={`${m._type}_${m.id}`} style={{ padding: '16px 20px', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar className="w-5 h-5" style={{ color: '#5B3DF5' }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: 0 }}>{m._title}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{formatDT(m._date)} {m._type === 'request' ? '(Request)' : ''}</p>
                </div>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: STATUS_STYLES[m._status]?.bg, color: STATUS_STYLES[m._status]?.text }}>{m._status}</span>
            </div>
            {m.description && <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px' }}>{m.description}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              {m.meeting_link && (
                <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 16px', borderRadius: 8, background: '#059669', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ExternalLink className="w-4 h-4" /> Join Meeting
                </a>
              )}
              {m.meeting_notes && (
                <span style={{ padding: '7px 16px', borderRadius: 8, background: '#F5F3FF', color: '#5B3DF5', fontSize: 12, fontWeight: 500 }}>Has Notes</span>
              )}
            </div>
          </div>
        )) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No meetings</p>}
      </div>
    </div>
  )
}

// ===== DOCUMENTS =====
function DocumentsView({ docs }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Documents</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {docs.length > 0 ? docs.map(d => {
          const Icon = getFileIcon(d.file_type)
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <Icon className="w-5 h-5" style={{ color: '#5B3DF5', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{d.file_name}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{d.uploaded_by_name || '—'} · {timeAgo(d.uploaded_at)}</p>
              </div>
              <button onClick={() => { const a = document.createElement('a'); a.href = `/api/projects/documents/${d.id}`; a.target = '_blank'; a.click() }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#6B7280' }}>
                <Download className="w-4 h-4" />
              </button>
            </div>
          )
        }) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No documents</p>}
      </div>
    </div>
  )
}

// ===== CALENDAR =====
function CalendarView({ events }) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date && e.date.startsWith(dateStr))
  }

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Calendar</h2>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1) }}
            style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>{monthName} {year}</h3>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1) }}
            style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13 }}>Next →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', padding: '8px 0' }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = getEventsForDay(day)
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div key={day} style={{ padding: '6px', borderRadius: 8, background: isToday ? '#EEF2FF' : 'transparent', border: isToday ? '1px solid #5B3DF5' : '1px solid transparent', minHeight: 60 }}>
                <p style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#5B3DF5' : '#1F2937', margin: '0 0 4px' }}>{day}</p>
                {dayEvents.slice(0, 2).map(e => (
                  <div key={e.id} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 3, marginBottom: 2, background: e.type === 'meeting' ? '#DBEAFE' : '#FEF3C7', color: e.type === 'meeting' ? '#1E40AF' : '#92400E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>+{dayEvents.length - 2}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===== TEAM =====
function TeamView({ teamData }) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Team</h2>
      {teamData?.reporting_manager && (
        <div style={{ padding: '16px 20px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 6px' }}>Reporting Manager</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {teamData.reporting_manager.full_name?.[0]}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: 0 }}>{teamData.reporting_manager.full_name}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{teamData.reporting_manager.designation || 'Manager'}</p>
            </div>
          </div>
        </div>
      )}
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 12px' }}>Team Members ({teamData?.team_members?.length || 0})</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(teamData?.team_members || []).map(m => (
          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5' }}>{m.user_name?.[0]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{m.user_name}</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>{m.designation || m.role_in_project || 'Team Member'}</p>
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{m.projects?.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== PERFORMANCE =====
function PerformanceView({ data }) {
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Performance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>Completion Rate</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10B981', margin: 0 }}>{data.completion_rate}%</p>
        </div>
        <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>On-Time Rate</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#5B3DF5', margin: 0 }}>{data.on_time_rate}%</p>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', margin: 0 }}>{data.total_tasks}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>Total Tasks</p>
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#10B981', margin: 0 }}>{data.completed_tasks}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>Completed</p>
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#EF4444', margin: 0 }}>{data.pending_overdue}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>Pending Overdue</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== NOTIFICATIONS =====
function NotificationsView({ data, onMarkRead }) {
  const [notifs, setNotifs] = useState([])
  useEffect(() => { if (data) setNotifs(data) }, [data])

  const markRead = async (id) => {
    try { await api.put(`/api/employee/notifications/${id}/read`); setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n)) }
    catch(e) {}
  }

  const markAllRead = async () => {
    try { await api.put('/api/employee/notifications/read-all'); setNotifs(notifs.map(n => ({ ...n, is_read: true }))) }
    catch(e) {}
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Notifications</h2>
        <button onClick={markAllRead} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Mark All Read</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notifs.length > 0 ? notifs.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
            style={{ display: 'flex', gap: 12, padding: '14px 18px', background: n.is_read ? '#fff' : '#F5F3FF', borderRadius: 10, border: n.is_read ? '1px solid #E2E8F0' : '1px solid #DDD6FE', cursor: 'pointer' }}>
            <Bell className="w-5 h-5" style={{ color: n.is_read ? '#94A3B8' : '#5B3DF5', flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#1F2937', margin: 0 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{n.message}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0' }}>{timeAgo(n.created_at)}</p>
            </div>
          </div>
        )) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No notifications</p>}
      </div>
    </div>
  )
}

// ===== PROFILE =====
function ProfileView({ user, onUpdate }) {
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({})
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' })

  useEffect(() => { if (user) setForm({ first_name: user.first_name, last_name: user.last_name || '', phone: user.phone || '', designation: user.designation || '', department: user.department || '', experience_years: user.experience_years || '' }) }, [user])

  const saveProfile = async () => {
    try { const r = await api.put('/api/employee/profile', form); onUpdate?.(r.data.user); setEdit(false) }
    catch(e) { alert('Failed to update') }
  }

  const changePassword = async () => {
    if (!pwForm.current_password || !pwForm.new_password) return alert('Fill all fields')
    if (pwForm.new_password.length < 8) return alert('Min 8 characters')
    try { await api.put('/api/employee/profile/password', pwForm); setPwForm({ current_password: '', new_password: '' }); alert('Password changed') }
    catch(e) { alert(e.response?.data?.error || 'Failed') }
  }

  if (!user) return null
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Profile</h2>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #5B3DF5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24 }}>
            {user.full_name?.[0]}
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{user.full_name}</h3>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{user.designation} · {user.department}</p>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: 24 }}>
          {!edit ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone || '—' },
                { label: 'Employee ID', value: user.emp_id || '—' },
                { label: 'Designation', value: user.designation || '—' },
                { label: 'Department', value: user.department || '—' },
                { label: 'Experience', value: user.experience_years ? `${user.experience_years} years` : '—' },
              ].map(f => (
                <div key={f.label} style={{ padding: 12, background: '#F8FAFC', borderRadius: 8 }}>
                  <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['first_name', 'last_name', 'phone', 'designation', 'department', 'experience_years'].map(f => (
                <div key={f}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.replace('_', ' ').toUpperCase()}</label>
                  <input value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {!edit ? (
              <button onClick={() => setEdit(true)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #5B3DF5', background: 'transparent', color: '#5B3DF5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit Profile</button>
            ) : (
              <>
                <button onClick={saveProfile} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#5B3DF5', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEdit(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#6B7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginTop: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1F2937', margin: '0 0 14px' }}>Change Password</h4>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current Password</label>
            <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
              style={{ padding: '8px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>New Password</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
              style={{ padding: '8px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', width: 180 }} /></div>
          <button onClick={changePassword} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#5B3DF5', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Update</button>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN PORTAL =====
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'projects', label: 'My Projects', icon: FolderOpen },
  { key: 'tasks', label: 'My Tasks', icon: ListChecks },
  { key: 'meetings', label: 'Meetings', icon: Calendar },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'calendar', label: 'Calendar', icon: Clock },
  { key: 'team', label: 'Team Collaboration', icon: Users },
  { key: 'performance', label: 'Performance', icon: CheckSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'profile', label: 'Profile', icon: UserCircle },
]

export default function EmployeePortal({ activeTab }) {
  const [tab, setTab] = useState(activeTab || 'dashboard')
  const [dashboardData, setDashboardData] = useState(null)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [meetings, setMeetings] = useState([])
  const [meetingRequests, setMeetingRequests] = useState([])
  const [docs, setDocs] = useState([])
  const [events, setEvents] = useState([])
  const [teamData, setTeamData] = useState(null)
  const [perfData, setPerfData] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [user, setUser] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectDetail, setProjectDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/employee/dashboard').then(r => setDashboardData(r.data)).catch(() => {}),
      api.get('/api/employee/projects').then(r => setProjects(r.data.projects || [])).catch(() => {}),
      api.get('/api/employee/tasks').then(r => setTasks(r.data.tasks || [])).catch(() => {}),
      api.get('/api/employee/meetings').then(r => { setMeetings(r.data.meetings || []); setMeetingRequests(r.data.meeting_requests || []) }).catch(() => {}),
      api.get('/api/employee/documents').then(r => setDocs(r.data.documents || [])).catch(() => {}),
      api.get('/api/employee/calendar').then(r => setEvents(r.data.events || [])).catch(() => {}),
      api.get('/api/employee/team').then(r => setTeamData(r.data)).catch(() => {}),
      api.get('/api/employee/performance').then(r => setPerfData(r.data)).catch(() => {}),
      api.get('/api/employee/notifications').then(r => setNotifs(r.data.notifications || [])).catch(() => {}),
      api.get('/api/auth/me').then(r => setUser(r.data.user)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(fetchAll, [])

  const openProject = async (project) => {
    try {
      const r = await api.get(`/api/employee/projects/${project.id}`)
      setProjectDetail(r.data)
      setSelectedProject(project.id)
    } catch(e) { alert('Failed to load project') }
  }

  const renderContent = () => {
    if (selectedProject && tab === 'projects') {
      return <ProjectDetail data={projectDetail} onBack={() => { setSelectedProject(null); setProjectDetail(null) }} />
    }

    switch (tab) {
      case 'dashboard': return <Dashboard data={dashboardData} />
      case 'projects': return <MyProjects projects={projects} onSelect={openProject} />
      case 'tasks': return <MyTasks data={{ tasks }} />
      case 'meetings': return <MeetingsView meetings={meetings} meetingRequests={meetingRequests} />
      case 'documents': return <DocumentsView docs={docs} />
      case 'calendar': return <CalendarView events={events} />
      case 'team': return <TeamView teamData={teamData} />
      case 'performance': return <PerformanceView data={perfData} />
      case 'notifications': return <NotificationsView data={notifs} />
      case 'profile': return <ProfileView user={user} onUpdate={(u) => setUser(u)} />
      default: return <Dashboard data={dashboardData} />
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map(t => {
          const active = t.key === tab
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedProject(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                borderRadius: 10, border: active ? '2px solid #5B3DF5' : '1px solid #E2E8F0',
                background: active ? '#F5F3FF' : '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#5B3DF5' : '#64748B',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading Employee Portal...</p>
        </div>
      ) : renderContent()}
    </div>
  )
}
