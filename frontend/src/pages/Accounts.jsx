import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import {
  Plus, Search, X, Building2, ChevronLeft, User, Phone, Mail, Globe,
  MapPin, Target, FileText, Briefcase, Edit3, Tag, Calendar, Shield,
  DollarSign, CheckCircle, XCircle
} from 'lucide-react'

const INDUSTRIES = ['Finance & Banking', 'Education', 'IT & Technology', 'Government', 'PSU', 'Energy & Power', 'Healthcare', 'Defence', 'BFSI', 'Manufacturing', 'Retail', 'Other']

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const { hasRole } = useAuth()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); load() }, [statusFilter])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  const load = async () => {
    try { const r = await api.get('/api/accounts', { params: { search, status: statusFilter, page, per_page: 25 } }); setAccounts(r.data.accounts); setPagination(r.data.pagination) }
    catch (e) {} finally { setLoading(false) }
  }

  if (selectedAccount) return <AccountDetail account={selectedAccount} onBack={() => { setSelectedAccount(null); load() }} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">Client master records — all projects, leads, and history linked here</p>
        </div>
        {hasRole('super_admin', 'project_lead') && (
          <button onClick={() => { setEditAccount(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-lg hover:opacity-90 text-sm font-medium shadow-md">
            <Plus className="w-4 h-4" /> New Account
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{accounts.length}</p><p className="text-xs text-slate-500">Total Accounts</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{accounts.filter(a => a.status === 'Active').length}</p><p className="text-xs text-slate-500">Active</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-indigo-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{accounts.reduce((s, a) => s + (a.projects_count || 0), 0)}</p><p className="text-xs text-slate-500">Total Projects</p></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Target className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-2xl font-bold text-slate-900">{accounts.reduce((s, a) => s + (a.opportunities_count || 0), 0)}</p><p className="text-xs text-slate-500">Total Opportunities</p></div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Search by company, ID, GST..." />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onClick={load} className="px-4 py-2.5 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200">Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Account ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Company Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Contact Person</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Industry</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">GST No</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Projects</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Leads</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={10}><div className="px-5 py-4"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              : accounts.length === 0 ? <tr><td colSpan={10} className="text-center py-12"><Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 font-medium">No accounts found</p><p className="text-sm text-slate-400 mt-1">Accounts are auto-created when leads are converted</p></td></tr>
              : accounts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedAccount(a)}>
                  <td className="px-5 py-4 text-sm font-semibold text-emerald-600">{a.acc_id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0"><span className="text-emerald-600 text-xs font-bold">{a.company_name?.[0]}</span></div>
                      <span className="text-sm font-medium text-slate-900">{a.company_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{a.contact_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{a.contact_phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{a.industry || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 font-mono text-xs">{a.gst_no || '—'}</td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">{a.projects_count}</span></td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{a.leads_count}</span></td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></td>
                  <td className="px-5 py-4 text-xs text-slate-500">{a.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && <div className="px-5"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
        </div>
      </div>

      {showForm && <AccountForm editData={editAccount} onClose={() => { setShowForm(false); setEditAccount(null) }} onSaved={() => { setShowForm(false); setEditAccount(null); load() }} />}
    </div>
  )
}

// ═══════════ ACCOUNT FORM ═══════════
function AccountForm({ editData, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_name: editData?.company_name || '', contact_name: editData?.contact_name || '',
    contact_email: editData?.contact_email || '', contact_phone: editData?.contact_phone || '',
    website: editData?.website || '', address: editData?.address || '',
    city: editData?.city || '', state: editData?.state || '',
    country: editData?.country || 'India', pincode: editData?.pincode || '',
    gst_no: editData?.gst_no || '', pan_no: editData?.pan_no || '',
    industry: editData?.industry || '', account_type: editData?.account_type || 'B2B',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const f = (k, v) => setForm({ ...form, [k]: v })

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editData) await api.put(`/api/accounts/${editData.id}`, form)
      else await api.post('/api/accounts', form)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <div><h2 className="text-xl font-bold text-slate-900">{editData ? 'Edit Account' : 'Create New Account'}</h2><p className="text-sm text-slate-500 mt-0.5">Client master record with complete details</p></div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={save} className="px-8 py-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-500" /> Company Information</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name <span className="text-red-500">*</span></label><input value={form.company_name} onChange={e => f('company_name', e.target.value)} required className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Registered company name" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Industry / Sector</label><select value={form.industry} onChange={e => f('industry', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"><option value="">-- Select --</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Account Type</label><select value={form.account_type} onChange={e => f('account_type', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"><option value="B2B">B2B (Business)</option><option value="B2C">B2C (Individual)</option></select></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label><input value={form.website} onChange={e => f('website', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="www.company.com" /></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Primary Contact</h3>
            <div className="grid grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Person</label><input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Key decision maker" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label><input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> Address & Tax</h3>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label><input value={form.address} onChange={e => f('address', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Street address" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">City</label><input value={form.city} onChange={e => f('city', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">State</label><input value={form.state} onChange={e => f('state', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label><input value={form.country} onChange={e => f('country', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Pincode</label><input value={form.pincode} onChange={e => f('pincode', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">GST Number</label><input value={form.gst_no} onChange={e => f('gst_no', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="22AAAAA0000A1Z5" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1.5">PAN Number</label><input value={form.pan_no} onChange={e => f('pan_no', e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-mono" placeholder="AAAAA0000A" /></div>
            </div>
          </div>

          <div className="flex justify-between pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm bg-slate-100 rounded-lg font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-8 py-2.5 text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg font-medium shadow-md disabled:opacity-50">{saving ? 'Saving...' : editData ? 'Update Account' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ═══════════ ACCOUNT DETAIL ═══════════
function AccountDetail({ account, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { api.get(`/api/accounts/${account.id}`).then(r => setData(r.data)).catch(e => {}).finally(() => setLoading(false)) }, [account.id])

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse">Loading account details...</p></div>
  if (!data) return null
  const { account: acc, opportunities, leads, projects } = data

  return (
    <div className="max-w-6xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5"><ChevronLeft className="w-4 h-4" /> Back to Accounts</button>

      {/* Account Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"><span className="text-white text-2xl font-bold">{acc.company_name?.[0]}</span></div>
              <div>
                <h1 className="text-2xl font-bold text-white">{acc.company_name}</h1>
                <p className="text-emerald-100 text-sm mt-1">{acc.acc_id} · {acc.industry || 'No industry'} · {acc.account_type}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${acc.status === 'Active' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-100'}`}>{acc.status}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <DetailField icon={User} label="Contact Person" value={acc.contact_name} />
            <DetailField icon={Mail} label="Email" value={acc.contact_email} />
            <DetailField icon={Phone} label="Phone" value={acc.contact_phone} />
            <DetailField icon={Globe} label="Website" value={acc.website} />
            <DetailField icon={MapPin} label="Address" value={[acc.address, acc.city, acc.state].filter(Boolean).join(', ')} />
            <DetailField icon={MapPin} label="Country / Pincode" value={`${acc.country || '—'} ${acc.pincode ? `· ${acc.pincode}` : ''}`} />
            <DetailField icon={Shield} label="GST Number" value={acc.gst_no} mono />
            <DetailField icon={Shield} label="PAN Number" value={acc.pan_no} mono />
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <RelatedTable title="Opportunities" icon={Target} color="from-purple-500 to-violet-600" count={opportunities.length}
        headers={['Opp ID', 'Service', 'Stage', 'Value', 'Assigned', 'Updated']}
        rows={opportunities.map(o => [
          <span className="font-semibold text-violet-600">{o.opp_id}</span>,
          o.service_interest || '—',
          <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">{o.stage}</span>,
          o.estimated_value ? <span className="font-semibold text-emerald-600">₹{o.estimated_value.toLocaleString()}</span> : '—',
          o.assigned_name || '—',
          <span className="text-xs text-slate-400">{o.updated_at?.slice(0, 10)}</span>,
        ])} />

      {/* Leads */}
      <RelatedTable title="Leads" icon={FileText} color="from-blue-500 to-cyan-600" count={leads.length}
        headers={['Lead ID', 'Service', 'Stage', 'Value', 'Assigned', 'Created']}
        rows={leads.map(l => [
          <span className="font-semibold text-blue-600">{l.lead_id}</span>,
          l.service_type || '—',
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{l.stage}</span>,
          l.estimated_value ? <span className="font-semibold text-emerald-600">₹{l.estimated_value.toLocaleString()}</span> : '—',
          l.assigned_name || '—',
          <span className="text-xs text-slate-400">{l.created_at?.slice(0, 10)}</span>,
        ])} />

      {/* Projects */}
      <RelatedTable title="Projects" icon={Briefcase} color="from-indigo-500 to-violet-600" count={projects.length}
        headers={['Project ID', 'Title', 'Service', 'Stage', 'PM', 'Value']}
        rows={projects.map(p => [
          <span className="font-semibold text-indigo-600">{p.proj_id}</span>,
          <span className="font-medium">{p.title}</span>,
          p.service_type || '—',
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{p.stage}</span>,
          p.pm_name || '—',
          p.total_value ? <span className="font-semibold text-emerald-600">₹{p.total_value.toLocaleString()}</span> : '—',
        ])} />
    </div>
  )
}

function DetailField({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-500" /></div>
      <div><p className="text-xs font-medium text-slate-500 uppercase">{label}</p><p className={`text-sm text-slate-900 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p></div>
    </div>
  )
}

function RelatedTable({ title, icon: Icon, color, count, headers, rows }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{count}</span>
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50">{headers.map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => <tr key={i} className="hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="px-5 py-3">{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8"><p className="text-sm text-slate-400">No {title.toLowerCase()} yet</p></div>
      )}
    </div>
  )
}
