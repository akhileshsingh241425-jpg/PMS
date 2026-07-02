import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Plus, Search, Users, X, Edit3, User, Mail, Phone, Building, Shield, Award, Calendar } from 'lucide-react'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const { hasRole } = useAuth()

  useEffect(() => { fetchEmployees(); fetchDepartments() }, [])

  const fetchDepartments = async () => {
    try { const res = await api.get('/api/auth/departments'); setDepartments(res.data.departments || []) } catch (e) { console.error(e) }
  }

  const fetchEmployees = async () => {
    try {
      const params = { search }
      const res = await api.get('/api/auth/users', { params })
      setEmployees(res.data.users || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleSearch = () => fetchEmployees()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage employee records</p>
        </div>
      </div>

      {selectedEmployee ? (
        <EmployeeDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} departments={departments} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Search employees..." />
            </div>
            <button onClick={handleSearch} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Search</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">No employees found</td></tr>
                ) : employees.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEmployee(e)}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{e.first_name} {e.last_name}</p>
                          <p className="text-xs text-gray-500">{e.employee_id || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{e.department || '—'}</td>
                    <td className="px-5 py-4 text-sm">{e.designation || '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{e.email}</td>
                    <td className="px-5 py-4 text-sm">{e.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">{e.roles?.join(', ') || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      {e.is_active ? <span className="text-green-600 text-sm flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Active</span>
                        : <span className="text-red-600 text-sm flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Inactive</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeDetail({ employee, onBack, departments }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        ← Back to Employees
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h1>
            <p className="text-sm text-gray-500">{employee.employee_id || 'No ID'} · {employee.designation || 'No designation'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium">{employee.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm">{employee.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Department</p>
            <p className="text-sm">{employee.department || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Designation</p>
            <p className="text-sm">{employee.designation || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Reporting Manager</p>
            <p className="text-sm">{employee.reporting_manager || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Experience</p>
            <p className="text-sm">{employee.experience_years ? `${employee.experience_years} years` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Roles</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {employee.roles?.map(r => (
                <span key={r} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{r}</span>
              )) || '—'}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="text-sm">{employee.created_at?.slice(0, 10) || '—'}</p>
          </div>
          {employee.certifications?.length > 0 && (
            <div className="col-span-full">
              <p className="text-xs text-gray-500 mb-1">Certifications</p>
              <div className="flex flex-wrap gap-2">
                {employee.certifications.map((cert, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                    <Award className="w-3 h-3" /> {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
