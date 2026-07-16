import { useState, useEffect } from 'react'
import api from '../services/api'
import {
  LayoutDashboard, FolderOpen, ListChecks, Calendar, FileText,
  Users, Bell, UserCircle, CheckSquare, Clock, MessageSquare,
  ExternalLink, Download, Upload, Plus, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Edit3, Trash2, File, Image, Archive,
  Play, Target, Star, TrendingUp, Briefcase, MapPin,
  ChevronLeft, Send, Paperclip, Filter, Search, MoreHorizontal,
  Sun, Moon, Gift, Zap, BarChart3, Activity, RefreshCw
} from 'lucide-react'

const STATUS_STYLES = {
  'Open': { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  'In Progress': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Review': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Completed': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Pending': { bg: '#FFFBEB', text: '#A16207', dot: '#EAB308' },
  'Scheduled': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Ongoing': { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
  'Cancelled': { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
  'Requested': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'Confirmed': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  'Rescheduled': { bg: '#FFFBEB', text: '#A16207', dot: '#EAB308' },
  'Created': { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  'Planning': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  'Kickoff': { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
  'Execution': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
}

const PRIORITY_STYLES = {
  'High': { bg: '#FEF2F2', text: '#DC2626', icon: '🔴' },
  'Medium': { bg: '#FFFBEB', text: '#D97706', icon: '🟡' },
  'Normal': { bg: '#F1F5F9', text: '#64748B', icon: '🟢' },
  'Low': { bg: '#F0FDF4', text: '#16A34A', icon: '🔵' },
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  if (['jpg','jpeg','png','gif','webp','svg'].includes(type)) return { Icon: Image, color: '#F97316', bg: '#FFF7ED' }
  if (['zip','rar','7z','gz'].includes(type)) return { Icon: Archive, color: '#6D28D9', bg: '#F5F3FF' }
  if (['pdf'].includes(type)) return { Icon: FileText, color: '#DC2626', bg: '#FEF2F2' }
  if (['doc','docx'].includes(type)) return { Icon: FileText, color: '#1D4ED8', bg: '#EFF6FF' }
  if (['xls','xlsx','csv'].includes(type)) return { Icon: FileText, color: '#15803D', bg: '#F0FDF4' }
  return { Icon: File, color: '#64748B', bg: '#F1F5F9' }
}

// ===== Styled Components =====
const pageTitle = { fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.5px' }
const pageSubtitle = { fontSize: 13, color: '#64748B', margin: '0 0 24px' }
const card = { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s' }
const cardHover = { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' }
const badge = (st) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 600, background: st?.bg || '#F1F5F9', color: st?.text || '#64748B',
})
const flexCenter = { display: 'flex', alignItems: 'center', justifyContent: 'center' }
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s', background: '#FAFAFA' }

// ===== DASHBOARD =====
function Dashboard({ data }) {
  if (!data) return <div style={{ padding: 80, textAlign: 'center', color: '#94A3B8' }}><div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} /><p>Loading dashboard...</p></div>
  const { project_counts, task_counts, upcoming_meetings, today_tasks, overdue_tasks, notifications } = data

  const statCards = [
    { label: 'Active Projects', value: project_counts.active, color: '#7C3AED', bg: '#F5F3FF', icon: Briefcase, change: `${project_counts.active} running` },
    { label: 'Total Tasks', value: task_counts.total, color: '#2563EB', bg: '#EFF6FF', icon: ListChecks, change: `${task_counts.completed} done` },
    { label: 'In Progress', value: task_counts.in_progress, color: '#D97706', bg: '#FFFBEB', icon: Play, change: `${task_counts.pending} pending` },
    { label: 'Completed', value: task_counts.completed, color: '#16A34A', bg: '#F0FDF4', icon: CheckCircle, change: `${task_counts.overdue} overdue` },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={pageTitle}>Dashboard</h1>
          <p style={pageSubtitle}>Here's what's happening with your work today</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{ ...card, padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: s.bg, opacity: 0.5 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, ...flexCenter }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                {s.change && <span style={{ fontSize: 11, color: '#94A3B8' }}>{s.change}</span>}
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{s.label}</p>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upcoming Meetings */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar className="w-4 h-4" style={{ color: '#7C3AED' }} /> Upcoming Meetings
            </h3>
            {upcoming_meetings.length > 0 && <span style={{ fontSize: 11, color: '#94A3B8' }}>{upcoming_meetings.length} scheduled</span>}
          </div>
          {upcoming_meetings.length > 0 ? upcoming_meetings.slice(0, 5).map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', ...flexCenter, flexShrink: 0 }}>
                <Calendar className="w-4 h-4" style={{ color: '#7C3AED' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{formatDT(m.meeting_date)}</p>
              </div>
              {m.meeting_link && (
                <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', fontSize: 11, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Join
                </a>
              )}
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>
              <Calendar className="w-10 h-10" style={{ margin: '0 auto 8px', color: '#E2E8F0' }} />
              <p style={{ margin: 0 }}>No upcoming meetings</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell className="w-4 h-4" style={{ color: '#7C3AED' }} /> Recent Notifications
            </h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, ...flexCenter }}>{notifications.filter(n => !n.is_read).length}</span>
            )}
          </div>
          {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? '#E2E8F0' : '#7C3AED', marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: '#0F172A', margin: 0 }}>{n.title}</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{n.message} · {timeAgo(n.created_at)}</p>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>
              <Bell className="w-10 h-10" style={{ margin: '0 auto 8px', color: '#E2E8F0' }} />
              <p style={{ margin: 0 }}>No notifications</p>
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        {overdue_tasks.length > 0 && (
          <div style={{ background: '#FEF2F2', borderRadius: 16, border: '1px solid #FECACA', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#991B1B', margin: 0 }}>Overdue Tasks ({overdue_tasks.length})</h3>
            </div>
            {overdue_tasks.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #FECACA' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#7F1D1D', margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: '#B91C1C', margin: '2px 0 0' }}>Due {formatDate(t.due_date)}</p>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={pageTitle}>My Projects</h1>
          <p style={pageSubtitle}>{projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {projects.map(p => {
          const st = STATUS_STYLES[p.stage] || STATUS_STYLES['Created']
          return (
            <div key={p.id} onClick={() => onSelect(p)} style={{ ...card, padding: 0, cursor: 'pointer', overflow: 'hidden' }}
              onMouseOver={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseOut={e => Object.assign(e.currentTarget.style, { boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transform: 'none' })}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: st.bg, ...flexCenter }}>
                    <FolderOpen className="w-5 h-5" style={{ color: st.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>{p.title}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{p.account_name}</p>
                  </div>
                  <span style={badge(st)}>{p.stage}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#64748B' }}>
                  <span>👤 {p.pm_name || '—'}</span>
                  <span>📅 {formatDate(p.target_date)}</span>
                </div>
              </div>
              <div style={{ height: 4, background: '#F1F5F9' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (p.team_count || 0) * 20)}%`, background: `linear-gradient(90deg, ${st.text}, ${st.text}88)`, borderRadius: '0 2px 2px 0' }} />
              </div>
            </div>
          )
        })}
        {projects.length === 0 && (
          <div style={{ ...card, padding: 60, textAlign: 'center', gridColumn: '1 / -1' }}>
            <Briefcase className="w-12 h-12" style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No projects assigned yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== PROJECT DETAIL =====
function ProjectDetail({ data, onBack }) {
  const [tab, setTab] = useState('overview')
  if (!data) return null
  const { project, tasks, team, documents, meetings } = data
  const st = STATUS_STYLES[project.stage] || STATUS_STYLES['Created']

  const tabs = [
    { key: 'overview', label: 'Overview', icon: FileText },
    { key: 'tasks', label: 'Tasks', icon: ListChecks, count: tasks.length },
    { key: 'team', label: 'Team', icon: Users, count: team.length },
    { key: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { key: 'meetings', label: 'Meetings', icon: Calendar, count: meetings.length },
  ]

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500, padding: '0 0 16px' }}>
        <ChevronLeft className="w-4 h-4" /> Back to Projects
      </button>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #F8FAFC, #FAFAFA)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: st.bg, ...flexCenter }}>
              <FolderOpen className="w-6 h-6" style={{ color: st.text }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>{project.title}</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>{project.account_name} · {project.proj_id}</p>
            </div>
            <span style={badge(st)}>{project.stage}</span>
          </div>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', overflowX: 'auto', padding: '0 8px' }}>
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', margin: '4px 2px',
                border: 'none', borderRadius: 8, background: active ? '#fff' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? '#7C3AED' : '#64748B', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>
                <t.icon className="w-4 h-4" /> {t.label}
                {t.count !== undefined && <span style={{ fontSize: 11, color: '#94A3B8' }}>({t.count})</span>}
              </button>
            )
          })}
        </div>
        <div style={{ padding: 24 }}>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Description', value: project.description || '—' },
                { label: 'Project Manager', value: project.pm_name || '—' },
                { label: 'Start Date', value: formatDate(project.start_date) },
                { label: 'Target Date', value: formatDate(project.target_date) },
                { label: 'Service Type', value: project.service_type || '—' },
                { label: 'Team Size', value: `${team.length} members` },
              ].map(f => (
                <div key={f.label} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.length > 0 ? tasks.map(t => {
                const ts = STATUS_STYLES[t.status] || STATUS_STYLES['Open']
                const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES['Normal']
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ps.text, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{t.title}</p>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: ps.bg, color: ps.text }}>{t.priority}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>Due {formatDate(t.due_date)} · {t.checklist_completed}/{t.checklist_count} done</p>
                    </div>
                    <span style={badge(ts)}>{t.status}</span>
                  </div>
                )
              }) : <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No tasks</p>}
            </div>
          )}
          {tab === 'team' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {team.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', ...flexCenter, color: '#fff', fontWeight: 700, fontSize: 15 }}>
                    {t.user_name?.[0] || '?'}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{t.user_name}</p>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{t.designation || t.role_in_project || 'Team Member'}</p>
                  </div>
                </div>
              ))}
              {team.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40, gridColumn: '1 / -1' }}>No team members</p>}
            </div>
          )}
          {tab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {documents.map(d => {
                const fi = getFileIcon(d.file_type)
                const Icon = fi.Icon
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: fi.bg, ...flexCenter }}>
                      <Icon className="w-4 h-4" style={{ color: fi.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{d.file_name}</p>
                      <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{d.uploaded_by_name} · {timeAgo(d.uploaded_at)}</p>
                    </div>
                    <button onClick={() => { const a = document.createElement('a'); a.href = `/api/projects/documents/${d.id}`; a.target = '_blank'; a.click() }}
                      style={{ background: fi.bg, border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: fi.color }}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
              {documents.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No documents</p>}
            </div>
          )}
          {tab === 'meetings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meetings.map(m => (
                <div key={m.id} style={{ padding: '16px 18px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Calendar className="w-4 h-4" style={{ color: '#7C3AED' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>{m.title}</p>
                    </div>
                    <span style={badge(STATUS_STYLES[m.status])}>{m.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 0 26px' }}>{formatDT(m.meeting_date)}</p>
                  {m.meeting_link && (
                    <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, margin: '8px 0 0 26px', fontSize: 12, fontWeight: 600, color: '#059669', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, background: '#F0FDF4' }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
                    </a>
                  )}
                </div>
              ))}
              {meetings.length === 0 && <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>No meetings</p>}
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

  useEffect(() => { if (data) setTasks(data.tasks || []) }, [data])

  const filtered = filter ? tasks.filter(t => filter === 'overdue' ? (t.status !== 'Completed' && t.due_date && new Date(t.due_date) < new Date()) : t.status === filter) : tasks
  const filters = [
    { key: '', label: 'All', count: tasks.length },
    { key: 'In Progress', label: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length },
    { key: 'Pending', label: 'Pending', count: tasks.filter(t => t.status === 'Open' || t.status === 'Pending').length },
    { key: 'Review', label: 'Review', count: tasks.filter(t => t.status === 'Review').length },
    { key: 'Completed', label: 'Completed', count: tasks.filter(t => t.status === 'Completed').length },
    { key: 'overdue', label: '⚠ Overdue', count: tasks.filter(t => t.status !== 'Completed' && t.due_date && new Date(t.due_date) < new Date()).length },
  ]

  if (selected) return <TaskDetail taskId={selected} onBack={() => setSelected(null)} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>My Tasks</h1>
          <p style={pageSubtitle}>{tasks.length} total · {tasks.filter(t => t.status === 'Completed').length} completed</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '8px 16px', borderRadius: 10, border: filter === f.key ? '2px solid #7C3AED' : '1.5px solid #E2E8F0', background: filter === f.key ? '#F5F3FF' : '#fff', color: filter === f.key ? '#7C3AED' : '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            {f.label} <span style={{ fontSize: 10, opacity: 0.6 }}>{f.count}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(t => {
          const ts = STATUS_STYLES[t.status] || STATUS_STYLES['Open']
          const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES['Normal']
          const isOverdue = t.status !== 'Completed' && t.due_date && new Date(t.due_date) < new Date()
          return (
            <div key={t.id} onClick={() => setSelected(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#fff', border: isOverdue ? '1.5px solid #FECACA' : '1px solid #E2E8F0', borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              onMouseOver={e => Object.assign(e.currentTarget.style, { boxShadow: '0 4px 16px rgba(0,0,0,0.06)', transform: 'translateY(-1px)' })}
              onMouseOut={e => Object.assign(e.currentTarget.style, { boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transform: 'none' })}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOverdue ? '#EF4444' : ps.text, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', margin: 0 }}>{t.title}</p>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: ps.bg, color: ps.text }}>{t.priority}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#64748B' }}>
                  <span>📅 {formatDate(t.due_date)}</span>
                  <span>📋 {t.checklist_completed}/{t.checklist_count}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.checklist_count > 0 ? (t.checklist_completed / t.checklist_count) * 100 : 0}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 3 }} />
                </div>
                <span style={badge(ts)}>{t.status}</span>
              </div>
              {isOverdue && <AlertCircle className="w-4 h-4" style={{ color: '#EF4444', flexShrink: 0 }} />}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ ...card, padding: 60, textAlign: 'center' }}>
            <CheckCircle className="w-12 h-12" style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No tasks{filter ? ` with status "${filter}"` : ''}</p>
          </div>
        )}
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

  const load = () => { setLoading(true); api.get(`/api/employee/tasks/${taskId}`).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(load, [taskId])

  const updateStatus = async (status) => { try { await api.put(`/api/employee/tasks/${taskId}/status`, { status }); load() } catch(e) { alert('Failed to update status') } }
  const addChecklist = async () => { if (!newCheckItem.trim()) return; try { await api.post(`/api/employee/tasks/${taskId}/checklist`, { text: newCheckItem }); setNewCheckItem(''); load() } catch(e) { alert('Failed') } }
  const toggleChecklist = async (item) => { try { await api.put(`/api/employee/checklist/${item.id}`, { is_completed: !item.is_completed }); load() } catch(e) { alert('Failed') } }
  const addComment = async () => { if (!newComment.trim()) return; try { await api.post(`/api/employee/tasks/${taskId}/comments`, { text: newComment }); setNewComment(''); load() } catch(e) { alert('Failed') } }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#94A3B8' }}><div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} /><p>Loading...</p></div>
  if (!data) return <div style={{ padding: 80, textAlign: 'center', color: '#DC2626' }}>Failed to load</div>
  const { task, checklist, comments } = data
  const ts = STATUS_STYLES[task.status] || STATUS_STYLES['Open']

  const actions = [
    task.status !== 'In Progress' && { label: 'Start', status: 'In Progress', color: '#D97706', icon: Play },
    task.status !== 'Review' && { label: 'Review', status: 'Review', color: '#7C3AED', icon: Target },
    task.status !== 'Completed' && { label: 'Complete', status: 'Completed', color: '#16A34A', icon: CheckCircle },
  ].filter(Boolean)

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500, padding: '0 0 16px' }}>
        <ChevronLeft className="w-4 h-4" /> Back to Tasks
      </button>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #FAFAFA, #fff)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{task.title}</h2>
              {task.description && <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{task.description}</p>}
            </div>
            <span style={badge(ts)}>{task.status}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {actions.map(a => (
              <button key={a.status} onClick={() => updateStatus(a.status)}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: a.color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.85'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                <a.icon className="w-4 h-4" /> {a.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Checklist */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare className="w-4 h-4" style={{ color: '#7C3AED' }} /> Checklist
                <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{checklist.filter(i => i.is_completed).length}/{checklist.length}</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {checklist.map(i => (
                  <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: i.is_completed ? '#F0FDF4' : '#F8FAFC', border: '1px solid', borderColor: i.is_completed ? '#BBF7D0' : '#E2E8F0', cursor: 'pointer', fontSize: 13, color: i.is_completed ? '#94A3B8' : '#0F172A', textDecoration: i.is_completed ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                    <input type="checkbox" checked={i.is_completed} onChange={() => toggleChecklist(i)} style={{ accentColor: '#7C3AED', width: 16, height: 16 }} />
                    {i.text}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} placeholder="Add item..." style={{ ...inputStyle, flex: 1, background: '#fff' }}
                  onKeyDown={e => e.key === 'Enter' && addChecklist()} />
                <button onClick={addChecklist} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', ...flexCenter }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare className="w-4 h-4" style={{ color: '#7C3AED' }} /> Comments
                <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{comments.length}</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', marginBottom: 14, paddingRight: 4 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7C3AED', ...flexCenter, color: '#fff', fontSize: 10, fontWeight: 700 }}>{c.author_name?.[0]}</div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', margin: 0 }}>{c.author_name}</p>
                      <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 'auto' }}>{timeAgo(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." style={{ ...inputStyle, flex: 1, background: '#fff' }}
                  onKeyDown={e => e.key === 'Enter' && addComment()} />
                <button onClick={addComment} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', ...flexCenter }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
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
    ...(meetings || []).map(m => ({ ...m, _type: 'Meeting', _date: m.meeting_date, _title: m.title, _status: m.status })),
    ...(meetingRequests || []).map(mr => ({ ...mr, _type: 'Request', _date: mr.preferred_date, _title: mr.agenda, _status: mr.status, meeting_link: mr.meeting_link })),
  ].sort((a, b) => new Date(b._date || 0) - new Date(a._date || 0))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Meetings</h1>
          <p style={pageSubtitle}>{all.length} meeting{all.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {all.length > 0 ? all.map(m => {
          const st = STATUS_STYLES[m._status] || STATUS_STYLES['Scheduled']
          return (
            <div key={`${m._type}_${m.id}`} style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: st.bg, ...flexCenter, flexShrink: 0 }}>
                  <Calendar className="w-5 h-5" style={{ color: st.text }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{m._title}</p>
                    {m._type === 'Request' && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#FFF7ED', color: '#C2410C' }}>Request</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{formatDT(m._date)}</p>
                </div>
                <span style={badge(st)}>{m._status}</span>
              </div>
              {m.description && <p style={{ fontSize: 12, color: '#64748B', margin: '10px 0 0' }}>{m.description}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {m.meeting_link && (
                  <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink className="w-4 h-4" /> Join Meeting
                  </a>
                )}
                {m.meeting_notes && (
                  <span style={{ padding: '8px 18px', borderRadius: 10, background: '#F5F3FF', color: '#7C3AED', fontSize: 12, fontWeight: 500 }}>Has Notes</span>
                )}
              </div>
            </div>
          )
        }) : (
          <div style={{ ...card, padding: 60, textAlign: 'center' }}>
            <Calendar className="w-12 h-12" style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No meetings yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== DOCUMENTS =====
function DocumentsView({ docs }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Documents</h1>
          <p style={pageSubtitle}>{docs.length} file{docs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {docs.length > 0 ? docs.map(d => {
          const fi = getFileIcon(d.file_type)
          const Icon = fi.Icon
          return (
            <div key={d.id} style={{ ...card, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: fi.bg, ...flexCenter, flexShrink: 0 }}>
                  <Icon className="w-5 h-5" style={{ color: fi.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.file_name}</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{d.uploaded_by_name || '—'} · {timeAgo(d.uploaded_at)}</p>
                </div>
              </div>
              <button onClick={() => { const a = document.createElement('a'); a.href = `/api/projects/documents/${d.id}`; a.target = '_blank'; a.click() }}
                style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FAFAFA', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          )
        }) : (
          <div style={{ ...card, padding: 60, textAlign: 'center', gridColumn: '1 / -1' }}>
            <FileText className="w-12 h-12" style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No documents</p>
          </div>
        )}
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
  const getEventsForDay = (day) => { const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; return events.filter(e => e.date && e.date.startsWith(ds)) }

  return (
    <div>
      <h1 style={pageTitle}>Calendar</h1>
      <p style={pageSubtitle}>{events.length} event{events.length !== 1 ? 's' : ''} this month</p>
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y-1) } else setMonth(month-1) }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748B' }}>← Prev</button>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: 0 }}>{monthName} {year}</h3>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y+1) } else setMonth(month+1) }}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#64748B' }}>Next →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '8px 0', textAlign: 'center' }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = getEventsForDay(day)
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <div key={day} style={{ padding: 6, borderRadius: 10, background: isToday ? '#F5F3FF' : 'transparent', border: isToday ? '1.5px solid #7C3AED' : '1px solid transparent', minHeight: 56, position: 'relative' }}>
                <p style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? '#7C3AED' : '#0F172A', margin: '0 0 4px' }}>{day}</p>
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, marginBottom: 2, background: e.type === 'meeting' ? '#EFF6FF' : '#FFF7ED', color: e.type === 'meeting' ? '#1D4ED8' : '#C2410C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <p style={{ fontSize: 9, color: '#94A3B8', margin: 0, textAlign: 'center' }}>+{dayEvents.length - 3}</p>}
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
      <h1 style={pageTitle}>Team Collaboration</h1>
      <p style={pageSubtitle}>Your team members and reporting manager</p>
      {teamData?.reporting_manager && (
        <div style={{ padding: 20, background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', border: '1px solid #DDD6FE', borderRadius: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reporting Manager</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', ...flexCenter, color: '#fff', fontWeight: 700, fontSize: 18 }}>
              {teamData.reporting_manager.full_name?.[0]}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{teamData.reporting_manager.full_name}</p>
              <p style={{ fontSize: 12, color: '#6D28D9', margin: '2px 0 0' }}>{teamData.reporting_manager.designation || 'Manager'}</p>
            </div>
          </div>
        </div>
      )}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 14px' }}>Team ({teamData?.team_members?.length || 0})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {(teamData?.team_members || []).map(m => (
          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', ...flexCenter, color: '#fff', fontWeight: 700, fontSize: 16 }}>
              {m.user_name?.[0] || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{m.user_name}</p>
              <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{m.designation || 'Team Member'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== PERFORMANCE =====
function PerformanceView({ data }) {
  if (!data) return <div style={{ padding: 80, textAlign: 'center', color: '#94A3B8' }}><div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} /><p>Loading...</p></div>
  return (
    <div>
      <h1 style={pageTitle}>Performance</h1>
      <p style={pageSubtitle}>Your work stats and task completion rate</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...card, padding: 24, background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' }}>
          <p style={{ fontSize: 11, color: '#15803D', fontWeight: 600, margin: '0 0 4px' }}>Task Completion Rate</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#15803D', margin: 0 }}>{data.completion_rate}%</p>
            <span style={{ fontSize: 12, color: '#16A34A' }}>of tasks done</span>
          </div>
          <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#BBF7D0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${data.completion_rate}%`, background: 'linear-gradient(90deg, #16A34A, #22C55E)', borderRadius: 4 }} />
          </div>
        </div>
        <div style={{ ...card, padding: 24, background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}>
          <p style={{ fontSize: 11, color: '#6D28D9', fontWeight: 600, margin: '0 0 4px' }}>On-Time Delivery Rate</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#6D28D9', margin: 0 }}>{data.on_time_rate}%</p>
            <span style={{ fontSize: 12, color: '#7C3AED' }}>on-time</span>
          </div>
          <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: '#DDD6FE', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${data.on_time_rate}%`, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { label: 'Total', value: data.total_tasks, color: '#0F172A', bg: '#F1F5F9' },
            { label: 'Completed', value: data.completed_tasks, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'On Time', value: data.completed_on_time, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Overdue', value: data.pending_overdue, color: '#DC2626', bg: '#FEF2F2' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px 12px', borderRadius: 12, background: s.bg }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===== NOTIFICATIONS =====
function NotificationsView({ data }) {
  const [notifs, setNotifs] = useState([])
  useEffect(() => { if (data) setNotifs(data) }, [data])
  const markRead = async (id) => { try { await api.put(`/api/employee/notifications/${id}/read`); setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n)) } catch(e) {} }
  const markAllRead = async () => { try { await api.put('/api/employee/notifications/read-all'); setNotifs(notifs.map(n => ({ ...n, is_read: true }))) } catch(e) {} }
  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={pageTitle}>Notifications</h1>
          <p style={pageSubtitle}>{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        <button onClick={markAllRead} style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle className="w-4 h-4" /> Mark All Read
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {notifs.length > 0 ? notifs.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{ ...card, padding: '16px 20px', cursor: 'pointer', border: n.is_read ? '1px solid #E2E8F0' : '1px solid #DDD6FE', background: n.is_read ? '#fff' : '#F5F3FF' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: n.is_read ? '#E2E8F0' : '#7C3AED', marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#0F172A', margin: 0 }}>{n.title}</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 4px' }}>{n.message}</p>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ ...card, padding: 60, textAlign: 'center' }}>
            <Bell className="w-12 h-12" style={{ color: '#E2E8F0', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>No notifications</p>
          </div>
        )}
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

  const saveProfile = async () => { try { const r = await api.put('/api/employee/profile', form); onUpdate(r.data.user); setEdit(false) } catch(e) { alert('Failed') } }
  const changePassword = async () => { if (!pwForm.current_password || !pwForm.new_password) return alert('Fill all fields'); if (pwForm.new_password.length < 8) return alert('Min 8 chars'); try { await api.put('/api/employee/profile/password', pwForm); setPwForm({ current_password: '', new_password: '' }); alert('Password changed') } catch(e) { alert(e.response?.data?.error || 'Failed') } }

  if (!user) return null
  const initials = (user.full_name || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div>
      <h1 style={pageTitle}>Profile</h1>
      <p style={pageSubtitle}>Manage your personal information</p>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: 32, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', ...flexCenter, fontSize: 28, fontWeight: 800, border: '3px solid rgba(255,255,255,0.4)' }}>
              {initials}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{user.full_name}</h2>
              <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>{user.designation} · {user.department}</p>
              <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0' }}>{user.email} · {user.emp_id || ''}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {!edit ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'Email', value: user.email },
                { label: 'Phone', value: user.phone || '—' },
                { label: 'Employee ID', value: user.emp_id || '—' },
                { label: 'Designation', value: user.designation || '—' },
                { label: 'Department', value: user.department || '—' },
                { label: 'Experience', value: user.experience_years ? `${user.experience_years} years` : '—' },
              ].map(f => (
                <div key={f.label} style={{ padding: 14, background: '#F8FAFC', borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 4px' }}>{f.label}</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {['first_name', 'last_name', 'phone', 'designation', 'department', 'experience_years'].map(f => (
                <div key={f}><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                  <input value={form[f] || ''} onChange={e => setForm({ ...form, [f]: e.target.value })} style={inputStyle} /></div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {!edit ? (
              <button onClick={() => setEdit(true)} style={{ padding: '10px 24px', borderRadius: 10, border: '2px solid #7C3AED', background: 'transparent', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Edit3 className="w-4 h-4" style={{ marginRight: 6, display: 'inline' }} /> Edit Profile
              </button>
            ) : (
              <>
                <button onClick={saveProfile} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEdit(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ ...card, padding: 24, marginTop: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Change Password</h4>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current</label>
            <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} style={{ ...inputStyle, width: 200 }} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>New</label>
            <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} style={{ ...inputStyle, width: 200 }} /></div>
          <button onClick={changePassword} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Update</button>
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
  { key: 'team', label: 'Team', icon: Users },
  { key: 'performance', label: 'Performance', icon: TrendingUp },
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
    try { const r = await api.get(`/api/employee/projects/${project.id}`); setProjectDetail(r.data); setSelectedProject(project.id) }
    catch(e) { alert('Failed to load project') }
  }

  const renderContent = () => {
    if (selectedProject && tab === 'projects') return <ProjectDetail data={projectDetail} onBack={() => { setSelectedProject(null); setProjectDetail(null) }} />
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map(t => {
          const active = t.key === tab
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedProject(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                borderRadius: 10, border: active ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                background: active ? '#F5F3FF' : '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#7C3AED' : '#64748B',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading Employee Portal...</p>
        </div>
      ) : renderContent()}
    </div>
  )
}
