import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { TrendingUp, FileText, Download, BarChart3, PieChart, Activity } from 'lucide-react'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const { hasRole } = useAuth()

  useEffect(() => { fetchReports() }, [])

  const fetchReports = async () => {
    try {
      const res = await api.get('/api/reports/dashboard')
      setReportData(res.data)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  const reportCards = [
    { title: 'Leads Pipeline', desc: 'View all leads by stage and conversion rate', icon: Activity, color: 'blue' },
    { title: 'Project Status', desc: 'Projects by status, PM, and timeline', icon: BarChart3, color: 'indigo' },
    { title: 'Revenue Report', desc: 'Monthly revenue, invoices, and collections', icon: TrendingUp, color: 'green' },
    { title: 'Client Report', desc: 'Active clients, projects, and billing summary', icon: PieChart, color: 'purple' },
    { title: 'Employee Report', desc: 'Attendance, expenses, and leave summary', icon: FileText, color: 'orange' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and view reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map(r => (
          <div key={r.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
              r.color === 'blue' ? 'bg-blue-50' : r.color === 'indigo' ? 'bg-indigo-50' :
              r.color === 'green' ? 'bg-green-50' : r.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'
            }`}>
              <r.icon className={`w-6 h-6 ${
                r.color === 'blue' ? 'text-blue-600' : r.color === 'indigo' ? 'text-indigo-600' :
                r.color === 'green' ? 'text-green-600' : r.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
              }`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Download className="w-4 h-4" /> Generate Report
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h2>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
          <p>Select a report above to generate detailed analytics</p>
        </div>
      </div>
    </div>
  )
}
