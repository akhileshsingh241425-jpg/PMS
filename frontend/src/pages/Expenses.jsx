import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Wallet, X, Edit3, Trash2, User, Calendar, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const EXPENSE_STATUSES = ['Pending', 'Approved', 'Rejected']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [formData, setFormData] = useState({
    amount: '', expense_date: '', category_id: '', description: '', project_id: ''
  })
  const [saving, setSaving] = useState(false)
  const { user, hasRole } = useAuth()

  useEffect(() => { fetchExpenses(); fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/expense-categories')
      setCategories(res.data.categories || [])
    } catch (e) {
      try {
        const res = await api.get('/api/finance/categories')
        setCategories(res.data.categories || [])
      } catch (e2) { console.error(e2) }
    }
  }

  const fetchExpenses = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/expenses', { params })
      setExpenses(res.data.expenses || [])
    } catch (err) {
      console.error(err)
      setExpenses([])
    } finally { setLoading(false) }
  }

  const handleSearch = () => fetchExpenses()

  const openCreate = () => {
    setEditExpense(null)
    setFormData({ amount: '', expense_date: '', category_id: '', description: '', project_id: '' })
    setShowForm(true)
  }

  const saveExpense = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) }
      if (editExpense) {
        await api.put(`/api/expenses/${editExpense.id}`, payload)
      } else {
        await api.post('/api/expenses', payload)
      }
      setShowForm(false); setEditExpense(null); fetchExpenses()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const deleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return
    try { await api.delete(`/api/expenses/${id}`); fetchExpenses() } catch (e) { console.error(e) }
  }

  const updateStatus = async (id, status) => {
    try { await api.patch(`/api/expenses/${id}/status`, { status }); fetchExpenses() } catch (e) { console.error(e) }
  }

  const statusColors = { 'Pending': 'bg-yellow-50 text-yellow-700', 'Approved': 'bg-green-50 text-green-700', 'Rejected': 'bg-red-50 text-red-700' }
  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track employee expenses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{editExpense ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                    <option value="">Select</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editExpense ? 'Update' : 'Submit'}
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
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search expenses..." />
          </div>
          <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No expenses recorded</td></tr>
              ) : expenses.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">{e.employee_name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-700 max-w-[200px] truncate">{e.description}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{e.category_name || '—'}</td>
                  <td className="px-5 py-4 font-medium">₹{parseFloat(e.amount).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{e.expense_date || '—'}</td>
                  <td className="px-5 py-4">
                    {hasRole('super_admin', 'it_manager') ? (
                      <select value={e.status} onChange={e2 => updateStatus(e.id, e2.target.value)}
                        className={`px-2 py-0.5 rounded text-xs font-medium border-0 outline-none ${statusColors[e.status] || 'bg-gray-100 text-gray-700'}`}>
                        {EXPENSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-700'}`}>{e.status}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {e.status === 'Pending' && (
                        <>
                          <button onClick={() => { setEditExpense(e); setFormData({ amount: e.amount, expense_date: e.expense_date, category_id: e.category_id || '', description: e.description, project_id: e.project_id || '' }); setShowForm(true) }}
                            className="text-xs text-blue-600 hover:text-blue-800"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteExpense(e.id)} className="text-xs text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
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
