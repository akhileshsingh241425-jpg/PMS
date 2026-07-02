import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Receipt, X, Edit3, Trash2, FileText, Calendar, DollarSign, Download } from 'lucide-react'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState(null)
  const [formData, setFormData] = useState({
    invoice_number: '', client_id: '', invoice_date: '', due_date: '',
    base_amount: '', gst_rate: 18, total_amount: '', status: 'Unpaid', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchInvoices(); fetchClients() }, [])

  const fetchClients = async () => {
    try { const res = await api.get('/api/clients'); setClients(res.data.clients) } catch (e) { console.error(e) }
  }

  const fetchInvoices = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/invoices', { params })
      setInvoices(res.data.invoices || [])
    } catch (err) {
      try {
        const res = await api.get('/api/finance/invoices', { params })
        setInvoices(res.data.invoices || [])
      } catch (e2) { console.error(e2) }
    } finally { setLoading(false) }
  }

  const handleSearch = () => fetchInvoices()

  const totalAmount = parseFloat(formData.base_amount || 0) + (parseFloat(formData.base_amount || 0) * parseFloat(formData.gst_rate || 0) / 100)

  const openCreate = () => {
    setEditInvoice(null)
    setFormData({ invoice_number: '', client_id: '', invoice_date: '', due_date: '', base_amount: '', gst_rate: 18, total_amount: '', status: 'Unpaid', notes: '' })
    setShowForm(true)
  }

  const saveInvoice = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...formData,
        base_amount: parseFloat(formData.base_amount) || 0,
        gst_rate: parseFloat(formData.gst_rate) || 0,
        total_amount: totalAmount,
        gst_amount: totalAmount - parseFloat(formData.base_amount || 0)
      }
      await api.post('/api/finance/invoices', payload)
      setShowForm(false); fetchInvoices()
    } catch (err) {
      try {
        await api.post('/api/invoices', payload)
        setShowForm(false); fetchInvoices()
      } catch (e2) { console.error(e2) }
    } finally { setSaving(false) }
  }

  const statusColors = { 'Unpaid': 'bg-red-50 text-red-700', 'Partial': 'bg-yellow-50 text-yellow-700', 'Paid': 'bg-green-50 text-green-700', 'Overdue': 'bg-orange-50 text-orange-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage client invoices and payments</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">New Invoice</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveInvoice} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No *</label>
                  <input value={formData.invoice_number} onChange={e => setFormData({...formData, invoice_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required>
                    <option value="">Select Client</option>
                    {clients.filter(c => c.status === 'Active').map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input type="date" value={formData.invoice_date} onChange={e => setFormData({...formData, invoice_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (₹)</label>
                  <input type="number" step="0.01" value={formData.base_amount} onChange={e => setFormData({...formData, base_amount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                  <input type="number" step="0.01" value={formData.gst_rate} onChange={e => setFormData({...formData, gst_rate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-700">Total: <span className="font-bold text-lg">₹{totalAmount.toFixed(2)}</span></p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search invoices..." />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-blue-600">{inv.invoice_number}</td>
                  <td className="px-5 py-4 text-sm">{inv.client_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{inv.invoice_date || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{inv.due_date || '—'}</td>
                  <td className="px-5 py-4 text-sm font-medium">₹{parseFloat(inv.total_amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-700'}`}>{inv.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs text-blue-600 hover:text-blue-800"><Download className="w-3.5 h-3.5 inline mr-1" />PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
