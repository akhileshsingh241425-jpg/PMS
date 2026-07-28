import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  FolderOpen, ListChecks, Users, Calendar, AlertCircle,
  Clock, CheckCircle, XCircle, Activity, Bell, ExternalLink,
  Timer, UserX, FileWarning,
} from 'lucide-react'

const formatDT = (ds) => {
  if (!ds) return '—'
  const d = new Date(ds)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', margin: 0 }}>{value}</p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>{label}</p>
      </div>
    </div>
  )
}

export default function PMDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/pm/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#5B3DF5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
    </div>
  )

  const s = data?.stats || {}
  const health = data?.project_health || {}

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: '0 0 10px' }}>PM Dashboard</h1>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 10 }}>
        <StatCard icon={FolderOpen} label="Active Projects" value={s.active_projects || 0} color="#3B82F6" bg="#EFF6FF" />
        <StatCard icon={ListChecks} label="Total Tasks" value={s.total_tasks || 0} color="#8B5CF6" bg="#F5F3FF" />
        <StatCard icon={Users} label="Team Members" value={s.team_members || 0} color="#10B981" bg="#F0FDF4" />
        <StatCard icon={Calendar} label="Upcoming Meetings" value={s.upcoming_meetings || 0} color="#F59E0B" bg="#FEF3C7" />
      </div>

      {/* Project Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity className="w-4 h-4" /> Project Health
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, padding: '14px', background: '#F0FDF4', borderRadius: 10, textAlign: 'center', border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#059669', margin: 0 }}>{health.on_track || 0}</p>
              <p style={{ fontSize: 12, color: '#065F46', margin: '4px 0 0' }}>On Track</p>
            </div>
            <div style={{ flex: 1, padding: '14px', background: '#FEF3C7', borderRadius: 10, textAlign: 'center', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#D97706', margin: 0 }}>{health.at_risk || 0}</p>
              <p style={{ fontSize: 12, color: '#92400E', margin: '4px 0 0' }}>At Risk</p>
            </div>
            <div style={{ flex: 1, padding: '14px', background: '#FEE2E2', borderRadius: 10, textAlign: 'center', border: '1px solid #FECACA' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', margin: 0 }}>{health.delayed || 0}</p>
              <p style={{ fontSize: 12, color: '#991B1B', margin: '4px 0 0' }}>Delayed</p>
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#DC2626' }} /> Overdue Tasks
          </h3>
          {data?.overdue_tasks?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.overdue_tasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => navigate('/pm/tasks')}>
                  <span style={{ fontWeight: 500 }}>{t.title}</span>
                  <span style={{ color: '#DC2626', fontSize: 11 }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20, margin: 0 }}>
              <CheckCircle className="w-8 h-8" style={{ margin: '0 auto 6px', color: '#D1D5DB' }} />
              No overdue tasks
            </p>
          )}
        </div>
      </div>

      {/* Bottom Row: Pending Approvals + Upcoming Meetings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} /> Pending Approvals
          </h3>
          {data?.pending_approvals?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.pending_approvals.slice(0, 5).map(t => (
                <div key={t.id} style={{ fontSize: 12, color: '#374151', display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span>{t.title}</span>
                  <span style={{ color: '#6B7280' }}>{t.assigned_name || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20, margin: 0 }}>No pending approvals</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar className="w-4 h-4" style={{ color: '#3B82F6' }} /> Upcoming Meetings
          </h3>
          {data?.upcoming_meetings?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.upcoming_meetings.slice(0, 5).map(m => (
                <div key={`${m._type}-${m.id}`} style={{ fontSize: 12, color: '#374151', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => navigate(`/pm/meeting-detail?id=${m.id}&type=${m._type}`)}>
                  <span style={{ fontWeight: 500 }}>{m.title || m.agenda}</span>
                  <span style={{ color: '#6B7280' }}>{formatDT(m.meeting_date || m.preferred_date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20, margin: 0 }}>No upcoming meetings</p>
          )}
        </div>
      </div>

      {/* Deadline Risk + Team Today */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Timer className="w-4 h-4" style={{ color: '#DC2626' }} /> Deadline Risk (next 7 days)
          </h3>
          {data?.deadline_risk?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.deadline_risk.map(p => (
                <div key={p.project_id} onClick={() => navigate(`/pm/projects/${p.project_id}`)}
                  style={{ fontSize: 12, color: '#374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 500 }}>{p.title}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: p.days_left < 0 ? '#FEE2E2' : p.days_left <= 2 ? '#FFEDD5' : '#FEF3C7',
                    color: p.days_left < 0 ? '#991B1B' : p.days_left <= 2 ? '#9A3412' : '#92400E',
                  }}>
                    {p.days_left < 0 ? `${Math.abs(p.days_left)}d overdue` : p.days_left === 0 ? 'Due today' : `${p.days_left}d left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20, margin: 0 }}>Nothing due in the next 7 days</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users className="w-4 h-4" style={{ color: '#059669' }} /> Team Today
            </h3>
            <button onClick={() => navigate('/pm/team')} style={{ fontSize: 11.5, color: '#5B3DF5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View team →</button>
          </div>
          {data?.team_today?.total > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, textAlign: 'center', background: '#ECFDF5', borderRadius: 8, padding: '8px 4px' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#059669', margin: 0 }}>{data.team_today.present}</p>
                  <p style={{ fontSize: 10.5, color: '#065F46', margin: 0 }}>Present</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#FFFBEB', borderRadius: 8, padding: '8px 4px' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#92400E', margin: 0 }}>{data.team_today.on_leave}</p>
                  <p style={{ fontSize: 10.5, color: '#92400E', margin: 0 }}>On Leave</p>
                </div>
                <div style={{ flex: 1, textAlign: 'center', background: '#FEF2F2', borderRadius: 8, padding: '8px 4px' }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#B91C1C', margin: 0 }}>{data.team_today.absent}</p>
                  <p style={{ fontSize: 10.5, color: '#991B1B', margin: 0 }}>Absent</p>
                </div>
              </div>
              {data.team_today.missing_work_log.length > 0 && (
                <div style={{ fontSize: 11.5, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: data.team_today.absent_today.length ? 6 : 0 }}>
                  <FileWarning className="w-3.5 h-3.5" /> {data.team_today.missing_work_log.length} present but haven't filed today's work log
                </div>
              )}
              {data.team_today.absent_today.length > 0 && (
                <div style={{ fontSize: 11.5, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserX className="w-3.5 h-3.5" /> {data.team_today.absent_today.map(m => m.name).join(', ')}
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20, margin: 0 }}>No team members assigned yet</p>
          )}
        </div>
      </div>

      {/* Notifications */}
      {data?.notifications?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px', marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell className="w-4 h-4" style={{ color: '#F59E0B' }} /> Alerts
          </h3>
          {data.notifications.map(n => (
            <div key={n.id} style={{ fontSize: 13, color: '#374151', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
              {n.message || n.title}
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
