import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Briefcase, CheckSquare, Calendar } from 'lucide-react'

export default function MyWorkspacePage() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [meetings, setMeetings] = useState([])
  const [meetingRequests, setMeetingRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadProjects(), loadTasks(), loadMeetings()])
      .finally(() => setLoading(false))
  }, [])

  const loadProjects = async () => {
    try { const r = await api.get('/api/me/projects'); setProjects(r.data.projects) } catch (e) {}
  }
  const loadTasks = async () => {
    try { const r = await api.get('/api/me/tasks'); setTasks(r.data.tasks) } catch (e) {}
  }
  const loadMeetings = async () => {
    try { const r = await api.get('/api/me/meetings'); setMeetings(r.data.meetings || []); setMeetingRequests(r.data.meeting_requests || []) } catch (e) {}
  }

  const allMeetings = [
    ...meetings.map(m => ({ ...m, _type: 'meeting' })),
    ...meetingRequests.map(mr => ({ ...mr, _type: 'request', title: mr.agenda || 'Meeting Request', meeting_date: mr.preferred_date || mr.confirmed_date })),
  ].sort((a, b) => new Date(b.meeting_date || b.created_at) - new Date(a.meeting_date || a.created_at))

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>Loading...</div>

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 24 }}>My Workspace</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Projects */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Briefcase className="w-4 h-4" style={{ color: '#5B21B6' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>My Projects</h2>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{projects.length}</span>
          </div>
          {projects.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No projects assigned</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.slice(0, 8).map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: '#F9FAFB', borderRadius: 8,
                  textDecoration: 'none', transition: 'background 0.1s',
                }} onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                   onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{p.proj_id}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: p.stage === 'Completed' ? '#D1FAE5' : p.stage === 'On Hold' ? '#FEF3C7' : '#DBEAFE',
                    color: p.stage === 'Completed' ? '#065F46' : p.stage === 'On Hold' ? '#92400E' : '#1E40AF',
                  }}>{p.stage}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckSquare className="w-4 h-4" style={{ color: '#059669' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>My Tasks</h2>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{tasks.length}</span>
          </div>
          {tasks.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No tasks assigned</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.slice(0, 8).map(t => (
                <div key={t.id} style={{
                  padding: '10px 12px', background: '#F9FAFB', borderRadius: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{t.title}</div>
                    {t.project_name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.project_name}</div>}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: t.status === 'Completed' ? '#D1FAE5' : t.status === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                    color: t.status === 'Completed' ? '#065F46' : t.status === 'In Progress' ? '#1E40AF' : '#92400E',
                  }}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Meetings */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Calendar className="w-4 h-4" style={{ color: '#DB2777' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E' }}>Upcoming Meetings</h2>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>{allMeetings.length}</span>
          </div>
          {allMeetings.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>No meetings scheduled</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allMeetings.slice(0, 10).map(m => {
                const isReq = m._type === 'request'
                return (
                  <div key={`${m._type}-${m.id}`} style={{
                    padding: '10px 12px', background: '#F9FAFB', borderRadius: 8,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderLeft: `3px solid ${isReq ? '#D97706' : '#5B21B6'}`,
                    cursor: 'pointer',
                  }}
                    onClick={() => window.open(`/meetings?id=${m.id}&type=${isReq ? 'request' : 'meeting'}`, '_blank')}
                    onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                    onMouseOut={e => e.currentTarget.style.background = '#F9FAFB'}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{m.title}</span>
                        {isReq && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E' }}>REQUEST</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {m.meeting_date ? new Date(m.meeting_date).toLocaleString() : ''}
                        {m.project_name ? ` - ${m.project_name}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      background: m.status === 'Completed' ? '#D1FAE5' : '#DBEAFE',
                      color: m.status === 'Completed' ? '#065F46' : '#1E40AF',
                    }}>{m.status}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
