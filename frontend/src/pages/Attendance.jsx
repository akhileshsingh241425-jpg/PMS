import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Clock, Search, CheckCircle, XCircle, AlertCircle, User, Calendar } from 'lucide-react'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const { user, hasRole } = useAuth()

  useEffect(() => { fetchAttendance(); fetchUsers() }, [selectedDate])

  const fetchUsers = async () => {
    try { const res = await api.get('/api/auth/users'); setUsers(res.data.users) } catch (e) { console.error(e) }
  }

  const fetchAttendance = async () => {
    try {
      const params = { date: selectedDate, search }
      const res = await api.get('/api/attendance', { params })
      setRecords(res.data.records || [])
    } catch (err) {
      console.error(err)
      setRecords([])
    } finally { setLoading(false) }
  }

  const markAttendance = async (userId, status) => {
    try {
      await api.post('/api/attendance', {
        user_id: userId, attendance_date: selectedDate, status
      })
      fetchAttendance()
    } catch (err) { console.error(err) }
  }

  const statusColors = {
    'Present': 'bg-green-50 text-green-700 border-green-200',
    'Absent': 'bg-red-50 text-red-700 border-red-200',
    'Late': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Half Day': 'bg-orange-50 text-orange-700 border-orange-200',
    'Leave': 'bg-blue-50 text-blue-700 border-blue-200',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Track daily employee attendance</p>
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchAttendance()}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search employee..." />
          </div>
          <button onClick={fetchAttendance} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
          <span className="text-sm text-gray-500">{selectedDate}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No attendance records for this date
                </td></tr>
              ) : records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{r.user_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{r.department || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : '—'}</td>
                  <td className="px-5 py-4">
                    {hasRole('super_admin', 'hr_manager') && (
                      <div className="flex gap-1">
                        {['Present', 'Absent', 'Late', 'Half Day', 'Leave'].map(s => (
                          <button key={s} onClick={() => markAttendance(r.user_id, s)}
                            className={`px-2 py-0.5 text-xs rounded border ${r.status === s ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
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
