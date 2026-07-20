import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  Search, Shield, User, Briefcase, Key, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Save, RefreshCw
} from 'lucide-react'

const PERMISSION_LABELS = {
  'dashboard': { label: 'Dashboard', icon: '📊' },
  'projects': { label: 'Projects', icon: '📁' },
  'leads': { label: 'Leads', icon: '📞' },
  'accounts': { label: 'Clients', icon: '🏢' },
  'opportunities': { label: 'Opportunities', icon: '🎯' },
  'users': { label: 'Users', icon: '👥' },
}

export default function Admin() {
  const { hasRole } = useAuth()
  const [employees, setEmployees] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedUser, setExpandedUser] = useState(null)
  const [saving, setSaving] = useState({})

  if (!hasRole('admin')) return <div className="text-center py-12 text-red-500 font-medium">Access Denied — Admin only</div>

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [eRes, pRes] = await Promise.all([
        api.get('/api/admin/employees'),
        api.get('/api/admin/permissions'),
      ])
      setEmployees(eRes.data.employees)
      setPermissions(pRes.data.permissions)
    } catch (e) { alert('Failed to load') }
    finally { setLoading(false) }
  }

  const groupedPerms = permissions.reduce((acc, p) => {
    const mod = p.module || 'other'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  const togglePermission = async (emp, permCode, currentVal) => {
    setSaving(prev => ({ ...prev, [`${emp.id}-${permCode}`]: true }))
    try {
      const r = await api.put(`/api/admin/users/${emp.id}/permissions`, {
        permissions: { [permCode]: !currentVal }
      })
      setEmployees(prev => prev.map(e =>
        e.id === emp.id ? { ...e, permissions: r.data.permissions } : e
      ))
    } catch (e) { alert('Failed to update permission') }
    finally { setSaving(prev => ({ ...prev, [`${emp.id}-${permCode}`]: false })) }
  }

  const toggleRole = async (emp, roleId) => {
    const newRoles = emp.role_ids.includes(roleId)
      ? emp.role_ids.filter(r => r !== roleId)
      : [...emp.role_ids, roleId]
    setSaving(prev => ({ ...prev, [`role-${emp.id}`]: true }))
    try {
      const r = await api.put(`/api/admin/users/${emp.id}/roles`, { role_ids: newRoles })
      setEmployees(prev => prev.map(e =>
        e.id === emp.id ? { ...e, roles: r.data.user.roles, role_ids: r.data.user.role_ids } : e
      ))
    } catch (e) { alert('Failed to update roles') }
    finally { setSaving(prev => ({ ...prev, [`role-${emp.id}`]: false })) }
  }

  const filtered = employees.filter(e =>
    !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.designation?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse">Loading employees...</p></div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Manage employees, roles, permissions & project assignments</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 text-sm hover:bg-slate-200"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-300 text-sm"
          placeholder="Search by name, email, or designation..." />
      </div>

      {/* Employee count */}
      <p className="text-sm text-slate-500 mb-4">{filtered.length} of {employees.length} employees</p>

      {/* Employee List */}
      <div className="space-y-3">
        {filtered.map(emp => (
          <div key={emp.id} className="bg-white  border border-slate-200 overflow-hidden">
            {/* Header */}
            <div
              onClick={() => setExpandedUser(expandedUser === emp.id ? null : emp.id)}
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
            >
              <div className="w-10 h-10 bg-blue-100  flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">
                  {emp.full_name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{emp.full_name}</p>
                <p className="text-xs text-slate-500">{emp.designation || emp.department || '—'}</p>
              </div>
              <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{emp.projects?.length || 0} projects</span>
                <span className="flex items-center gap-1"><Key className="w-3 h-3" />{emp.roles?.join(', ') || 'No role'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2  ${emp.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                {expandedUser === emp.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedUser === emp.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-6">
                {/* Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-slate-400">Email</p><p className="font-medium">{emp.email}</p></div>
                  <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium">{emp.phone || '—'}</p></div>
                  <div><p className="text-xs text-slate-400">Emp ID</p><p className="font-medium">{emp.emp_id || '—'}</p></div>
                  <div><p className="text-xs text-slate-400">Department</p><p className="font-medium">{emp.department || '—'}</p></div>
                </div>

                {/* Projects */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Briefcase className="w-4 h-4" /> Assigned Projects ({emp.projects?.length || 0})</h4>
                  {emp.projects?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {emp.projects.map(p => (
                        <span key={p.id} className="px-3 py-1.5 bg-white border border-slate-200  text-xs font-medium text-slate-700">
                          {p.proj_id} — {p.title?.slice(0, 30)}
                          <span className={`ml-2 px-1.5 py-0.5  text-[10px] ${p.stage === 'Closed' || p.stage === 'Cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{p.stage}</span>
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">No projects assigned</p>}
                </div>

                {/* Roles */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Key className="w-4 h-4" /> Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {[{ id: 1, code: 'super_admin', name: 'Super Admin' }, { id: 2, code: 'project_lead', name: 'Project Lead' }, { id: 3, code: 'consultant', name: 'Consultant' }, { id: 4, code: 'bd_executive', name: 'BD Executive' }, { id: 5, code: 'employee', name: 'Employee' }].map(role => (
                      <label key={role.id} className={`flex items-center gap-2 px-3 py-2  border cursor-pointer text-xs font-medium transition-all ${
                        emp.role_ids?.includes(role.id) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}>
                        <input type="checkbox" checked={emp.role_ids?.includes(role.id) || false}
                          onChange={() => toggleRole(emp, role.id)}
                          disabled={saving[`role-${emp.id}`]}
                          className=" text-indigo-600 focus:ring-indigo-500" />
                        {role.name}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Module Permissions */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Shield className="w-4 h-4" /> Module Access Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(groupedPerms).map(([module, perms]) => (
                      <div key={module} className="bg-white  border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{PERMISSION_LABELS[module]?.label || module}</p>
                        <div className="space-y-1.5">
                          {perms.map(perm => {
                            const isGranted = emp.permissions?.[perm.code] !== false
                            const savingKey = `${emp.id}-${perm.code}`
                            return (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                <button
                                  onClick={() => togglePermission(emp, perm.code, isGranted)}
                                  disabled={saving[savingKey]}
                                  className={`w-5 h-5  flex items-center justify-center text-white text-xs transition-all ${
                                    saving[savingKey] ? 'bg-slate-300' : isGranted ? 'bg-green-500' : 'bg-red-400'
                                  }`}
                                >
                                  {saving[savingKey] ? '...' : isGranted ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                </button>
                                <span className="text-xs text-slate-600">{perm.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


