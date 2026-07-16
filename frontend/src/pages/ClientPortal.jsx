import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import {
  Building2, FileText, MessageSquare, Send, Calendar, LogOut,
  ChevronLeft, Upload, HelpCircle, User, Briefcase, Shield,
  Clock, CheckCircle, Bell, AlertCircle, Mail, Phone, ArrowRight,
  Plus, X, Download, Eye, Paperclip, ExternalLink
} from 'lucide-react'

const getToken = () => localStorage.getItem('client_token')
const authHeader = () => ({ headers: { Authorization: `Bearer ${getToken()}` } })

const STAGE_COLORS = {
  'Created': { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
  'Planning': { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  'In Progress': { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  'Execution': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Completed': { bg: '#D1FAE5', text: '#065F46', dot: '#22C55E' },
  'Closed': { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  'On Hold': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
}

// ═══ CLIENT LOGIN ═══
export function ClientLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (getToken()) { navigate('/client-portal'); return null }

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/api/portal/login', { email, password })
      localStorage.setItem('client_token', res.data.token)
      localStorage.setItem('client_user', JSON.stringify(res.data.user))
      navigate('/client-portal')
    } catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1E40AF 100%)',
      padding: '16px', fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{ display: 'flex', borderRadius: '20px', overflow: 'hidden', maxWidth: '900px', width: '100%', background: '#fff', boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>
        <div style={{
          flex: 1, background: 'linear-gradient(135deg, #1E3A5F, #1E40AF)',
          padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          color: '#fff',
        }} className="login-brand">
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <Shield className="w-7 h-7" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Client Portal</h1>
          <p style={{ fontSize: '14px', opacity: 0.8, margin: '0 0 32px', lineHeight: 1.6 }}>
            Track your projects, view reports, and communicate with the INFOCUS-IT team in real time.
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
            {[
              { icon: Briefcase, text: 'Real-time project tracking' },
              { icon: FileText, text: 'Access reports & documents' },
              { icon: MessageSquare, text: 'Direct team communication' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span style={{ fontSize: '13px', opacity: 0.9 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '8px' }}>
            <Shield className="w-8 h-8" style={{ color: '#1E40AF' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Welcome back</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px' }}>Sign in to your client portal</p>
          {error && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#1E40AF'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                placeholder="you@company.com" />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#1E40AF'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1E40AF, #1E3A5F)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity .2s' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '24px' }}>
            Internal employee? <a href="/login" style={{ color: '#1E40AF', fontWeight: 600, textDecoration: 'none' }}>Employee Login</a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══ CLIENT PORTAL MAIN ═══
export function ClientPortalDashboard() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [projects, setProjects] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [queries, setQueries] = useState([])
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) { window.location.href = '/client-login'; return }
    api.get('/api/portal/me', authHeader()).then(r => { setUser(r.data.user); localStorage.setItem('client_user', JSON.stringify(r.data.user)) }).catch(() => logout())
    loadDashboard(); loadProjects(); loadMeetings(); loadQueries()
  }, [])

  const handleErr = (e) => { if (e.response?.status === 401) logout() }
  const loadDashboard = async () => { try { const r = await api.get('/api/portal/dashboard', authHeader()); setDashboard(r.data) } catch(e) { handleErr(e) } }
  const loadProjects = async () => { try { const r = await api.get('/api/portal/projects', authHeader()); setProjects(r.data.projects) } catch(e) { handleErr(e) } }
  const loadMeetings = async () => { try { const r = await api.get('/api/portal/meetings', authHeader()); setMeetings(r.data.meetings) } catch(e) { handleErr(e) } }
  const loadQueries = async () => { try { const r = await api.get('/api/portal/queries', authHeader()); setQueries(r.data.queries) } catch(e) { handleErr(e) } }

  const logout = () => { localStorage.removeItem('client_token'); localStorage.removeItem('client_user'); navigate('/client-login') }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'queries', label: 'Queries', icon: HelpCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield className="w-4 h-4" style={{ color: '#93C5FD' }} />
            </div>
            <span style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>Client Portal</span>
            <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: '#93C5FD', fontSize: '13px' }}>{user?.client_company_name || user?.company_name || ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#93C5FD' }}>
              {(user?.name || '?')[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>{user?.name || ''}</span>
            <button onClick={logout} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#FCA5A5' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8' }}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedProject(null); setSelectedMeeting(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px', padding: '12px 18px', fontSize: '13px', fontWeight: active ? 600 : 500,
                  border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: active ? '#1E40AF' : '#64748B', borderBottom: active ? '2.5px solid #1E40AF' : '2.5px solid transparent',
                  transition: 'all .15s',
                }}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* DASHBOARD */}
        {tab === 'dashboard' && dashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Welcome, {user?.name}</h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Here's an overview of your projects and activities</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Active Projects', value: dashboard.active_projects, icon: Briefcase, bg: '#EDE9FE', color: '#5B21B6' },
                { label: 'Total Projects', value: dashboard.total_projects, icon: CheckCircle, bg: '#D1FAE5', color: '#059669' },
                { label: 'Upcoming Meetings', value: dashboard.upcoming_meetings, icon: Calendar, bg: '#DBEAFE', color: '#1E40AF' },
                { label: 'Open Queries', value: dashboard.open_queries, icon: HelpCircle, bg: '#FEF3C7', color: '#D97706' },
              ].map((card, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', lineHeight: 1.2 }}>{card.value}</p>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>{card.label}</p>
                </div>
              ))}
            </div>

            {dashboard.projects?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase className="w-4 h-4" style={{ color: '#1E40AF' }} /> Active Projects
                  </h3>
                  <button onClick={() => setTab('projects')} style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div style={{ padding: '8px' }}>
                  {dashboard.projects.map((p, i) => {
                    const sc = STAGE_COLORS[p.stage] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
                    return (
                      <div key={p.id} onClick={() => { setTab('projects'); setSelectedProject(p) }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'background .15s', marginBottom: i < dashboard.projects.length - 1 ? '4px' : 0 }}
                        onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>{p.proj_id} · {p.service_type} · PM: {p.pm_name || '—'}</p>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.text, whiteSpace: 'nowrap', flexShrink: 0 }}>{p.stage}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROJECTS LIST */}
        {tab === 'projects' && !selectedProject && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Your Projects</h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
              </div>
            </div>
            {projects.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '60px 20px', textAlign: 'center' }}>
                <Briefcase className="w-12 h-12" style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>No projects yet</p>
                <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Projects assigned to your account will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {projects.map((p, i) => {
                  const sc = STAGE_COLORS[p.stage] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }
                  return (
                    <div key={p.id} onClick={() => setSelectedProject(p)}
                      style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px', cursor: 'pointer', transition: 'all .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,64,175,0.1)' }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase className="w-4 h-4" style={{ color: sc.text }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>{p.title}</p>
                            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>{p.proj_id} · {p.service_type || '—'}</p>
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sc.bg, color: sc.text, whiteSpace: 'nowrap', flexShrink: 0 }}>{p.stage}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#64748B' }}>
                        {p.pm_name && <div><span style={{ color: '#94A3B8' }}>PM</span><br />{p.pm_name}</div>}
                        {p.start_date && <div><span style={{ color: '#94A3B8' }}>Started</span><br />{p.start_date?.slice(0, 10)}</div>}
                        {p.target_date && <div><span style={{ color: '#94A3B8' }}>Target</span><br />{p.target_date?.slice(0, 10)}</div>}
                        {p.updated_at && <div><span style={{ color: '#94A3B8' }}>Updated</span><br />{p.updated_at?.slice(0, 10)}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PROJECT DETAIL */}
        {tab === 'projects' && selectedProject && <ProjectDetailView projectId={selectedProject.id} user={user} onBack={() => setSelectedProject(null)} onRefresh={loadQueries} />}

        {/* MEETINGS */}
        {tab === 'meetings' && !selectedMeeting && <MeetingsView meetings={meetings} projects={projects} user={user} onRefresh={loadMeetings} onSelect={setSelectedMeeting} />}
        {tab === 'meetings' && selectedMeeting && <MeetingDetailView meetingId={selectedMeeting.id} user={user} onBack={() => setSelectedMeeting(null)} onRefresh={loadMeetings} />}

        {/* QUERIES */}
        {tab === 'queries' && <QueriesView queries={queries} projects={projects} user={user} onRefresh={loadQueries} />}

        {/* PROFILE */}
        {tab === 'profile' && <ProfileView user={user} onUpdate={u => { setUser(u); localStorage.setItem('client_user', JSON.stringify(u)) }} />}
      </main>
    </div>
  )
}

// ═══ PROJECT DETAIL ═══
function ProjectDetailView({ projectId, user, onBack, onRefresh }) {
  const [data, setData] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showRevForm, setShowRevForm] = useState(false)
  const [revDocId, setRevDocId] = useState(null)
  const [revComment, setRevComment] = useState('')
  const fileRef = useRef(null)
  const toast = useToast()

  useEffect(() => { load() }, [projectId])
  const load = async () => { try { const r = await api.get(`/api/portal/projects/${projectId}`, authHeader()); setData(r.data) } catch(e){} }

  const addNote = async (e) => { e.preventDefault(); if(!noteText.trim()) return; setSending(true); try { await api.post(`/api/portal/projects/${projectId}/notes`, { content: noteText }, authHeader()); setNoteText(''); load() } catch(e){ toast(e.response?.data?.error||'Failed', 'error') } finally{setSending(false)} }

  const uploadDoc = async (file) => {
    setUploading(true)
    try { const fd = new FormData(); fd.append('file', file); fd.append('category', 'Evidence'); await api.post(`/api/portal/projects/${projectId}/uploads`, fd, { headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' } }); load() }
    catch(e){ toast(e.response?.data?.error||'Upload failed', 'error') } finally{setUploading(false)}
  }

  const submitRevision = async () => {
    if(!revComment.trim()) return
    try { await api.post('/api/portal/revision-requests', { document_id: revDocId, comments: revComment }, authHeader()); setShowRevForm(false); setRevComment(''); onRefresh() }
    catch(e){ toast(e.response?.data?.error||'Failed', 'error') }
  }

  if(!data) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#1E40AF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ fontSize: '14px', color: '#94A3B8' }}>Loading project details...</p>
    </div>
  )
  const { project, documents, notes, client_uploads } = data
  const sc = STAGE_COLORS[project.stage] || { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}
        onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A' }}
        onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748B' }}>
        <ChevronLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Project Info Card */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase className="w-5 h-5" style={{ color: sc.text }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{project.title}</h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{project.proj_id} · {project.service_type} · PM: {project.pm_name || '—'}</p>
              </div>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{project.stage}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', padding: '16px 0', borderTop: '1px solid #F1F5F9' }}>
            {[
              { label: 'Start Date', value: project.start_date?.slice(0, 10) || '—' },
              { label: 'Target Date', value: project.target_date?.slice(0, 10) || '—' },
              { label: 'Service Type', value: project.service_type || '—' },
              { label: 'Project Manager', value: project.pm_name || '—' },
            ].map((item, i) => (
              <div key={i}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{item.label}</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
          {project.description && (
            <p style={{ fontSize: '13px', color: '#475569', margin: '16px 0 0', padding: '16px 0 0', borderTop: '1px solid #F1F5F9', lineHeight: 1.6 }}>{project.description}</p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="w-4 h-4" style={{ color: '#1E40AF' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Reports & Documents</h3>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {documents.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', padding: '20px 0', margin: 0 }}>No documents shared yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documents.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <FileText className="w-5 h-5" style={{ color: '#94A3B8', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.file_name}</p>
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>{d.category} · {d.uploaded_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <button onClick={() => { setRevDocId(d.id); setShowRevForm(true) }}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Request Changes
                  </button>
                </div>
              ))}
            </div>
          )}
          {showRevForm && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', margin: '0 0 10px' }}>Request Document Revision</p>
              <textarea value={revComment} onChange={e => setRevComment(e.target.value)} rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #FDE68A', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                placeholder="Describe what changes you need (page, section, details)..." />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={submitRevision} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#D97706', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Submit Request</button>
                <button onClick={() => setShowRevForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Uploads */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload className="w-4 h-4" style={{ color: '#059669' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Your Uploads</h3>
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #D1FAE5', background: '#F0FDF4', color: '#059669', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload className="w-3.5 h-3.5" />{uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" onChange={e => { if(e.target.files[0]) uploadDoc(e.target.files[0]); e.target.value='' }} />
        </div>
        <div style={{ padding: '16px 24px' }}>
          {client_uploads?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {client_uploads.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FileText className="w-5 h-5" style={{ color: '#94A3B8' }} />
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{u.file_name}</p>
                      <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0' }}>{u.category} · {u.uploaded_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Paperclip className="w-8 h-8" style={{ color: '#CBD5E1', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Upload policies, network diagrams, evidence documents here</p>
            </div>
          )}
        </div>
      </div>

      {/* Communication */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare className="w-4 h-4" style={{ color: '#7C3AED' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Communication</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {project.is_client_review_enabled ? (
            <form onSubmit={addNote} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#D1D5DB'}
                placeholder="Write feedback, instructions, or queries..." />
              <button type="submit" disabled={sending || !noteText.trim()}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer', opacity: (sending || !noteText.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#92400E' }}>
              <AlertCircle className="w-4 h-4" style={{ flexShrink: 0 }} />
              Client review not yet enabled for this project
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {notes.map(n => (
              <div key={n.id} style={{
                padding: '12px 16px', borderRadius: '10px', border: '1px solid',
                background: n.is_client_note ? '#EEF2FF' : '#fff',
                borderColor: n.is_client_note ? '#C7D2FE' : '#E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: n.is_client_note ? '#4338CA' : '#64748B' }}>
                    {n.is_client_note ? 'You' : 'INFOCUS-IT Team'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{n.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#1E293B', margin: 0, lineHeight: 1.5 }}>{n.content}</p>
              </div>
            ))}
            {notes.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#94A3B8', padding: '20px 0', margin: 0 }}>No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══ MEETINGS ═══
function MeetingsView({ meetings, projects, user, onRefresh, onSelect }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', preferred_date: '', agenda: '', meeting_link: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/api/portal/meetings', form, authHeader()); setShowForm(false); setForm({project_id:'',preferred_date:'',agenda:'',meeting_link:''}); onRefresh() }
    catch(e){ toast(e.response?.data?.error||'Failed', 'error') } finally{setSaving(false)}
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Meetings</h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{meetings.length} meeting{meetings.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1E40AF, #1E3A5F)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar className="w-4 h-4" /> Request Meeting
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px' }}>New Meeting Request</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Select Project (optional)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <input type="datetime-local" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
            <textarea value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} required rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Meeting agenda — what do you want to discuss?" />
            <input value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="Meeting link (Google Meet, Zoom, etc.) *" />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#1E40AF', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {meetings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '60px 20px', textAlign: 'center' }}>
          <Calendar className="w-12 h-12" style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>No meetings</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Request a meeting to discuss your project</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meetings.map(m => (
            <div key={m.id} onClick={() => onSelect && onSelect(m)}
              style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all .15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,64,175,0.08)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 4px' }}>{m.agenda?.slice(0, 100)}{m.agenda?.length > 100 ? '...' : ''}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar className="w-3.5 h-3.5" /> Preferred: {m.preferred_date?.slice(0, 16).replace('T', ' ')}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              {m.meeting_link && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink className="w-3.5 h-3.5" style={{ color: '#4F46E5' }} />
                  <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 500, textDecoration: 'none' }}
                    onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
                    {m.meeting_link}
                  </a>
                </div>
              )}
              {m.confirmed_date && (
                <div style={{ padding: '8px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', fontSize: '12px', color: '#059669', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Confirmed: {m.confirmed_date.slice(0, 16).replace('T', ' ')}
                </div>
              )}
              {m.team_remarks && (
                <div style={{ marginTop: '10px', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>Team: </span>{m.team_remarks}
                </div>
              )}
              {m.meeting_link && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                  <a href={m.meeting_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ padding: '6px 14px', borderRadius: '6px', background: '#059669', color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Join
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ MEETING DETAIL ═══
function MeetingDetailView({ meetingId, user, onBack, onRefresh }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleForm, setRescheduleForm] = useState({ preferred_date: '', meeting_link: '', agenda: '' })
  const toast = useToast()

  useEffect(() => {
    api.get(`/api/portal/meetings/${meetingId}`, authHeader())
      .then(r => { setMeeting(r.data.meeting); setLoading(false) })
      .catch(() => { toast('Failed to load meeting', 'error'); setLoading(false) })
  }, [meetingId])

  const cancelMeeting = async () => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return
    setCancelling(true)
    try {
      const r = await api.patch(`/api/portal/meetings/${meetingId}`, { action: 'cancel' }, authHeader())
      setMeeting(r.data.meeting); toast('Meeting cancelled', 'success'); onRefresh()
    } catch (e) { toast(e.response?.data?.error || 'Failed to cancel', 'error') }
    finally { setCancelling(false) }
  }

  const submitReschedule = async (e) => {
    e.preventDefault()
    if (!rescheduleForm.preferred_date || !rescheduleForm.meeting_link || !rescheduleForm.agenda.trim())
      return toast('Date, link, and agenda are required', 'error')
    try {
      const r = await api.patch(`/api/portal/meetings/${meetingId}`, { action: 'reschedule', ...rescheduleForm }, authHeader())
      setMeeting(r.data.meeting); setRescheduling(false); toast('Meeting rescheduled', 'success'); onRefresh()
    } catch (e) { toast(e.response?.data?.error || 'Failed to reschedule', 'error') }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #E2E8F0', borderTopColor: '#1E40AF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ fontSize: '14px', color: '#94A3B8' }}>Loading meeting details...</p>
    </div>
  )

  if (!meeting) return <p style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>Meeting not found</p>

  const canCancel = ['Requested', 'Confirmed', 'Rescheduled'].includes(meeting.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-start' }}
        onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0F172A' }}
        onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748B' }}>
        <ChevronLeft className="w-4 h-4" /> Back to Meetings
      </button>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar className="w-5 h-5" style={{ color: '#1E40AF' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Meeting Request</h2>
                <StatusBadge status={meeting.status} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Agenda</p>
              <p style={{ fontSize: '14px', color: '#0F172A', margin: 0, whiteSpace: 'pre-wrap' }}>{meeting.agenda}</p>
            </div>
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Preferred Date</p>
              <p style={{ fontSize: '14px', color: '#0F172A', margin: 0 }}>{meeting.preferred_date?.slice(0, 16).replace('T', ' ')}</p>
            </div>
            {meeting.confirmed_date && (
              <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Confirmed Date</p>
                <p style={{ fontSize: '14px', color: '#059669', margin: 0 }}>{meeting.confirmed_date.slice(0, 16).replace('T', ' ')}</p>
              </div>
            )}
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Requested By</p>
              <p style={{ fontSize: '14px', color: '#0F172A', margin: 0 }}>{meeting.requested_by_name || '—'}</p>
            </div>
            {meeting.created_at && (
              <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px' }}>
                <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Requested On</p>
                <p style={{ fontSize: '14px', color: '#0F172A', margin: 0 }}>{meeting.created_at.slice(0, 16).replace('T', ' ')}</p>
              </div>
            )}
          </div>

          {meeting.meeting_link && (
            <div style={{ padding: '14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExternalLink className="w-4 h-4" style={{ color: '#4F46E5' }} />
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#4338CA', fontWeight: 500, textDecoration: 'none', fontSize: '14px' }}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}>
                {meeting.meeting_link}
              </a>
            </div>
          )}

          {meeting.team_remarks && (
            <div style={{ padding: '14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Team Remarks</p>
              <p style={{ fontSize: '14px', color: '#9A3412', margin: 0 }}>{meeting.team_remarks}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: rescheduling ? '14px' : 0 }}>
            {meeting.meeting_link && (
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Join Meeting
              </a>
            )}
            {['Requested', 'Confirmed'].includes(meeting.status) && (
              <button onClick={() => { setRescheduling(!rescheduling); if (!rescheduling) setRescheduleForm({ preferred_date: meeting.preferred_date?.slice(0, 16) || '', meeting_link: meeting.meeting_link || '', agenda: meeting.agenda || '' }) }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', color: '#1E40AF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {rescheduling ? 'Cancel' : 'Reschedule'}
              </button>
            )}
            {canCancel && (
              <button onClick={cancelMeeting} disabled={cancelling}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: cancelling ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cancelling ? 'Cancelling...' : 'Cancel Meeting'}
              </button>
            )}
          </div>

          {rescheduling && (
            <form onSubmit={submitReschedule} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '18px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 14px' }}>Reschedule Meeting</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="datetime-local" value={rescheduleForm.preferred_date} onChange={e => setRescheduleForm({...rescheduleForm, preferred_date: e.target.value})} required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <input value={rescheduleForm.meeting_link} onChange={e => setRescheduleForm({...rescheduleForm, meeting_link: e.target.value})} required
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  placeholder="New meeting link *" />
                <textarea value={rescheduleForm.agenda} onChange={e => setRescheduleForm({...rescheduleForm, agenda: e.target.value})} required rows={2}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Updated agenda *" />
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#1E40AF', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* ═══ MEETING DOCUMENTS ═══ */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '18px', marginTop: '16px' }}>
            <ClientMeetingDocs meetingId={meetingId} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ClientMeetingDocs({ meetingId }) {
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const toast = useToast()

  useEffect(() => { loadDocs() }, [meetingId])

  const loadDocs = async () => {
    try { const r = await api.get(`/api/portal/meetings/${meetingId}/documents`, authHeader()); setDocs(r.data.documents) }
    catch(e) {}
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      await api.post(`/api/portal/meetings/${meetingId}/documents`, fd, { headers: { ...authHeader().headers, 'Content-Type': 'multipart/form-data' } })
      loadDocs()
    } catch(e) { toast('Upload failed', 'error') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div>
      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Paperclip className="w-3.5 h-3.5" /> Documents ({docs.length})
      </h4>
      <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '16px', textAlign: 'center', background: '#FAFAFA', cursor: 'pointer', marginBottom: '12px' }}
        onMouseOver={e => e.currentTarget.style.borderColor = '#1E40AF'}
        onMouseOut={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
        {uploading ? (
          <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Uploading...</p>
        ) : (
          <>
            <Upload className="w-5 h-5" style={{ color: '#94A3B8', margin: '0 auto 4px' }} />
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', margin: 0 }}>Upload a file</p>
          </>
        )}
        <input ref={fileRef} type="file" onChange={handleUpload} hidden />
      </div>
      {docs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {docs.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px' }}>
              <FileText className="w-3.5 h-3.5" style={{ color: '#1E40AF', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 500, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file_name}</p>
                <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0' }}>{d.uploaded_by_name || '—'}</p>
              </div>
              <a href={`/api/portal/meetings/${meetingId}/documents/${d.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px', borderRadius: '4px', color: '#64748B', textDecoration: 'none' }}>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', margin: 0 }}>No documents</p>
      )}
    </div>
  )
}

// ═══ QUERIES ═══
function QueriesView({ queries, projects, user, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', subject: '', question: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/api/portal/queries', form, authHeader()); setShowForm(false); setForm({project_id:'',subject:'',question:''}); onRefresh() }
    catch(e){ toast(e.response?.data?.error||'Failed', 'error') } finally{setSaving(false)}
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Finding Queries</h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>{queries.length} quer{queries.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1E40AF, #1E3A5F)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle className="w-4 h-4" /> Ask Question
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: '0 0 16px' }}>New Query</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}>
              <option value="">Select Project *</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              placeholder="Subject (e.g., Clarification on Finding #5)" />
            <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} required rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Your question or clarification needed..." />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#1E40AF', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Submitting...' : 'Submit Query'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </form>
      )}

      {queries.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '60px 20px', textAlign: 'center' }}>
          <HelpCircle className="w-12 h-12" style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#64748B', margin: '0 0 4px' }}>No queries</p>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Ask questions about audit findings</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queries.map(q => (
            <div key={q.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', margin: 0 }}>{q.subject}</p>
                <StatusBadge status={q.status} />
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>{q.question}</p>
              {q.response && (
                <div style={{ marginTop: '10px', padding: '12px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>Response</p>
                  <p style={{ fontSize: '13px', color: '#1E3A5F', margin: 0 }}>{q.response}</p>
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', margin: '8px 0 0' }}>{q.created_at?.slice(0, 10)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ PROFILE ═══
function ProfileView({ user, onUpdate }) {
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('')
    try {
      const payload = { name, phone }
      if (newPw) { payload.current_password = curPw; payload.new_password = newPw }
      const r = await api.put('/api/portal/me', payload, authHeader())
      onUpdate(r.data.user); setMsg('updated'); setCurPw(''); setNewPw('')
    } catch(e){ setMsg(e.response?.data?.error || 'Failed') } finally{setSaving(false)}
  }

  return (
    <div style={{ maxWidth: '520px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Your Profile</h2>
      <form onSubmit={save} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: 500,
            background: msg === 'updated' ? '#F0FDF4' : '#FEF2F2',
            border: msg === 'updated' ? '1px solid #BBF7D0' : '1px solid #FECACA',
            color: msg === 'updated' ? '#059669' : '#991B1B' }}>
            {msg === 'updated' ? 'Profile updated successfully!' : msg}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email (read-only)</label>
            <input value={user?.email} disabled style={{ width: '100%', padding: '10px 14px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#94A3B8', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1E40AF'}
              onBlur={e => e.target.style.borderColor = '#D1D5DB'} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#1E40AF'}
              onBlur={e => e.target.style.borderColor = '#D1D5DB'} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>Change Password (optional)</p>
          <div>
            <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="Current password" />
          </div>
          <div>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D1D5DB', borderRadius: '10px', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              placeholder="New password (min 8 chars)" />
          </div>
          <button type="submit" disabled={saving}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1E40AF, #1E3A5F)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity .2s' }}>
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ═══ HELPERS ═══
function StatusBadge({ status }) {
  const map = {
    'Requested': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    'Confirmed': { bg: '#F0FDF4', text: '#059669', border: '#BBF7D0' },
    'Rescheduled': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    'Cancelled': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
    'Open': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    'Answered': { bg: '#F0FDF4', text: '#059669', border: '#BBF7D0' },
    'Reopened': { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
    'Submitted': { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
    'Under Review': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
    'Resolved': { bg: '#F0FDF4', text: '#059669', border: '#BBF7D0' },
    'Uploaded': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    'Acknowledged': { bg: '#F0FDF4', text: '#059669', border: '#BBF7D0' },
  }
  const c = map[status] || { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' }
  return (
    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{status}</span>
  )
}

/* Loading spinner + responsive styles */
if (typeof document !== 'undefined' && !document.getElementById('__client_portal_styles')) {
  const s = document.createElement('style')
  s.id = '__client_portal_styles'
  s.textContent = `
    @keyframes spin { to { transform: rotate(360deg) } }
    @media (max-width: 767px) { .login-brand { display: none !important } }
  `
  document.head.appendChild(s)
}
