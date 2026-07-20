import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Pagination from '../components/Pagination'
import { TableSkeleton } from '../components/LoadingSkeleton'
import {
  Plus, Search, Building2,
  DollarSign
} from 'lucide-react'

const INDUSTRIES = ['Finance & Banking', 'Education', 'IT & Technology', 'Government', 'PSU', 'Energy & Power', 'Healthcare', 'Defence', 'BFSI', 'Manufacturing', 'Retail', 'Other']

export default function Accounts() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">Client master records — all projects, leads, and history linked here</p>
        </div>
        {hasRole('admin', 'project_lead') && (
          <button onClick={() => { setEditAccount(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-1.5 text-sm font-medium hover:bg-emerald-800">
            <Plus className="w-3.5 h-3.5" /> New Client
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <div className="border border-slate-300 p-3">
          <p className="text-lg font-bold text-slate-900">{accounts.length}</p>
          <p className="text-xs text-slate-500">Total Clients</p>
        </div>
        <div className="border border-slate-300 p-3">
          <p className="text-lg font-bold text-slate-900">{accounts.filter(a => a.status === 'Active').length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="border border-slate-300 p-3">
          <p className="text-lg font-bold text-slate-900">{accounts.filter(a => a.sub_accounts_count > 0).length}</p>
          <p className="text-xs text-slate-500">Main Clients</p>
        </div>
        <div className="border border-slate-300 p-3">
          <p className="text-lg font-bold text-slate-900">{accounts.reduce((s, a) => s + (a.sub_accounts_count || 0), 0)}</p>
          <p className="text-xs text-slate-500">Sub-Clients</p>
        </div>
        <div className="border border-slate-300 p-3">
          <p className="text-lg font-bold text-slate-900">{accounts.reduce((s, a) => s + (a.projects_count || 0), 0)}</p>
          <p className="text-xs text-slate-500">Total Projects</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="border border-slate-300">
        <div className="p-3 border-b border-slate-300 flex gap-3 items-center">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            className="flex-1 max-w-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" placeholder="Search by company, ID, GST..." />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button onClick={load} className="px-4 py-1.5 bg-slate-100 border border-slate-300 text-sm hover:bg-slate-200">Search</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Client ID</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Company Name</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Type</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Contact Person</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Phone</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Industry</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">GST No</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Projects</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Status</th>
                <th className="px-4 py-2 text-xs font-bold text-slate-600 border-b border-slate-300">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={11}><div className="px-4 py-3"><TableSkeleton rows={5} cols={5} /></div></td></tr>
              : accounts.length === 0 ? <tr><td colSpan={11} className="text-center py-10 text-slate-500 text-sm">No clients found</td></tr>
              : accounts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 cursor-pointer border-b border-slate-200" onClick={() => navigate(`/accounts/${a.id}`)}>
                  <td className="px-4 py-2.5 text-sm font-semibold text-emerald-700">{a.acc_id}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{a.company_name}</td>
                  <td className="px-4 py-2.5 text-sm">{a.referred_by_account_id
                    ? <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">Sub-Client</span>
                    : <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium">Main {a.sub_accounts_count > 0 ? `(+${a.sub_accounts_count})` : ''}</span>
                  }</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{a.contact_name || '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{a.contact_phone || '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{a.industry || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{a.gst_no || '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">{a.projects_count}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">{a.leads_count}</td>
                  <td className="px-4 py-2.5 text-sm">{a.status}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{a.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && <div className="p-3 border-t border-slate-300"><Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} /></div>}
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
    referred_by_account_id: editData?.referred_by_account_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [parentClients, setParentClients] = useState([])
  const f = (k, v) => setForm({ ...form, [k]: v })

  useEffect(() => { if (form.account_type === 'B2B' && parentClients.length === 0) { api.get('/api/accounts', { params: { per_page: 500 } }).then(r => setParentClients(r.data.accounts)).catch(() => {}) } }, [form.account_type])

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form }
      if (!payload.referred_by_account_id) delete payload.referred_by_account_id
      else payload.referred_by_account_id = parseInt(payload.referred_by_account_id)
      if (editData) await api.put(`/api/accounts/${editData.id}`, payload)
      else await api.post('/api/accounts', payload)
      onSaved()
    } catch (e) { setError(e.response?.data?.error || 'Error') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 py-8" onClick={onClose}>
      <div className="bg-white border border-slate-300 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
        <div className="border-b border-slate-300 px-6 py-3 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-serif font-bold text-slate-800">{editData ? 'Edit Client' : 'Create New Client'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>
        <form onSubmit={save} className="p-6">
          {error && <div className="mb-4 border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}

          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 mb-0.5">Company Name <span className="text-red-500">*</span></label><input value={form.company_name} onChange={e => f('company_name', e.target.value)} required className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Industry / Sector</label><select value={form.industry} onChange={e => f('industry', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"><option value="">-- Select --</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Account Type</label><select value={form.account_type} onChange={e => f('account_type', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"><option value="B2B">B2B (Business)</option><option value="B2C">B2C (Individual)</option></select></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Website</label><input value={form.website} onChange={e => f('website', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              {form.account_type === 'B2B' && <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 mb-0.5">Parent Client <span className="text-gray-400 font-normal">(main customer)</span></label><select value={form.referred_by_account_id} onChange={e => f('referred_by_account_id', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white"><option value="">-- Select Parent Client --</option>{parentClients.filter(c => c.id !== editData?.id).map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.acc_id})</option>)}</select></div>}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Contact Person</label><input value={form.contact_name} onChange={e => f('contact_name', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Email</label><input type="email" value={form.contact_email} onChange={e => f('contact_email', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Phone</label><input value={form.contact_phone} onChange={e => f('contact_phone', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1 mb-4">Address & Tax</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2"><label className="block text-xs font-bold text-slate-600 mb-0.5">Address</label><input value={form.address} onChange={e => f('address', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">City</label><input value={form.city} onChange={e => f('city', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">State</label><input value={form.state} onChange={e => f('state', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Country</label><input value={form.country} onChange={e => f('country', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">Pincode</label><input value={form.pincode} onChange={e => f('pincode', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">GST No</label><input value={form.gst_no} onChange={e => f('gst_no', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-600 mb-0.5">PAN No</label><input value={form.pan_no} onChange={e => f('pan_no', e.target.value)} className="w-full border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          <div className="flex justify-between border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-1.5 border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-1.5 bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 disabled:opacity-50">{saving ? 'Saving...' : editData ? 'Update Client' : 'Create Client'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

