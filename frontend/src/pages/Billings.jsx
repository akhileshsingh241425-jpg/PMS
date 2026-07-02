import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Search, DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3, Download } from 'lucide-react'

export default function Billings() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total_billed: 0, total_collected: 0, total_pending: 0, overdue: 0,
    monthly: []
  })
  const { hasRole } = useAuth()

  useEffect(() => { fetchBillingData() }, [])

  const fetchBillingData = async () => {
    try {
      const res = await api.get('/api/finance/billing-summary')
      setSummary(res.data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  const statCards = [
    { title: 'Total Billed', value: `₹${(summary.total_billed || 0).toLocaleString()}`, icon: Wallet, color: 'bg-blue-500' },
    { title: 'Collected', value: `₹${(summary.total_collected || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Pending', value: `₹${(summary.total_pending || 0).toLocaleString()}`, icon: TrendingDown, color: 'bg-orange-500' },
    { title: 'Overdue', value: `₹${(summary.overdue || 0).toLocaleString()}`, icon: BarChart3, color: 'bg-red-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billings</h1>
        <p className="text-gray-500 mt-1">Billing summary and revenue tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Billing</h2>
        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : summary.monthly?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Invoiced</th>
                  <th className="px-4 py-3">Collected</th>
                  <th className="px-4 py-3">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.monthly.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{m.month}</td>
                    <td className="px-4 py-3">₹{parseFloat(m.invoiced || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">₹{parseFloat(m.collected || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-orange-600">₹{parseFloat(m.pending || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No billing data available yet</p>
            <p className="text-sm text-gray-400 mt-1">Billing data will appear once invoices are created and payments recorded.</p>
          </div>
        )}
      </div>
    </div>
  )
}
