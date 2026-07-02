import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  Plus, Search, X, FileText, ChevronLeft, User, Phone, Mail, Globe,
  MessageSquare, Send, Calendar, DollarSign, Building2, Upload,
  CheckCircle, ArrowRight, Edit3, Tag, Paperclip, Download
} from 'lucide-react'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import { useToast } from '../contexts/ToastContext'

const STAGES = [
  { name: 'Prospecting', color: 'bg-slate-500' },
  { name: 'Lead Qualification', color: 'bg-blue-500' },
  { name: 'Demo or Meeting', color: 'bg-indigo-500' },
  { name: 'Proposal', color: 'bg-violet-500' },
  { name: 'Negotiation & Commitment', color: 'bg-purple-500' },
  { name: 'Purchase Order', color: 'bg-amber-500' },
  { name: 'Lead Closed', color: 'bg-red-500' },
  { name: 'Lead Converted', color: 'bg-emerald-500' },
]
const STAGE_NAMES = STAGES.map(s => s.name)
const SERVICES = ['VAPT', 'IS Audit', 'ISMS Implementation', 'RBI Audit', 'Compliance Audit', 'Cloud Security Audit', 'Network Security Audit', 'Application Security', 'Red Team Assessment', 'Other']
const SOURCES = ['Opportunity', 'Referral', 'Website', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Partner', 'Conference', 'Existing Client', 'Other']
const DOC_CATEGORIES = ['Proposal', 'Purchase Order', 'Agreement', 'NDA', 'RFP', 'Scope Document', 'Other']

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)

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

  if (selectedLead) return <LeadDetail lead={selectedLead} onBack={() => { setSelectedLead(null); load() }} users={users} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">Manage qualified leads through the sales pipeline to closure</p>
        </div>
        <button onClick={() => { setEditLead(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 text-sm font-medium shadow-md">
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total Leads" value={leads.length} color="bg-blue-100 text-blue-600" />
        <StatCard icon={DollarSign} label="Pipeline Value" value={`₹${(totalValue / 100000).toFixed(1)}L`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={CheckCircle} label="Converted" value={leads.filter(l => l.stage === 'Lead Converted').length} color="bg-green-100 text-green-600" />
        <StatCard icon={Calendar} label="This Month" value={leads.filter(l => l.created_at?.startsWith(new Date().toISOString().slice(0, 7))).length} color="bg-violet-100 text-violet-600" />
      </div>

      {/* Stage Pipeline Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Lead Pipeline Stages</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStageFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!stageFilter ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            All ({leads.length})
          </button>
          {STAGES.map(s => {
            const count = leads.filter(l => l.stage === s.name).length
            return (
              <button key={s.name} onClick={() => setStageFilter(stageFilter === s.name ? '' : s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${stageFilter === s.name ? `${s.color} text-white border-transparent` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {s.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && setPage(1)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search leads..." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Lead ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Service</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Source</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Value</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Stage</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Assigned</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={10}><div className="px-5 py-4"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              : leads.length === 0 ? <tr><td colSpan={10} className="text-center py-12"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No leads found</p></td></tr>
              : leads.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedLead(l)}>
                  <td className="px-5 py-4 text-sm font-semibold text-blue-600">{l.lead_id}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{l.company_name}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{l.contact_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{l.service_type || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{l.source || '—'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{l.estimated_value ? `₹${l.estimated_value.toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${STAGES.find(s => s.name === l.stage)?.color || 'bg-slate-500'}`}>{l.stage}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{l.assigned_name || '—'}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{l.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{l.updated_at?.slice(0, 10)}</td>
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

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div>
    </div>
  )
}

// ═══════════ LEAD FORM ═══════════
function LeadForm({ editData, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: editData?.company_name || '', contact_name: editData?.contact_name || '',
    contact_email: editData?.contact_email || '', contact_phone: editData?.contact_phone || '',
    website: editData?.website || '', source: editData?.source || '',
    service_type: editData?.service_type || '', description: editData?.description || '',
    estimated_value: editData?.estimated_value || '', assigned_to: editData?.assigned_to || '',
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
      if (editData) await api.put(`/api/leads/${editData.id}`, p)
      else await api.post('/api/leads', p)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div><h2 className="text-xl font-bold text-slate-900">{editData ? 'Edit Lead' : 'Create New Lead'}</h2><p className="text-sm text-slate-500 mt-0.5">Enter verified client information</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="px-8 py-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> Company & Contact</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name <span className="text-red-500">*</span></label><input value={form.company_name} onChange={e => f('company_name', e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Client company name" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label><input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Decision maker name" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label><input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label><input value={form.website} onChange={e => f('website', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Deal Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label><select value={form.service_type} onChange={e => f('service_type', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Select --</option>{SERVICES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Source</label><select value={form.source} onChange={e => f('source', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Select --</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Estimated Value (₹)</label><input type="number" value={form.estimated_value} onChange={e => f('estimated_value', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Assign To</label><select value={form.assigned_to} onChange={e => f('assigned_to', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Select --</option>{users.filter(u => u.is_active).map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.designation || ''})</option>)}</select></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-500" /> Description</h3>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="What does the client need? Scope details, timeline, any special requirements..." />
          </div>

          <div className="flex justify-between pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-medium shadow-md disabled:opacity-50">{saving ? 'Saving...' : editData ? 'Update Lead' : 'Create Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ═══════════ LEAD DETAIL ═══════════
function LeadDetail({ lead, onBack, users }) {
  const [data, setData] = useState(null)
  const [remarkText, setRemarkText] = useState('')
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const toast = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDetail() }, [lead.id])
  const fetchDetail = async () => { try { const r = await api.get(`/api/leads/${lead.id}`); setData(r.data) } catch (e) {} }

  const addRemark = async (e) => {
    e.preventDefault(); if (!remarkText.trim()) return; setSending(true)
    try { await api.post(`/api/leads/${lead.id}/remarks`, { text: remarkText }); setRemarkText(''); fetchDetail() }
    catch (e) {} finally { setSending(false) }
  }

  const changeStage = async (stage) => { try { await api.put(`/api/leads/${lead.id}`, { stage }); fetchDetail() } catch (e) {} }

  const convertToAccount = async () => {
    if (!confirm('Convert this lead to an Account? This will create the client master record.')) return
    setConverting(true)
    try { const r = await api.post(`/api/leads/${lead.id}/convert-to-account`); toast(`Account ${r.data.account.acc_id} created!`); onBack() }
    catch (e) { toast(e.response?.data?.error || 'Error', 'error') } finally { setConverting(false) }
  }

  const uploadDoc = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('category', 'Other')
      await api.post(`/api/leads/${lead.id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      fetchDetail()
    } catch (e) {} finally { setUploading(false) }
  }

  if (!data) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse">Loading...</p></div>
  const { lead: l, remarks, documents } = data

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5"><ChevronLeft className="w-4 h-4" /> Back to Leads</button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-5">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold text-white">{l.company_name}</h1><p className="text-blue-200 text-sm mt-1">{l.lead_id} · {l.service_type || '—'} · {l.source || '—'}</p></div>
            <div className="text-right"><p className="text-3xl font-bold text-white">{l.estimated_value ? `₹${l.estimated_value.toLocaleString()}` : '—'}</p><p className="text-blue-200 text-xs">Deal Value</p></div>
          </div>
        </div>

        {/* Stage Progress */}
        <div className="px-8 py-4 border-b border-slate-100 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Lead Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => (
              <button key={s.name} onClick={() => changeStage(s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${l.stage === s.name ? `${s.color} text-white border-transparent shadow-md` : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Convert button */}
        {l.stage === 'Purchase Order' && !l.account_id && (
          <div className="px-8 py-3 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-emerald-700 font-medium">✅ PO received! Ready to create client account.</p>
              <button onClick={convertToAccount} disabled={converting} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
                <ArrowRight className="w-4 h-4" /> {converting ? 'Converting...' : 'Convert to Account'}
              </button>
            </div>
          </div>
        )}
        {l.account_id && <div className="px-8 py-3 bg-emerald-50 border-b border-emerald-100"><p className="text-sm text-emerald-700 font-medium">✅ Account created — Lead converted successfully</p></div>}

        {/* Info */}
        <div className="px-8 py-6 grid grid-cols-3 gap-6">
          <DetailField icon={User} label="Contact Person" value={l.contact_name} />
          <DetailField icon={Mail} label="Email" value={l.contact_email} />
          <DetailField icon={Phone} label="Phone" value={l.contact_phone} />
          <DetailField icon={Globe} label="Website" value={l.website} />
          <DetailField icon={User} label="Assigned To" value={l.assigned_name} />
          <DetailField icon={Calendar} label="Last Updated" value={l.updated_at?.slice(0, 10)} />
        </div>

        {l.description && (
          <div className="px-8 pb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{l.description}</p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> Documents</h2><p className="text-sm text-slate-500 mt-0.5">Upload proposals, PO, agreements, and other files</p></div>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100">
            <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <input type="file" ref={fileRef} className="hidden" onChange={e => { if (e.target.files[0]) uploadDoc(e.target.files[0]); e.target.value = '' }} />
        </div>
        <div className="px-8 py-5">
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-slate-400" /><div><p className="text-sm font-medium">{d.file_name}</p><p className="text-xs text-slate-500">{d.category} · {d.uploaded_by_name} · {d.uploaded_at?.slice(0, 10)}</p></div></div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-6">No documents uploaded yet</p>}
        </div>
      </div>

      {/* Remarks / Conversation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-500" /> Lead Remarks</h2>
          <p className="text-sm text-slate-500 mt-0.5">Date-wise conversation log — track all interactions</p>
        </div>
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
          <form onSubmit={addRemark} className="flex gap-3">
            <input value={remarkText} onChange={e => setRemarkText(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Add remark (e.g., BS 25/06 — Sent proposal, client reviewing...)" />
            <button type="submit" disabled={sending || !remarkText.trim()}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm">
              <Send className="w-4 h-4" /> {sending ? '...' : 'Add'}
            </button>
          </form>
        </div>
        <div className="px-8 py-6">
          {(!remarks || remarks.length === 0) ? (
            <div className="text-center py-8"><MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No remarks yet</p></div>
          ) : (
            <div className="space-y-4">
              {remarks.map(r => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{r.author?.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className="flex-1"><div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100"><p className="text-sm text-slate-800">{r.text}</p></div><p className="text-xs text-slate-400 mt-1.5 px-1">{r.author} · {r.created_at?.slice(0, 16).replace('T', ' ')}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div><p className="text-xs font-medium text-slate-500 uppercase">{label}</p><p className="text-sm text-slate-900 mt-0.5">{value || '—'}</p></div>
    </div>
  )
}
