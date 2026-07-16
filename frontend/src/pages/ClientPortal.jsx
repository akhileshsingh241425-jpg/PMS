import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import { Building2, FileText, MessageSquare, Send, Download, Calendar, Shield, LogOut, ChevronLeft, Upload, HelpCircle, Clock, CheckCircle, Bell, User, Briefcase, AlertCircle } from 'lucide-react'

const getToken = () => localStorage.getItem('client_token')
const authHeader = () => ({ headers: { Authorization: `Bearer ${getToken()}` } })

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-serif font-bold text-slate-900">Client Portal</h1>
          <p className="text-sm text-slate-500">INFOCUS-IT — Project Tracking & Communication</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white border border-slate-300 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Client Sign In</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 border border-red-200">{error}</p>}
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 text-sm" /></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-700 text-white py-2 font-medium hover:bg-blue-800 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
          <p className="text-center text-xs text-slate-500">Internal employee? <a href="/login" className="text-blue-700 hover:underline">Employee Login</a></p>
        </form>
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
  const [meetings, setMeetings] = useState([])
  const [queries, setQueries] = useState([])
  const toast = useToast()
  const navigate = useNavigate()

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-800 border-b border-blue-900 px-6 py-2 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Client Portal</span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-sm text-blue-200">{user?.company_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-100">{user?.name}</span>
            <button onClick={logout} className="p-1 hover:bg-blue-700 text-blue-200"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedProject(null) }}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap ${tab === t.id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* DASHBOARD */}
        {tab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Welcome, {user?.name}</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Active Projects" value={dashboard.active_projects} />
              <StatCard label="Upcoming Meetings" value={dashboard.upcoming_meetings} />
              <StatCard label="Open Queries" value={dashboard.open_queries} />
              <StatCard label="Total Projects" value={dashboard.total_projects} />
            </div>
            {dashboard.projects?.length > 0 && (
              <div className="bg-white  border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Active Projects</h3>
                <div className="space-y-2">
                  {dashboard.projects.map(p => (
                    <div key={p.id} onClick={() => { setTab('projects'); setSelectedProject(p) }} className="flex items-center justify-between p-3 bg-slate-50  cursor-pointer hover:bg-slate-100">
                      <div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-slate-500">{p.proj_id} · {p.service_type} · PM: {p.pm_name || '—'}</p></div>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium">{p.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROJECTS */}
        {tab === 'projects' && !selectedProject && (
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Your Projects</h2>
            {projects.length === 0 ? <EmptyState icon={Briefcase} msg="No projects yet" /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} onClick={() => setSelectedProject(p)} className="bg-white  border border-slate-200 p-5 cursor-pointer hover: hover:border-blue-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div><p className="font-semibold text-slate-900">{p.title}</p><p className="text-xs text-slate-500">{p.proj_id} · {p.service_type}</p></div>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium">{p.stage}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-3">
                      {p.pm_name && <span>PM: {p.pm_name}</span>}
                      {p.start_date && <span>Started: {p.start_date}</span>}
                      {p.target_date && <span>Target: {p.target_date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROJECT DETAIL */}
        {tab === 'projects' && selectedProject && <ProjectDetailView projectId={selectedProject.id} user={user} onBack={() => setSelectedProject(null)} onRefresh={loadQueries} />}

        {/* MEETINGS */}
        {tab === 'meetings' && <MeetingsView meetings={meetings} projects={projects} user={user} onRefresh={loadMeetings} />}

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if(!data) return <p className="text-center py-8 text-slate-400">Loading...</p>
  const { project, documents, notes, client_uploads } = data

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft className="w-4 h-4"/> Back to Projects</button>

      {/* Project Info */}
      <div className="bg-white  border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-xl font-bold text-slate-900">{project.title}</h2><p className="text-sm text-slate-500">{project.proj_id} · {project.service_type} · PM: {project.pm_name||'—'}</p></div>
          <span className="px-3 py-1 bg-emerald-100 text-blue-700  text-sm font-medium">{project.stage}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-slate-500">Start</p><p>{project.start_date||'—'}</p></div>
          <div><p className="text-xs text-slate-500">Target</p><p>{project.target_date||'—'}</p></div>
          <div><p className="text-xs text-slate-500">Service</p><p>{project.service_type||'—'}</p></div>
          <div><p className="text-xs text-slate-500">PM</p><p>{project.pm_name||'—'}</p></div>
        </div>
        {project.description && <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">{project.description}</p>}
      </div>

      {/* Documents from Audit Team */}
      <div className="bg-white  border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-700"/> Reports & Documents</h3>
        {documents.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No documents shared yet</p> : (
          <div className="space-y-2">
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 ">
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-slate-400"/><div><p className="text-sm font-medium">{d.file_name}</p><p className="text-xs text-slate-500">{d.category} · {d.uploaded_at?.slice(0,10)}</p></div></div>
                <button onClick={() => { setRevDocId(d.id); setShowRevForm(true) }} className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700  hover:bg-amber-100 font-medium">Request Changes</button>
              </div>
            ))}
          </div>
        )}
        {showRevForm && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 ">
            <p className="text-sm font-medium text-amber-800 mb-2">Request Document Revision</p>
            <textarea value={revComment} onChange={e => setRevComment(e.target.value)} rows={3} className="w-full px-3 py-2 border border-amber-300  text-sm outline-none" placeholder="Describe what changes you need (page, section, details)..." />
            <div className="flex gap-2 mt-2"><button onClick={submitRevision} className="px-4 py-2 bg-amber-600 text-white  text-sm">Submit Request</button><button onClick={() => setShowRevForm(false)} className="px-4 py-2 bg-white border  text-sm">Cancel</button></div>
          </div>
        )}
      </div>

      {/* Client Uploads */}
      <div className="bg-white  border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600"/> Your Uploads</h3>
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700  hover:bg-blue-100 font-medium flex items-center gap-1"><Upload className="w-3 h-3"/>{uploading ? 'Uploading...' : 'Upload Document'}</button>
          <input type="file" ref={fileRef} className="hidden" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" onChange={e => { if(e.target.files[0]) uploadDoc(e.target.files[0]); e.target.value='' }} />
        </div>
        {client_uploads?.length > 0 ? (
          <div className="space-y-2">{client_uploads.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 ">
              <div><p className="text-sm font-medium">{u.file_name}</p><p className="text-xs text-slate-500">{u.category} · {u.uploaded_at?.slice(0,10)}</p></div>
              <StatusBadge status={u.status} />
            </div>
          ))}</div>
        ) : <p className="text-sm text-slate-400 text-center py-4">Upload policies, network diagrams, evidence documents here</p>}
      </div>

      {/* Notes / Communication */}
      <div className="bg-white  border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-700"/> Communication</h3>
        {project.is_client_review_enabled ? (
          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input value={noteText} onChange={e => setNoteText(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-300  text-sm outline-none " placeholder="Write feedback, instructions, or queries..." />
            <button type="submit" disabled={sending||!noteText.trim()} className="px-4 py-2.5 bg-blue-700 text-white  text-sm disabled:opacity-50 flex items-center gap-1"><Send className="w-4 h-4"/></button>
          </form>
        ) : <p className="text-sm text-amber-600 bg-amber-50 p-3  mb-3">Client review not yet enabled for this project</p>}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map(n => (
            <div key={n.id} className={`p-3  border ${n.is_client_note ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase">{n.is_client_note ? '👤 You' : '🏢 INFOCUS-IT'}</span>
                <span className="text-[10px] text-slate-400">{n.created_at?.slice(0,16).replace('T',' ')}</span>
              </div>
              <p className="text-sm text-slate-800">{n.content}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No messages yet</p>}
        </div>
      </div>
    </div>
  )
}

// ═══ MEETINGS VIEW ═══
function MeetingsView({ meetings, projects, user, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', preferred_date: '', agenda: '' })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/api/portal/meetings', form, authHeader()); setShowForm(false); setForm({project_id:'',preferred_date:'',agenda:''}); onRefresh() }
    catch(e){ toast(e.response?.data?.error||'Failed', 'error') } finally{setSaving(false)}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-slate-900">Meetings</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-700 text-white  text-sm font-medium hover:bg-blue-800 flex items-center gap-1"><Calendar className="w-4 h-4"/> Request Meeting</button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white  border border-slate-200 p-5 mb-5 space-y-3">
          <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none"><option value="">Select Project (optional)</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          <input type="datetime-local" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" />
          <textarea value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} required rows={3} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" placeholder="Meeting agenda — what do you want to discuss?" />
          <div className="flex gap-2"><button type="submit" disabled={saving} className="px-5 py-2 bg-blue-700 text-white  text-sm disabled:opacity-50">{saving?'Submitting...':'Submit Request'}</button><button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-100  text-sm">Cancel</button></div>
        </form>
      )}
      {meetings.length === 0 ? <EmptyState icon={Calendar} msg="No meetings" sub="Request a meeting to discuss your project" /> : (
        <div className="space-y-3">
          {meetings.map(m => (
            <div key={m.id} className="bg-white  border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div><p className="text-sm font-medium">{m.agenda?.slice(0, 80)}{m.agenda?.length > 80 ? '...' : ''}</p><p className="text-xs text-slate-500">Preferred: {m.preferred_date?.slice(0, 16).replace('T', ' ')}</p></div>
                <StatusBadge status={m.status} />
              </div>
              {m.confirmed_date && <p className="text-sm text-blue-700">✓ Confirmed: {m.confirmed_date.slice(0,16).replace('T',' ')}</p>}
              {m.team_remarks && <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 ">{m.team_remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ QUERIES VIEW ═══
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-slate-900">Finding Queries</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-700 text-white  text-sm font-medium hover:bg-blue-800 flex items-center gap-1"><HelpCircle className="w-4 h-4"/> Ask Question</button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white  border border-slate-200 p-5 mb-5 space-y-3">
          <select value={form.project_id} onChange={e => setForm({...form, project_id: e.target.value})} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none"><option value="">Select Project *</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
          <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" placeholder="Subject (e.g., Clarification on Finding #5)" />
          <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} required rows={3} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" placeholder="Your question or clarification needed..." />
          <div className="flex gap-2"><button type="submit" disabled={saving} className="px-5 py-2 bg-blue-700 text-white  text-sm disabled:opacity-50">{saving?'Submitting...':'Submit Query'}</button><button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-slate-100  text-sm">Cancel</button></div>
        </form>
      )}
      {queries.length === 0 ? <EmptyState icon={HelpCircle} msg="No queries" sub="Ask questions about audit findings" /> : (
        <div className="space-y-3">
          {queries.map(q => (
            <div key={q.id} className="bg-white  border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold">{q.subject}</p><StatusBadge status={q.status} /></div>
              <p className="text-sm text-slate-600">{q.question}</p>
              {q.response && <div className="mt-3 p-3 bg-blue-50  border border-blue-200"><p className="text-xs font-semibold text-blue-700 mb-1">Response:</p><p className="text-sm text-blue-800">{q.response}</p></div>}
              <p className="text-xs text-slate-400 mt-2">{q.created_at?.slice(0,10)}</p>
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
      onUpdate(r.data.user); setMsg('Profile updated!'); setCurPw(''); setNewPw('')
    } catch(e){ setMsg(e.response?.data?.error||'Failed') } finally{setSaving(false)}
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">Your Profile</h2>
      <form onSubmit={save} className="bg-white  border border-slate-200 p-6 space-y-4">
        {msg && <p className={`text-sm px-3 py-2  ${msg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</p>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Email (read-only)</label><input value={user?.email} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200  text-sm" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " /></div>
        <hr className="border-slate-200" />
        <p className="text-sm font-medium text-slate-700">Change Password (optional)</p>
        <div><input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" placeholder="Current password" /></div>
        <div><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none" placeholder="New password (min 8 chars)" /></div>
        <button type="submit" disabled={saving} className="w-full py-3 bg-blue-700 text-white  font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Update Profile'}</button>
      </form>
    </div>
  )
}

// ═══ HELPERS ═══
function StatCard({ label, value }) {
  return (
    <div className="border border-slate-300 p-3">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { 'Requested': 'bg-blue-100 text-blue-700', 'Confirmed': 'bg-green-100 text-green-700', 'Rescheduled': 'bg-amber-100 text-amber-700', 'Cancelled': 'bg-red-100 text-red-700', 'Open': 'bg-blue-100 text-blue-700', 'Answered': 'bg-green-100 text-green-700', 'Reopened': 'bg-orange-100 text-orange-700', 'Submitted': 'bg-blue-100 text-blue-700', 'Under Review': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-green-100 text-green-700', 'Uploaded': 'bg-blue-100 text-blue-700', 'Acknowledged': 'bg-green-100 text-green-700' }
  return <span className={`px-2 py-0.5 text-[10px] font-medium border ${map[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>
}

function EmptyState({ icon: Icon, msg, sub }) {
  return <div className="text-center py-12 bg-white  border border-slate-200"><Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">{msg}</p>{sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}</div>
}




