import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, X, Briefcase } from 'lucide-react'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { useToast } from '../contexts/ToastContext'

const STAGES = ['Initiated','Planning','Information Gathering','Execution','Internal Review','Client Review','Remediation Support','Final Delivery','Invoice Raised','Payment Pending','Partial Payment Received','Full Payment Received','Closed','On Hold','Delayed','Cancelled','Escalated','Awaiting Client Response','Awaiting Documents','Awaiting Payment']
const STAGE_COLORS = {
  'Initiated':'bg-slate-500','Planning':'bg-blue-500','Information Gathering':'bg-indigo-500','Execution':'bg-violet-600',
  'Internal Review':'bg-purple-500','Client Review':'bg-fuchsia-500','Remediation Support':'bg-teal-500','Final Delivery':'bg-emerald-500',
  'Invoice Raised':'bg-amber-500','Payment Pending':'bg-orange-500','Partial Payment Received':'bg-yellow-500','Full Payment Received':'bg-green-700',
  'Closed':'bg-green-700','On Hold':'bg-amber-500','Delayed':'bg-orange-500','Cancelled':'bg-red-600',
  'Escalated':'bg-red-700','Awaiting Client Response':'bg-blue-400','Awaiting Documents':'bg-sky-400','Awaiting Payment':'bg-amber-400',
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [formAccountId, setFormAccountId] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const toast = useToast()
  const { hasRole } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); loadAccounts(); loadUsers() }, [])

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setFormAccountId(searchParams.get('account_id') || '')
      setShowForm(true)
    }
  }, [searchParams])

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-serif font-bold text-slate-900">Projects</h1>
        {hasRole('admin', 'project_lead') && (
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 flex items-center gap-1">
            <Plus className="w-3 h-3" /> New Project
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="border border-slate-300 p-2">
          <p className="text-lg font-bold text-slate-900">{projects.length}</p>
          <p className="text-[10px] text-slate-500">Total</p>
        </div>
        <div className="border border-slate-300 p-2">
          <p className="text-lg font-bold text-slate-900">{activeProjects.length}</p>
          <p className="text-[10px] text-slate-500">Active</p>
        </div>
        <div className="border border-slate-300 p-2">
          <p className="text-lg font-bold text-slate-900">₹{(totalValue / 100000).toFixed(1)}L</p>
          <p className="text-[10px] text-slate-500">Value</p>
        </div>
        <div className="border border-slate-300 p-2">
          <p className="text-lg font-bold text-slate-900">{projects.filter(p => ['On Hold','Cancelled'].includes(p.stage)).length}</p>
          <p className="text-[10px] text-slate-500">Blocked</p>
        </div>
      </div>

      {/* Stage Filter + Search */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            className="w-full pl-7 pr-2 py-1 border border-slate-300 text-xs" placeholder="Search..." />
        </div>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="px-2 py-1 border border-slate-300 text-xs bg-white">
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="border border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">ID</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Title</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Client</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Service</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Stage</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">PM</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Team</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Value</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Start</th>
                <th className="px-3 py-2 font-semibold text-slate-600 uppercase">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? <tr><td colSpan={8} className="px-3 py-4"><TableSkeleton rows={5} cols={5} /></td></tr>
              : projects.length === 0 ? <tr><td colSpan={10} className="text-center py-8 text-slate-400">No projects found</td></tr>
              : projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                  <td className="px-3 py-2 font-semibold text-indigo-700">{p.proj_id}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{p.title}</td>
                  <td className="px-3 py-2 text-slate-600">{p.account_name || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{p.service_type || '—'}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 text-[10px] font-medium text-white ${STAGE_COLORS[p.stage] || 'bg-slate-500'}`}>{p.stage}</span></td>
                  <td className="px-3 py-2 text-slate-600">{p.pm_name || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{p.team_count || '—'}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-700">{p.total_value ? `₹${p.total_value.toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{p.start_date || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{p.target_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && <div className="px-3 pb-2"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
      </div>

      {showForm && <ProjectForm accounts={accounts} users={users} initialAccountId={formAccountId} onClose={() => { setShowForm(false); setFormAccountId('') }} onSaved={() => { setShowForm(false); setFormAccountId(''); load() }} />}
    </div>
  )
}

// ═══════════ PROJECT FORM ═══════════
function ProjectForm({ accounts, users, onClose, onSaved, initialAccountId }) {
  const [form, setForm] = useState({ title:'', description:'', account_id: initialAccountId || '', service_type:'', project_type:'', pm_id:'', total_value:'', start_date:'', target_date:'', is_client_review_enabled: false, po_number:'', po_date:'', po_amount:'', po_terms:'', tds:'', gst:'', net_amount:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k, v) => setForm({ ...form, [k]: v })

  const calcNet = (amount, tds, gst) => {
    const a = parseFloat(amount) || 0
    const t = parseFloat(tds) || 0
    const g = parseFloat(gst) || 0
    return a + g - t
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const p = { ...form }
      for (const k of ['total_value','po_amount','tds','gst','net_amount']) {
        if (p[k]) p[k] = parseFloat(p[k]); else delete p[k]
      }
      if (!p.pm_id) { setError('Project Manager is required'); setSaving(false); return }
      p.pm_id = parseInt(p.pm_id)
      if (!p.start_date) delete p.start_date
      if (!p.target_date) delete p.target_date
      if (!p.po_date) delete p.po_date
      await api.post('/api/projects', p)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white   w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div><h2 className="text-xl font-bold text-slate-900">Project IN — Create Project</h2><p className="text-sm text-slate-500 mt-0.5">Register a project from client Purchase Order</p></div>
          <button onClick={onClose} className="p-2  hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="px-8 py-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200  text-sm text-red-700">{error}</div>}

          {/* PO IN Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500" /> Purchase Order (PO In)</h3>
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-3"><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Title <span className="text-red-500">*</span></label><input value={form.title} onChange={e => f('title', e.target.value)} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="e.g., IFCI Cloud Security Audit 2026" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Client Account <span className="text-red-500">*</span></label><select value={form.account_id} onChange={e => f('account_id', e.target.value)} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none "><option value="">-- Select Client --</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.company_name} ({a.acc_id})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">PO Number</label><input value={form.po_number} onChange={e => f('po_number', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="Client PO #" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">PO Date</label><input type="date" value={form.po_date} onChange={e => f('po_date', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">PO Amount / Project Cost (₹)</label><input type="number" value={form.po_amount} onChange={e => { f('po_amount', e.target.value); f('net_amount', calcNet(e.target.value, form.tds, form.gst)) }} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="e.g., 500000" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">TDS (₹)</label><input type="number" value={form.tds} onChange={e => { f('tds', e.target.value); f('net_amount', calcNet(form.po_amount, e.target.value, form.gst)) }} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="TDS deduction" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">GST @18% (₹)</label><input type="number" value={form.gst} onChange={e => { f('gst', e.target.value); f('net_amount', calcNet(form.po_amount, form.tds, e.target.value)) }} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="Auto or manual" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Net Amount (₹)</label><input type="number" value={form.net_amount} onChange={e => f('net_amount', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  font-bold text-emerald-700" readOnly style={{ background: '#F9FAFB' }} /></div>
              <div className="col-span-3"><label className="block text-sm font-medium text-slate-700 mb-1.5">Terms & Conditions</label><textarea value={form.po_terms} onChange={e => f('po_terms', e.target.value)} rows={2} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  resize-none" placeholder="Payment terms, delivery conditions..." /></div>
            </div>
          </div>

          {/* Project Details Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-indigo-500" /> Project Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Type <span className="text-red-500">*</span></label><select value={form.project_type} onChange={e => f('project_type', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none "><option value="">-- Select Plan Template --</option><option value="VAPT">VAPT</option><option value="IS Audit">IS Audit</option><option value="ISMS Implementation">ISMS Implementation</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label><select value={form.service_type} onChange={e => f('service_type', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none "><option value="">-- Select --</option>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Manager <span className="text-red-500">*</span></label><select value={form.pm_id} onChange={e => f('pm_id', e.target.value)} required className="w-full px-4 py-3 border border-slate-300  text-sm outline-none "><option value="">-- Select PM --</option>{users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.designation || ''})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Total Project Value (₹)</label><input type="number" value={form.total_value} onChange={e => f('total_value', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " placeholder="e.g., 350000" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label><input type="date" value={form.start_date} onChange={e => f('start_date', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Target Completion Date</label><input type="date" value={form.target_date} onChange={e => f('target_date', e.target.value)} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none " /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Project Description / Scope</label><textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  resize-none" placeholder="Describe the project scope, objectives, deliverables expected..." /></div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_client_review_enabled} onChange={e => f('is_client_review_enabled', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700">Enable Client Review Portal — client can see approved documents and write notes</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100  font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 text-sm text-white bg-blue-600  font-medium  disabled:opacity-50">{saving ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}


