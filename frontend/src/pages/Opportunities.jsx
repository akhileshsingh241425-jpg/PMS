import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import {
  Plus, Search, X, Target,
  DollarSign, TrendingUp, CheckCircle, Edit3
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'

const STAGES = [
  { name: 'Prospecting', prob: 10, color: 'bg-slate-500' },
  { name: 'Qualification', prob: 10, color: 'bg-blue-500' },
  { name: 'Needs Analysis', prob: 20, color: 'bg-indigo-500' },
  { name: 'Value Proposition', prob: 50, color: 'bg-violet-500' },
  { name: 'Identify Decision Makers', prob: 70, color: 'bg-purple-500' },
  { name: 'Perception Analysis', prob: 80, color: 'bg-fuchsia-500' },
  { name: 'Proposal/Price Quote', prob: 90, color: 'bg-amber-500' },
  { name: 'Negotiation/Review', prob: 90, color: 'bg-orange-500' },
  { name: 'Closed Won', prob: 100, color: 'bg-emerald-500' },
  { name: 'Closed Lost', prob: 0, color: 'bg-red-500' },
]
const STAGE_NAMES = STAGES.map(s => s.name)
const SOURCES = ['Referral', 'Website', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Partner', 'Conference/Event', 'Existing Client', 'Other']
const SERVICES = ['VAPT', 'IS Audit', 'ISMS Implementation', 'RBI Audit', 'Compliance Audit', 'Cloud Security Audit', 'Network Security Audit', 'Application Security', 'Red Team Assessment', 'SOC Setup', 'Other']

export default function Opportunities() {
  const navigate = useNavigate()
  const [opps, setOpps] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editOpp, setEditOpp] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); loadUsers() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load() }, [stageFilter, assignedFilter])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  const load = async () => {
    try {
      const params = { page, per_page: 25 }
      if (search) params.search = search
      if (stageFilter) params.stage = stageFilter
      const r = await api.get('/api/opportunities', { params })
      let data = r.data.opportunities
      if (assignedFilter) data = data.filter(o => o.assigned_to === parseInt(assignedFilter))
      setOpps(data)
      setPagination(r.data.pagination)
    } catch (e) {} finally { setLoading(false) }
  }
  const loadUsers = async () => { try { const r = await api.get('/api/auth/users'); setUsers(r.data.users) } catch (e) {} }

  const openCreate = () => { setEditOpp(null); setShowForm(true) }
  const openEdit = (o) => { setEditOpp(o); setShowForm(true) }

  // Stats
  const totalValue = opps.reduce((s, o) => s + (o.estimated_value || 0), 0)
  const activeCount = opps.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length
  const wonCount = opps.filter(o => o.stage === 'Closed Won').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Opportunities</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your sales pipeline from first contact to deal closure</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5  hover:opacity-90 text-sm font-medium ">
          <Plus className="w-4 h-4" /> New Opportunity
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white  border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100  flex items-center justify-center"><Target className="w-5 h-5 text-violet-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{opps.length}</p><p className="text-xs text-slate-500">Total Opportunities</p></div>
          </div>
        </div>
        <div className="bg-white  border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100  flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{activeCount}</p><p className="text-xs text-slate-500">Active Pipeline</p></div>
          </div>
        </div>
        <div className="bg-white  border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100  flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">₹{(totalValue / 100000).toFixed(1)}L</p><p className="text-xs text-slate-500">Pipeline Value</p></div>
          </div>
        </div>
        <div className="bg-white  border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100  flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-slate-900">{wonCount}</p><p className="text-xs text-slate-500">Deals Won</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white  border border-slate-200 mb-6">
        <div className="p-4 flex flex-wrap gap-3 items-center border-b border-slate-100">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200  text-sm outline-none  focus:border-violet-500"
              placeholder="Search by company name, contact, ID..." />
          </div>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200  text-sm outline-none  min-w-[180px]">
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s.name} value={s.name}>{s.name} ({s.prob}%)</option>)}
          </select>
          <select value={assignedFilter} onChange={e => setAssignedFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-200  text-sm outline-none  min-w-[160px]">
            <option value="">All Assignees</option>
            {users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <button onClick={load} className="px-4 py-2.5 bg-slate-100 text-slate-700  text-sm font-medium hover:bg-slate-200">Apply</button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Opp ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Person</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Interest</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11}><div className="px-5 py-4"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              ) : opps.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No opportunities found</p>
                  <p className="text-sm text-slate-400 mt-1">Create your first opportunity to start tracking deals</p>
                </td></tr>
              ) : opps.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/opportunities/${o.id}`)}>
                  <td className="px-5 py-4 text-sm font-semibold text-violet-600">{o.opp_id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-violet-100  flex items-center justify-center shrink-0">
                        <span className="text-violet-600 text-xs font-bold">{o.company_name?.[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{o.company_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.contact_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.service_interest || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.source || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{o.estimated_value ? `₹${o.estimated_value.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1  text-xs font-medium text-white ${STAGES.find(s => s.name === o.stage)?.color || 'bg-slate-500'}`}>
                      {o.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{o.assigned_name || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{o.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{o.updated_at?.slice(0, 10)}</td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(o)} className="p-1.5  hover:bg-slate-100" title="Edit">
                      <Edit3 className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && <div className="px-5"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && <OpportunityForm editData={editOpp} users={users} onClose={() => { setShowForm(false); setEditOpp(null) }} onSaved={() => { setShowForm(false); setEditOpp(null); load() }} />}
    </div>
  )
}
// ═══════════════════════════════════════════════════════════
// OPPORTUNITY FORM — Full professional form with all fields
// ═══════════════════════════════════════════════════════════
function OpportunityForm({ editData, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: editData?.company_name || '',
    contact_name: editData?.contact_name || '',
    contact_email: editData?.contact_email || '',
    contact_phone: editData?.contact_phone || '',
    source: editData?.source || '',
    service_interest: editData?.service_interest || '',
    description: editData?.description || '',
    stage: editData?.stage || 'Prospecting',
    estimated_value: editData?.estimated_value || '',
    expected_close_date: editData?.expected_close_date || '',
    assigned_to: editData?.assigned_to || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (payload.estimated_value) payload.estimated_value = parseFloat(payload.estimated_value)
      else delete payload.estimated_value
      if (payload.assigned_to) payload.assigned_to = parseInt(payload.assigned_to)
      else delete payload.assigned_to
      if (!payload.expected_close_date) delete payload.expected_close_date

      if (editData) {
        await api.put(`/api/opportunities/${editData.id}`, payload)
      } else {
        await api.post('/api/opportunities', payload)
      }
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const f = (field, value) => setForm({ ...form, [field]: value })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white   w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        {/* Form Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{editData ? 'Edit Opportunity' : 'Create New Opportunity'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in all details about the potential deal</p>
          </div>
          <button onClick={onClose} className="p-2  hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={save} className="px-8 py-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200  text-sm text-red-700">{error}</div>}

          {/* Section: Company Information */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                <input value={form.company_name} onChange={e => f('company_name', e.target.value)} required
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500"
                  placeholder="Enter company name (e.g., IFCI Limited)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label>
                <input value={form.contact_name} onChange={e => f('contact_name', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500"
                  placeholder="Key person name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Email</label>
                <input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500"
                  placeholder="email@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Phone</label>
                <input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500"
                  placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Source / Reference</label>
                <select value={form.source} onChange={e => f('source', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500">
                  <option value="">-- Select Source --</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Deal Details */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Deal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Service Interest</label>
                <select value={form.service_interest} onChange={e => f('service_interest', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500">
                  <option value="">-- Select Service --</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Deal Value (₹)</label>
                <input type="number" value={form.estimated_value} onChange={e => f('estimated_value', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500"
                  placeholder="e.g., 250000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Stage</label>
                <select value={form.stage} onChange={e => f('stage', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500">
                  {STAGES.map(s => <option key={s.name} value={s.name}>{s.name} ({s.prob}%)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Close Date</label>
                <input type="date" value={form.expected_close_date} onChange={e => f('expected_close_date', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned To</label>
                <select value={form.assigned_to} onChange={e => f('assigned_to', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500">
                  <option value="">-- Select Person --</option>
                  {users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.designation || u.roles?.[0]})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Description */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Description & Notes</h3>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4}
              className="w-full px-4 py-3 border border-slate-300  text-sm outline-none  focus:border-violet-500 resize-none"
              placeholder="Describe the opportunity — what the client is looking for, any specific requirements, timeline expectations, who referred them, etc." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 bg-slate-100  hover:bg-slate-200 font-medium">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-8 py-2.5 text-sm text-white bg-blue-600  hover:opacity-90 font-medium  disabled:opacity-50">
              {saving ? 'Saving...' : editData ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





