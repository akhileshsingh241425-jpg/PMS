import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, ClipboardList, X, Edit3, Trash2, FileText, Calendar, DollarSign } from 'lucide-react'

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPO, setEditPO] = useState(null)
  const [formData, setFormData] = useState({
    po_number: '', project_id: '', po_date: '', po_value: '', status: 'Received', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const { hasRole } = useAuth()

  useEffect(() => { fetchPOs(); fetchProjects() }, [])

  const fetchProjects = async () => {
    try { const res = await api.get('/api/projects'); setProjects(res.data.projects) } catch (e) { console.error(e) }
  }

  const fetchPOs = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/projects/purchase-orders/all', { params })
      setOrders(res.data.purchase_orders || [])
    } catch (err) {
      try {
        const res = await api.get('/api/purchase-orders', { params })
        setOrders(res.data.orders || [])
      } catch (e2) {
        console.error(e2)
      }
    } finally { setLoading(false) }
  }

  const handleSearch = () => fetchPOs()

  const openCreate = () => {
    setEditPO(null)
    setFormData({ po_number: '', project_id: '', po_date: '', po_value: '', status: 'Received', notes: '' })
    setShowForm(true)
  }

  const openEdit = (p) => {
    setEditPO(p)
    setFormData({
      po_number: p.po_number, project_id: p.project_id || '',
      po_date: p.po_date || '', po_value: p.po_value || '',
      status: p.status, notes: p.notes || ''
    })
    setShowForm(true)
  }

  const savePO = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...formData, po_value: formData.po_value ? parseFloat(formData.po_value) : null }
      if (editPO) {
        await api.put(`/api/projects/purchase-orders/${editPO.id}`, payload)
      } else {
        await api.post(`/api/projects/${formData.project_id}/purchase-orders`, payload)
      }
      setShowForm(false); setEditPO(null); fetchPOs()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deletePO = async (id) => {
    if (!confirm('Delete this purchase order?')) return
    try { await api.delete(`/api/projects/purchase-orders/${id}`); fetchPOs() } catch (e) { console.error(e) }
  }

  const statusColors = { 'Received': 'bg-green-50 text-green-700', 'Awaited': 'bg-yellow-50 text-yellow-700', 'Not Applicable': 'bg-gray-100 text-gray-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Track purchase orders across projects</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editPO ? 'Edit PO' : 'New Purchase Order'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={savePO} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
                <input value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required>
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_id} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PO Date</label>
                  <input type="date" value={formData.po_date} onChange={e => setFormData({...formData, po_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PO Value</label>
                  <input type="number" step="0.01" value={formData.po_value} onChange={e => setFormData({...formData, po_value: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="Received">Received</option>
                    <option value="Awaited">Awaited</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editPO ? 'Update' : 'Create'}
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
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search PO..." />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-5 py-3">PO Number</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No purchase orders found</td></tr>
              ) : orders.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-blue-600">{p.po_number}</td>
                  <td className="px-5 py-4 text-sm">{p.project_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{p.po_date || '—'}</td>
                  <td className="px-5 py-4 text-sm font-medium">{p.po_value ? `₹${parseFloat(p.po_value).toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-700'}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">{p.notes || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:text-blue-800"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deletePO(p.id)} className="text-xs text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
