import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  Plus, Search, FileText, Calendar, DollarSign, CheckCircle,
  X, Building2, User, Phone, Mail, Globe, MapPin, Hash,
  Tag, TrendingUp, Users, Target, ArrowUpRight
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'

const STAGES = [
  { name: 'Prospecting', color: 'bg-slate-500', light: 'bg-slate-100 text-slate-700' },
  { name: 'Lead Qualification', color: 'bg-blue-500', light: 'bg-blue-100 text-blue-700' },
  { name: 'Demo or Meeting', color: 'bg-indigo-500', light: 'bg-indigo-100 text-indigo-700' },
  { name: 'Proposal', color: 'bg-violet-500', light: 'bg-violet-100 text-violet-700' },
  { name: 'Negotiation & Commitment', color: 'bg-purple-500', light: 'bg-purple-100 text-purple-700' },
  { name: 'Purchase Order', color: 'bg-amber-500', light: 'bg-amber-100 text-amber-700' },
  { name: 'Lead Closed (Won)', color: 'bg-emerald-500', light: 'bg-emerald-100 text-emerald-700' },
  { name: 'Lead Closed (Lost)', color: 'bg-red-500', light: 'bg-red-100 text-red-700' },
  { name: 'Converted to Account', color: 'bg-emerald-500', light: 'bg-emerald-100 text-emerald-700' },
  { name: 'Approval Rejected', color: 'bg-red-500', light: 'bg-red-100 text-red-700' },
]
const STAGE_NAMES = STAGES.map(s => s.name)
const SERVICES = ['VAPT', 'IS Audit', 'ISMS Implementation', 'RBI Audit', 'Compliance Audit', 'Cloud Security Audit', 'Network Security Audit', 'Application Security', 'Red Team Assessment', 'Other']
const SOURCES = ['Opportunity', 'Referral', 'Website', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Partner', 'Conference', 'Existing Client', 'Other']
const DOC_CATEGORIES = ['Proposal', 'Purchase Order', 'Agreement', 'NDA', 'RFP', 'Scope Document', 'Other']

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); loadUsers() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load() }, [stageFilter])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  const load = async () => {
    try {
      const params = { page, per_page: 25 }; if (search) params.search = search; if (stageFilter) params.stage = stageFilter
      const r = await api.get('/api/leads', { params }); setLeads(r.data.leads); setPagination(r.data.pagination)
    } catch (e) {} finally { setLoading(false) }
  }
  const loadUsers = async () => { try { const r = await api.get('/api/auth/users'); setUsers(r.data.users) } catch (e) {} }

  const totalValue = leads.reduce((s, l) => s + (l.estimated_value || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">Manage qualified leads through the sales pipeline to closure</p>
        </div>
        <button onClick={() => { setEditLead(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all text-sm font-semibold shadow-md">
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{leads.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total Leads</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">₹{(totalValue / 100000).toFixed(1)}L</p>
            <p className="text-xs text-slate-500 font-medium">Pipeline Value</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{leads.filter(l => l.stage === 'Converted to Account').length}</p>
            <p className="text-xs text-slate-500 font-medium">Converted</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{leads.filter(l => l.created_at?.startsWith(new Date().toISOString().slice(0, 7))).length}</p>
            <p className="text-xs text-slate-500 font-medium">This Month</p>
          </div>
        </div>
      </div>

      {/* Stage Pipeline Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Pipeline Stages</p>
          <span className="text-xs text-slate-400">{leads.length} total leads</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStageFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
              !stageFilter
                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}>
            All <span className="ml-1 opacity-70">({leads.length})</span>
          </button>
          {STAGES.map(s => {
            const count = leads.filter(l => l.stage === s.name).length
            const isActive = stageFilter === s.name
            return (
              <button key={s.name} onClick={() => setStageFilter(stageFilter === s.name ? '' : s.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                  isActive
                    ? `${s.color} text-white border-transparent shadow-md`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                {s.name} <span className="ml-1 opacity-70">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPage(1)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Search leads by name, company, ID..." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">ID</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Type</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Company</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Contact</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Service</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Source</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Value</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Stage</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Assigned</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Created</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11}><div className="px-5 py-4"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={11}>
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-semibold text-lg">No leads found</p>
                    <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter criteria</p>
                    <button onClick={() => { setEditLead(null); setShowForm(true) }}
                      className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Create New Lead
                    </button>
                  </div>
                </td></tr>
              ) : leads.map((l, idx) => (
                <tr key={l.id}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                  onClick={() => navigate(l.type === 'opportunity' ? `/leads/${l.id}?type=opportunity` : `/leads/${l.id}`)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-blue-600">{l.opp_id || l.lead_id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white ${
                      l.type === 'opportunity' ? 'bg-violet-500' : 'bg-blue-500'
                    }`}>
                      {l.type === 'opportunity' ? 'Opportunity' : 'Lead'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {l.company_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{l.company_name}</p>
                        {l.account_name && <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">🤝 Referred by {l.account_name}</p>}
                        {l.state && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{l.state}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-700 font-medium">{l.contact_name || '—'}</p>
                      {l.contact_email && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{l.contact_email}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {l.service_type || l.service_interest || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{l.source || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-emerald-600">
                      {l.estimated_value ? `₹${l.estimated_value.toLocaleString()}` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm ${STAGES.find(s => s.name === l.stage)?.color || 'bg-slate-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      {l.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {l.assigned_name?.[0] || '?'}
                      </div>
                      <span className="text-sm text-slate-600">{l.assigned_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">{l.created_at?.slice(0, 10) || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{l.updated_at?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && <div className="px-5"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
        </div>
      </div>

      {showForm && <LeadForm editData={editLead} users={users} onClose={() => { setShowForm(false); setEditLead(null) }} onSaved={() => { setShowForm(false); setEditLead(null); load() }} />}
    </div>
  )
}

// ═══════════ LEAD FORM ═══════════
export function LeadForm({ editData, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    contact_name: editData?.contact_name || '', contact_phone: editData?.contact_phone || '',
    contact_email: editData?.contact_email || '', website: editData?.website || '',
    company_name: editData?.company_name || '', address: editData?.address || '',
    state: editData?.state || '', pincode: editData?.pincode || '',
    source: editData?.source || '', type: editData?.type || '',
    stage: editData?.stage || 'Prospecting', assigned_to: editData?.assigned_to || '',
    closed_on: editData?.closed_on || '',
    subject: editData?.subject || '', description: editData?.description || '',
    service_type: editData?.service_type || '', estimated_value: editData?.estimated_value || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k, v) => setForm({ ...form, [k]: v })

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const p = { ...form }
      if (p.estimated_value) p.estimated_value = parseFloat(p.estimated_value); else delete p.estimated_value
      if (p.assigned_to) p.assigned_to = parseInt(p.assigned_to); else delete p.assigned_to
      if (!p.closed_on) delete p.closed_on
      if (editData) await api.put(`/api/leads/${editData.id}`, p)
      else await api.post('/api/leads', p)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editData ? 'Edit Lead' : 'Create New Lead'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the lead details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={save} className="p-8">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
              <X className="w-4 h-4 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Contact Information */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                <input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} className={inputClass} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
                <input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} className={inputClass} placeholder="john@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                <input value={form.website} onChange={e => f('website', e.target.value)} className={inputClass} placeholder="https://company.com" />
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Company Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                <input value={form.company_name} onChange={e => f('company_name', e.target.value)} required className={inputClass} placeholder="Acme Corp Ltd." />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address</label>
                <input value={form.address} onChange={e => f('address', e.target.value)} className={inputClass} placeholder="Street, area, landmark..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                <input value={form.state} onChange={e => f('state', e.target.value)} className={inputClass} placeholder="Maharashtra" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode</label>
                <input value={form.pincode} onChange={e => f('pincode', e.target.value)} className={inputClass} placeholder="400001" />
              </div>
            </div>
          </div>

          {/* Lead Classification */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-5 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" /> Lead Classification
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lead Source</label>
                <select value={form.source} onChange={e => f('source', e.target.value)} className={inputClass}>
                  <option value="">-- Select Source --</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lead Type</label>
                <select value={form.type} onChange={e => f('type', e.target.value)} className={inputClass}>
                  <option value="">-- Select Type --</option>
                  <option>New Business</option><option>Existing Client</option><option>Upsell</option><option>Cross-sell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stage</label>
                <select value={form.stage} onChange={e => f('stage', e.target.value)} className={inputClass}>
                  {STAGE_NAMES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Assigned To</label>
                <select value={form.assigned_to} onChange={e => f('assigned_to', e.target.value)} className={inputClass}>
                  <option value="">-- Select Person --</option>
                  {users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Service & Value */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Service & Value
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Service Type</label>
                <select value={form.service_type} onChange={e => f('service_type', e.target.value)} className={inputClass}>
                  <option value="">-- Select Service --</option>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estimated Value (₹)</label>
                <input type="number" value={form.estimated_value} onChange={e => f('estimated_value', e.target.value)} className={inputClass} placeholder="e.g. 500000" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subject</label>
                <input value={form.subject} onChange={e => f('subject', e.target.value)} className={inputClass} placeholder="Brief subject/title for this lead" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Notes
            </h3>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3}
              className={`${inputClass} resize-none`} placeholder="Additional notes, requirements, or context..." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : editData ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
