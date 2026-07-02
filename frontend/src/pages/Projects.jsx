import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import {
  Plus, Search, X, Briefcase, ChevronLeft, User, Phone, Mail, Calendar,
  Clock, DollarSign, Building2, Upload, CheckCircle, XCircle, AlertCircle,
  MessageSquare, Send, Users, FileText, Bell, Target, Edit3, Trash2,
  ArrowRight, Shield, Eye, HelpCircle
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { useToast } from '../contexts/ToastContext'

const STAGES = ['Initiated','Onboarding','Planning','Information Gathering','Execution','Internal Review','Client Review','Remediation Support','Final Delivery','Invoice Raised','Payment Pending','Partial Payment Received','Full Payment Received','Closed','On Hold','Delayed','Cancelled','Awaiting Client Response','Awaiting Documents','Awaiting Payment','Escalated']
const STAGE_GROUPS = {
  'Delivery': ['Initiated','Onboarding','Planning','Information Gathering','Execution','Internal Review','Client Review','Remediation Support','Final Delivery'],
  'Finance': ['Invoice Raised','Payment Pending','Partial Payment Received','Full Payment Received','Closed'],
  'Blocked': ['On Hold','Delayed','Cancelled','Awaiting Client Response','Awaiting Documents','Awaiting Payment','Escalated'],
}
const STAGE_COLORS = {
  'Initiated':'bg-slate-500','Onboarding':'bg-blue-400','Planning':'bg-blue-500','Information Gathering':'bg-indigo-500',
  'Execution':'bg-violet-600','Internal Review':'bg-purple-500','Client Review':'bg-fuchsia-500','Remediation Support':'bg-orange-500',
  'Final Delivery':'bg-teal-500','Invoice Raised':'bg-emerald-500','Payment Pending':'bg-green-500',
  'Partial Payment Received':'bg-green-600','Full Payment Received':'bg-green-700','Closed':'bg-slate-600',
  'On Hold':'bg-amber-500','Delayed':'bg-orange-600','Cancelled':'bg-red-600','Awaiting Client Response':'bg-yellow-500',
  'Awaiting Documents':'bg-yellow-600','Awaiting Payment':'bg-amber-600','Escalated':'bg-red-700',
}
const SERVICES = ['VAPT','IS Audit','ISMS Implementation','RBI Audit','Compliance Audit','Cloud Security Audit','Network Security Audit','Application Security','Red Team Assessment','SOC Setup','Other']
const TASK_PRIORITIES = ['Low','Normal','High','Urgent']
const TASK_STATUSES = ['Open','In Progress','Completed']
const DOC_CATEGORIES = ['Report','Certificate','Proposal','Purchase Order','Deliverable','Scan Results','Evidence','Other']

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [accounts, setAccounts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [initialTab, setInitialTab] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const toast = useToast()
  const { hasRole } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); loadAccounts(); loadUsers() }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const pid = searchParams.get('projectId')
    const tab = searchParams.get('tab')
    if (pid) {
      setSelectedProject({ id: parseInt(pid) })
      if (tab) setInitialTab(tab)
      setSearchParams({}, { replace: true })
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load() }, [stageFilter])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  const load = async () => { try { const r = await api.get('/api/projects', { params: { search, stage: stageFilter, page, per_page: 25 } }); setProjects(r.data.projects); setPagination(r.data.pagination) } catch (e) { console.error(e) } finally { setLoading(false) } }
  const loadAccounts = async () => { try { const r = await api.get('/api/accounts'); setAccounts(r.data.accounts) } catch (e) { console.error(e) } }
  const loadUsers = async () => { try { const r = await api.get('/api/auth/users'); setUsers(r.data.users) } catch (e) { console.error(e) } }

  // Stats
  const activeProjects = projects.filter(p => !['Closed','Cancelled'].includes(p.stage))
  const totalValue = projects.reduce((s, p) => s + (p.total_value || 0), 0)

  if (selectedProject) return <ProjectDetail projectId={selectedProject.id} onBack={() => { setSelectedProject(null); setInitialTab(null); load() }} users={users} initialTab={initialTab} />

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">Manage project delivery — from initiation to final payment</p>
        </div>
        {hasRole('super_admin', 'project_lead') && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 text-sm font-medium shadow-md">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-indigo-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{projects.length}</p><p className="text-xs text-slate-500">Total Projects</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center"><Target className="w-5 h-5 text-violet-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{activeProjects.length}</p><p className="text-xs text-slate-500">Active / In Progress</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">₹{(totalValue / 100000).toFixed(1)}L</p><p className="text-xs text-slate-500">Total Value</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{projects.filter(p => STAGE_GROUPS.Blocked.includes(p.stage)).length}</p><p className="text-xs text-slate-500">Blocked / On Hold</p></div>
        </div>
      </div>

      {/* Stage Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setStageFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!stageFilter ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>All ({projects.length})</button>
          {Object.entries(STAGE_GROUPS).map(([group, stages]) => {
            const count = projects.filter(p => stages.includes(p.stage)).length
            return (
              <span key={group} className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold ml-2">{group}:</span>
                {stages.slice(0, 4).map(s => {
                  const c = projects.filter(p => p.stage === s).length
                  if (c === 0 && !stageFilter) return null
                  return <button key={s} onClick={() => setStageFilter(stageFilter === s ? '' : s)} className={`px-2 py-1 rounded text-[10px] font-medium border ${stageFilter === s ? `${STAGE_COLORS[s]} text-white border-transparent` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{s.length > 15 ? s.slice(0,12)+'...' : s} {c > 0 ? `(${c})` : ''}</button>
                })}
              </span>
            )
          })}
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search projects..." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Project ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Client (Account)</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Stage</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Project Manager</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Team</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Value</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Start</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={8}><div className="px-5 py-4"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              : projects.length === 0 ? <tr><td colSpan={10} className="text-center py-12"><Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No projects found</p></td></tr>
              : projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedProject(p)}>
                  <td className="px-5 py-4 text-sm font-semibold text-indigo-600">{p.proj_id}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{p.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.account_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.service_type || '—'}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${STAGE_COLORS[p.stage] || 'bg-slate-500'}`}>{p.stage}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{p.pm_name || '—'}</td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{p.team_count} members</span></td>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{p.total_value ? `₹${p.total_value.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{p.start_date || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{p.target_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && <div className="px-5"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
      </div>

      {showForm && <ProjectForm accounts={accounts} users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}

// ═══════════ PROJECT FORM ═══════════
function ProjectForm({ accounts, users, onClose, onSaved }) {
  const [form, setForm] = useState({ title:'', description:'', account_id:'', service_type:'', pm_id:'', total_value:'', start_date:'', target_date:'', is_client_review_enabled: false })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k, v) => setForm({ ...form, [k]: v })

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const p = { ...form }
      if (p.total_value) p.total_value = parseFloat(p.total_value); else delete p.total_value
      if (p.pm_id) p.pm_id = parseInt(p.pm_id); else delete p.pm_id
      if (!p.start_date) delete p.start_date
      if (!p.target_date) delete p.target_date
      await api.post('/api/projects', p)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div><h2 className="text-xl font-bold text-slate-900">Create New Project</h2><p className="text-sm text-slate-500 mt-0.5">Setup project for delivery tracking</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="px-8 py-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500" /> Project Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Title <span className="text-red-500">*</span></label><input value={form.title} onChange={e => f('title', e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., IFCI Cloud Security Audit 2026" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Client Account <span className="text-red-500">*</span></label><select value={form.account_id} onChange={e => f('account_id', e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="">-- Select Account --</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.company_name} ({a.acc_id})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label><select value={form.service_type} onChange={e => f('service_type', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="">-- Select --</option>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Manager</label><select value={form.pm_id} onChange={e => f('pm_id', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="">-- Select PM --</option>{users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.designation || ''})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Value (₹)</label><input type="number" value={form.total_value} onChange={e => f('total_value', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 350000" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label><input type="date" value={form.start_date} onChange={e => f('start_date', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Target Completion Date</label><input type="date" value={form.target_date} onChange={e => f('target_date', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Description / Scope</label><textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Describe the project scope, objectives, deliverables expected..." /></div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_client_review_enabled} onChange={e => f('is_client_review_enabled', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700">Enable Client Review Portal — client can see approved documents and write notes</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg font-medium shadow-md disabled:opacity-50">{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ═══════════ PROJECT DETAIL — Full Professional Page ═══════════
function ProjectDetail({ projectId, onBack, users, initialTab }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(initialTab || 'overview')
  const [remarkText, setRemarkText] = useState('')
  const [sendingRemark, setSendingRemark] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const { hasRole, user: currentUser } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [projectId])
  const fetchData = async () => { try { const r = await api.get(`/api/projects/${projectId}`); setData(r.data) } catch (e) { console.error(e) } finally { setLoading(false) } }

  const changeStage = async (stage) => { try { await api.put(`/api/projects/${projectId}`, { stage }); fetchData() } catch (e) { console.error(e) } }

  const addRemark = async (e) => {
    e.preventDefault(); if (!remarkText.trim()) return; setSendingRemark(true)
    try { await api.post(`/api/projects/${projectId}/remarks`, { text: remarkText }); setRemarkText(''); fetchData() }
    catch (e) { console.error(e) } finally { setSendingRemark(false) }
  }

  const uploadDoc = async (file, category) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('category', category || 'Report'); fd.append('is_client_visible', 'false')
      await api.post(`/api/projects/${projectId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      fetchData()
    } catch (e) { console.error(e) } finally { setUploading(false) }
  }

  const reviewDoc = async (docId, status, remarks) => {
    try { await api.post(`/api/projects/documents/${docId}/review`, { status, remarks, make_client_visible: status === 'Approved' }); fetchData() } catch (e) { console.error(e) }
  }

  const addTeamMember = async (userId, role) => {
    try { await api.post(`/api/projects/${projectId}/team`, { user_id: userId, role_in_project: role }); fetchData(); setShowTeamForm(false) } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const removeTeamMember = async (tid) => {
    if (!confirm('Remove this team member?')) return
    try { await api.delete(`/api/projects/team/${tid}`); fetchData() } catch (e) { console.error(e) }
  }

  const addTask = async (taskData) => {
    try { await api.post('/api/tasks', { ...taskData, module_type: 'project', module_id: projectId }); fetchData(); setShowTaskForm(false) } catch (e) { toast(e.response?.data?.error || 'Error', 'error') }
  }

  const updateTaskStatus = async (taskId, status) => {
    try { await api.put(`/api/tasks/${taskId}`, { status }); fetchData() } catch (e) { console.error(e) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse">Loading project...</p></div>
  if (!data) return null
  const { project, remarks, documents, team, tasks, meetings, reminders, notes, queries = [], meeting_requests = [] } = data

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'tasks', label: `Tasks (${tasks.length})`, icon: CheckCircle },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'team', label: `Team (${team.length})`, icon: Users },
    { id: 'remarks', label: `Remarks (${remarks.length})`, icon: MessageSquare },
    { id: 'meetings', label: `Meetings (${meetings.length})`, icon: Calendar },
    { id: 'queries', label: `Queries (${queries.length})`, icon: HelpCircle },
    { id: 'meeting_requests', label: `Client Req (${meeting_requests.length})`, icon: Calendar },
    { id: 'notes', label: `Notes (${notes.length})`, icon: Bell },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5"><ChevronLeft className="w-4 h-4" /> Back to Projects</button>

      {/* Project Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <p className="text-indigo-200 text-sm mt-1">{project.proj_id} · {project.account_name} · {project.service_type || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{project.total_value ? `₹${project.total_value.toLocaleString()}` : '—'}</p>
              <p className="text-indigo-200 text-xs">Project Value</p>
            </div>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="px-8 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Project Stage</p>
          <div className="space-y-2">
            {Object.entries(STAGE_GROUPS).map(([group, stages]) => (
              <div key={group} className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 uppercase font-bold w-16 shrink-0">{group}:</span>
                {stages.map(s => (
                  <button key={s} onClick={() => changeStage(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      project.stage === s ? `${STAGE_COLORS[s]} text-white border-transparent shadow-md` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}>{s}</button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Project Info Grid */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <InfoField icon={Building2} label="Client" value={project.account_name} />
            <InfoField icon={Shield} label="Service Type" value={project.service_type} />
            <InfoField icon={User} label="Project Manager" value={project.pm_name} />
            <InfoField icon={Users} label="Team Size" value={`${project.team_count} members`} />
            <InfoField icon={Calendar} label="Start Date" value={project.start_date} />
            <InfoField icon={Calendar} label="Target Date" value={project.target_date} />
            <InfoField icon={Clock} label="Created" value={project.created_at?.slice(0, 10)} />
            <InfoField icon={Eye} label="Client Review" value={project.is_client_review_enabled ? 'Enabled' : 'Disabled'} />
          </div>
          {project.description && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Project Scope / Description</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto px-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ TASKS TAB ═══ */}
          {tab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tasks</h3>
                  <p className="text-sm text-slate-500">Assign and track team tasks — PM assigns, team updates status</p>
                </div>
                {hasRole('super_admin', 'project_lead') && (
                  <button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                    <Plus className="w-4 h-4" /> Assign Task
                  </button>
                )}
              </div>

              {showTaskForm && <TaskForm users={users} onSave={addTask} onCancel={() => setShowTaskForm(false)} />}

              {tasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No tasks assigned yet</p></div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => (
                    <div key={t.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm">
                      <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer ${
                          t.status === 'Completed' ? 'bg-green-100 text-green-700' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{t.title}</p>
                        {t.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-600">{t.assigned_name || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400">{t.due_date || 'No due date'}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        t.priority === 'Urgent' ? 'bg-red-100 text-red-700' : t.priority === 'High' ? 'bg-orange-100 text-orange-700' : t.priority === 'Normal' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ DOCUMENTS TAB ═══ */}
          {tab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Documents & Reports</h3>
                  <p className="text-sm text-slate-500">Upload reports → Manager reviews → Approve → Client sees</p>
                </div>
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                  <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <input type="file" ref={fileRef} className="hidden" onChange={e => { if (e.target.files[0]) uploadDoc(e.target.files[0], 'Report'); e.target.value = '' }} />
              </div>

              {/* Approval flow explanation */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-indigo-700 uppercase mb-1">Document Approval Workflow</p>
                <p className="text-sm text-indigo-600">Auditor uploads → Status: <span className="font-semibold">Pending</span> → Manager reviews → <span className="font-semibold text-green-600">Approved</span> (client sees) or <span className="font-semibold text-red-600">Revision Required</span> (auditor fixes & re-uploads)</p>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No documents uploaded yet</p></div>
              ) : (
                <div className="space-y-3">
                  {documents.map(d => (
                    <div key={d.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-slate-500" /></div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{d.file_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{d.category} · Uploaded by {d.uploaded_by_name} · {d.uploaded_at?.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReviewStatusBadge status={d.review_status} />
                          {d.is_client_visible && <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium"><Eye className="w-3 h-3" /> Client Visible</span>}
                        </div>
                      </div>

                      {d.reviewer_remarks && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-xs font-semibold text-orange-700">Manager Remarks:</p>
                          <p className="text-sm text-orange-600 mt-0.5">{d.reviewer_remarks}</p>
                          {d.reviewed_by_name && <p className="text-[10px] text-orange-500 mt-1">— {d.reviewed_by_name}</p>}
                        </div>
                      )}

                      {/* Approve / Reject for managers */}
                      {hasRole('super_admin', 'project_lead') && d.review_status !== 'Approved' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                          <button onClick={() => reviewDoc(d.id, 'Approved', '')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 border border-green-200">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve & Make Client Visible
                          </button>
                          <button onClick={() => { const r = prompt('What needs to be fixed? Enter remarks for auditor:'); if (r) reviewDoc(d.id, 'Revision Required', r) }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> Reject with Remarks
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TEAM TAB ═══ */}
          {tab === 'team' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div><h3 className="text-lg font-bold text-slate-900">Project Team</h3><p className="text-sm text-slate-500">Members assigned to this project with their roles</p></div>
                {hasRole('super_admin', 'project_lead') && (
                  <button onClick={() => setShowTeamForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                )}
              </div>

              {showTeamForm && <TeamForm users={users} existingTeam={team} onAdd={addTeamMember} onCancel={() => setShowTeamForm(false)} />}

              {team.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><Users className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No team members assigned</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {team.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">{t.user_name?.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{t.user_name}</p>
                        <p className="text-xs text-slate-500">{t.role_in_project || 'Member'} · {t.designation || ''}</p>
                      </div>
                      {hasRole('super_admin', 'project_lead') && (
                        <button onClick={() => removeTeamMember(t.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ REMARKS TAB ═══ */}
          {tab === 'remarks' && (
            <div>
              <div className="mb-5"><h3 className="text-lg font-bold text-slate-900">Project Remarks</h3><p className="text-sm text-slate-500">PM/Lead enters progress notes, updates, and observations</p></div>
              <form onSubmit={addRemark} className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input value={remarkText} onChange={e => setRemarkText(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="Add project remark (e.g., BS 01/07 — Scanning completed, report draft in progress...)" />
                <button type="submit" disabled={sendingRemark || !remarkText.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm">
                  <Send className="w-4 h-4" /> Add
                </button>
              </form>
              {remarks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No remarks yet</p></div>
              ) : (
                <div className="space-y-4">
                  {remarks.map(r => (
                    <div key={r.id} className="flex gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{r.author?.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="flex-1"><div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"><p className="text-sm text-slate-800 leading-relaxed">{r.text}</p></div><p className="text-xs text-slate-400 mt-1.5 px-1">{r.author} · {r.created_at?.slice(0, 16).replace('T', ' ')}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ MEETINGS TAB ═══ */}
          {tab === 'meetings' && (
            <div>
              <div className="mb-5"><h3 className="text-lg font-bold text-slate-900">Meetings</h3><p className="text-sm text-slate-500">Scheduled meetings with client or internal team</p></div>
              {meetings.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No meetings scheduled</p></div>
              ) : (
                <div className="space-y-3">
                  {meetings.map(m => (
                    <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">{m.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'Completed' ? 'bg-green-100 text-green-700' : m.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{m.status}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        {m.meeting_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{m.meeting_date.slice(0, 16).replace('T', ' ')}</span>}
                        {m.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.location}</span>}
                      </div>
                      {m.mom && <div className="mt-2 p-3 bg-slate-50 rounded-lg"><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Minutes of Meeting</p><p className="text-sm text-slate-700">{m.mom}</p></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ NOTES TAB ═══ */}
          {tab === 'notes' && (
            <div>
              <div className="mb-5"><h3 className="text-lg font-bold text-slate-900">Notes</h3><p className="text-sm text-slate-500">Internal notes + Client feedback (if client review enabled)</p></div>
              {notes.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No notes yet</p></div>
              ) : (
                <div className="space-y-3">
                  {notes.map(n => (
                    <div key={n.id} className={`p-4 rounded-xl border ${n.is_client_note ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                      {n.is_client_note && <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">👤 Client Note</p>}
                      <p className="text-sm text-slate-800">{n.content}</p>
                      <p className="text-xs text-slate-400 mt-2">{n.author} · {n.created_at?.slice(0, 10)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ QUERIES TAB ═══ */}
          {tab === 'queries' && (
            <div>
              <div className="mb-5"><h3 className="text-lg font-bold text-slate-900">Client Queries</h3><p className="text-sm text-slate-500">Questions raised by client on audit findings</p></div>
              {queries.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No queries from client</p></div>
              ) : (
                <div className="space-y-3">
                  {queries.map(q => (
                    <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-900">{q.subject}</p>
                        <StatusBadge status={q.status} />
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{q.question}</p>
                      {q.response ? (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-semibold text-green-700 mb-1">Response ({q.responded_by_name})</p>
                          <p className="text-sm text-green-800">{q.response}</p>
                        </div>
                      ) : (
                        <RespondForm endpoint={`/api/queries/${q.id}/respond`} placeholder="Write your response..." buttonLabel="Respond" onDone={() => fetchData()} />
                      )}
                      <p className="text-xs text-slate-400 mt-2">{q.raised_by_name} · {q.created_at?.slice(0, 10)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ MEETING REQUESTS TAB ═══ */}
          {tab === 'meeting_requests' && (
            <div>
              <div className="mb-5"><h3 className="text-lg font-bold text-slate-900">Client Meeting Requests</h3><p className="text-sm text-slate-500">Meeting requests raised by client — confirm, reschedule, or cancel</p></div>
              {meeting_requests.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl"><Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No meeting requests from client</p></div>
              ) : (
                <div className="space-y-3">
                  {meeting_requests.map(m => (
                    <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-900">{m.agenda?.slice(0, 80)}</p>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Preferred: {m.preferred_date?.slice(0, 16).replace('T', ' ')} · By: {m.requested_by_name}</p>
                      {m.status === 'Requested' && (
                        <RespondMeetingRequest meeting={m} onDone={() => fetchData()} />
                      )}
                      {m.confirmed_date && <p className="text-sm text-green-600">✓ Confirmed: {m.confirmed_date.slice(0, 16).replace('T', ' ')}</p>}
                      {m.team_remarks && <div className="mt-2 p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">{m.team_remarks}</p></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ OVERVIEW TAB ═══ */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Project Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Tasks</span><span className="font-medium">{tasks.filter(t => t.status === 'Completed').length}/{tasks.length} completed</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Documents</span><span className="font-medium">{documents.filter(d => d.review_status === 'Approved').length}/{documents.length} approved</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Team</span><span className="font-medium">{team.length} members</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Meetings</span><span className="font-medium">{meetings.length} total</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Client Notes</span><span className="font-medium">{notes.filter(n => n.is_client_note).length}</span></div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Remarks</h4>
                {remarks.slice(0, 3).map(r => (
                  <div key={r.id} className="mb-2 pb-2 border-b border-slate-200 last:border-0">
                    <p className="text-sm text-slate-700 truncate">{r.text}</p>
                    <p className="text-[10px] text-slate-400">{r.author} · {r.created_at?.slice(0, 10)}</p>
                  </div>
                ))}
                {remarks.length === 0 && <p className="text-sm text-slate-400">No activity yet</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══ Sub-components ═══
function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div><p className="text-xs font-medium text-slate-500 uppercase">{label}</p><p className="text-sm text-slate-900 mt-0.5">{value || '—'}</p></div>
    </div>
  )
}

function ReviewStatusBadge({ status }) {
  if (status === 'Approved') return <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>
  if (status === 'Revision Required') return <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Revision Required</span>
  return <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium"><Clock className="w-3.5 h-3.5" /> Pending Review</span>
}

function TaskForm({ users, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'Normal', due_date: '' })
  return (
    <div className="mb-5 p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
      <h4 className="text-sm font-semibold text-indigo-700 mb-3">Assign New Task</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title *" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        <div className="col-span-2"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Task description / details" rows={2} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        <div><select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Assign to...</option>{users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></div>
        <div><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">{TASK_PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
        <div><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" /></div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => { if (!form.title) return; onSave({ ...form, assigned_to: form.assigned_to ? parseInt(form.assigned_to) : undefined }) }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Assign Task</button>
        <button onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  )
}

function TeamForm({ users, existingTeam, onAdd, onCancel }) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('Auditor')
  const existingIds = existingTeam.map(t => t.user_id)
  return (
    <div className="mb-5 p-5 bg-indigo-50 border border-indigo-200 rounded-xl">
      <h4 className="text-sm font-semibold text-indigo-700 mb-3">Add Team Member</h4>
      <div className="flex gap-3">
        <select value={userId} onChange={e => setUserId(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Select person...</option>
          {users.filter(u => u.is_active && !existingIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.full_name} — {u.designation || ''}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option>Auditor</option><option>Lead Auditor</option><option>Analyst</option><option>Consultant</option><option>Reviewer</option>
        </select>
        <button onClick={() => { if (userId) onAdd(parseInt(userId), role) }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Add</button>
        <button onClick={onCancel} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm">Cancel</button>
      </div>
    </div>
  )
}

function MapPin(props) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> }

function StatusBadge({ status }) {
  const map = { 'Requested': 'bg-blue-100 text-blue-700', 'Confirmed': 'bg-green-100 text-green-700', 'Rescheduled': 'bg-amber-100 text-amber-700', 'Cancelled': 'bg-red-100 text-red-700', 'Open': 'bg-blue-100 text-blue-700', 'Answered': 'bg-green-100 text-green-700', 'Reopened': 'bg-orange-100 text-orange-700', 'Submitted': 'bg-blue-100 text-blue-700', 'Under Review': 'bg-amber-100 text-amber-700', 'Resolved': 'bg-green-100 text-green-700', 'Uploaded': 'bg-blue-100 text-blue-700', 'Acknowledged': 'bg-green-100 text-green-700' }
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${map[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>
}

function RespondForm({ endpoint, placeholder, buttonLabel, onDone }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault(); if (!text.trim()) return; setSaving(true)
    try { await api.put(endpoint, { response: text }); setText(''); onDone() }
    catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      <button type="submit" disabled={saving || !text.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? '...' : buttonLabel}</button>
    </form>
  )
}

function RespondMeetingRequest({ meeting, onDone }) {
  const toast = useToast()
  const [status, setStatus] = useState('Confirmed')
  const [date, setDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/api/meeting-requests/${meeting.id}/respond`, { status, confirmed_date: date || undefined, team_remarks: remarks || undefined })
      onDone()
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
      <div className="flex gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none">
          <option value="Confirmed">Confirm</option>
          <option value="Rescheduled">Reschedule</option>
          <option value="Cancelled">Cancel</option>
        </select>
        <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
      </div>
      <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Remarks / reason (optional)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none resize-none" />
      <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Submit Response'}</button>
    </form>
  )
}
