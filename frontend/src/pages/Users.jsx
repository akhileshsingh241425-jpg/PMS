import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import {
  Plus, Search, X, Edit3, UserCheck, UserX,
  Shield, Briefcase, Key, CheckCircle, XCircle,
  ChevronDown, ChevronRight, RefreshCw, Link, Unlink
} from 'lucide-react'

const DESIGNATIONS = ['Director','CEO','CTO','Project Lead','Senior Consultant','Security Consultant','Senior Auditor','Auditor','Junior Auditor','Security Analyst','BD Manager','BD Executive','Admin Manager','Finance Manager','Other']
const CERTS = ['CEH','CISSP','CISA','CISM','ISO 27001 LA','DISA','OSCP','CRTP','CompTIA Security+']
const PERMISSION_LABELS = {
  dashboard: 'Dashboard', projects: 'Projects', leads: 'Leads',
  accounts: 'Accounts', opportunities: 'Opportunities', users: 'Users',
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [depts, setDepts] = useState([])
  const [permissions, setPermissions] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ first_name:'',last_name:'',email:'',password:'',phone:'',designation:'',department_id:'',manager_id:'',role_ids:[],certifications:[],experience_years:'' })
  const [expandedUser, setExpandedUser] = useState(null)
  const [permSaving, setPermSaving] = useState({})
  const [allProjects, setAllProjects] = useState([])
  const [assignProject, setAssignProject] = useState({})
  const [assigning, setAssigning] = useState({})
  const { hasRole } = useAuth()
  const toast = useToast()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{load();loadRoles();loadDepts();if(hasRole('admin'))loadPerms()},[])
  const load = async()=>{try{const r=await api.get('/api/auth/users');setUsers(r.data.users)}catch(e){}}
  const loadRoles = async()=>{try{const r=await api.get('/api/auth/roles');setRoles(r.data.roles)}catch(e){}}
  const loadDepts = async()=>{try{const r=await api.get('/api/auth/departments');setDepts(r.data.departments)}catch(e){}}
  const loadPerms = async()=>{try{const r=await api.get('/api/admin/permissions');setPermissions(r.data.permissions)}catch(e){}}
  const loadProjects = async()=>{try{const r=await api.get('/api/projects',{params:{per_page:500}});setAllProjects(r.data.projects)}catch(e){}}

  const assignToProject = async (uid, pid) => {
    setAssigning(prev => ({...prev, [uid]: true}))
    try {
      await api.post(`/api/projects/${pid}/team`, { user_id: uid })
      toast('Assigned to project')
      load()
    } catch (e) { toast(e.response?.data?.error || 'Failed', 'error') }
    finally { setAssigning(prev => ({...prev, [uid]: false})); setAssignProject(prev => ({...prev, [uid]: ''})) }
  }

  const removeFromProject = async (uid, teamId) => {
    try {
      await api.delete(`/api/projects/team/${teamId}`)
      toast('Removed from project', 'info')
      load()
    } catch (e) { toast('Failed', 'error') }
  }

  const openCreate = ()=>{setEditUser(null);setError('');setForm({first_name:'',last_name:'',email:'',password:'',phone:'',designation:'',department_id:'',manager_id:'',role_ids:[5],certifications:[],experience_years:''});setShowForm(true)}
  const openEdit = (u)=>{setEditUser(u);setError('');setForm({first_name:u.first_name,last_name:u.last_name||'',email:u.email,password:'',phone:u.phone||'',designation:u.designation||'',department_id:u.department_id||'',manager_id:u.manager_id||'',role_ids:u.role_ids||[],certifications:u.certifications||[],experience_years:u.experience_years||''});setShowForm(true)}

  const save = async(e)=>{
    e.preventDefault();setSaving(true);setError('')
    try{
      const p={...form}
      if(p.department_id)p.department_id=parseInt(p.department_id);else delete p.department_id
      if(p.manager_id)p.manager_id=parseInt(p.manager_id);else delete p.manager_id
      if(p.experience_years)p.experience_years=parseFloat(p.experience_years);else delete p.experience_years
      if(!p.password)delete p.password
      if(editUser) await api.put(`/api/auth/users/${editUser.id}`,p)
      else await api.post('/api/auth/users',p)
      setShowForm(false);load()
    }catch(e){setError(e.response?.data?.error||'Error')}finally{setSaving(false)}
  }

  const toggleRole=(rid)=>setForm(f=>({...f,role_ids:f.role_ids.includes(rid)?f.role_ids.filter(i=>i!==rid):[...f.role_ids,rid]}))
  const toggleCert=(c)=>setForm(f=>({...f,certifications:f.certifications.includes(c)?f.certifications.filter(i=>i!==c):[...f.certifications,c]}))

  const toggleUserRole = async (uid, roleId) => {
    const u = users.find(x => x.id === uid)
    const newRoles = u.role_ids.includes(roleId) ? u.role_ids.filter(r => r !== roleId) : [...u.role_ids, roleId]
    setPermSaving(prev => ({ ...prev, [`role-${uid}`]: true }))
    try {
      const r = await api.put(`/api/admin/users/${uid}/roles`, { role_ids: newRoles })
      setUsers(prev => prev.map(e => e.id === uid ? { ...e, roles: r.data.user.roles, role_ids: r.data.user.role_ids } : e))
    } catch (e) { toast('Failed to update roles', 'error') }
    finally { setPermSaving(prev => ({ ...prev, [`role-${uid}`]: false })) }
  }

  const togglePermission = async (uid, permCode, currentVal) => {
    setPermSaving(prev => ({ ...prev, [`${uid}-${permCode}`]: true }))
    try {
      const r = await api.put(`/api/admin/users/${uid}/permissions`, { permissions: { [permCode]: !currentVal } })
      setUsers(prev => prev.map(e => e.id === uid ? { ...e, permissions: r.data.permissions } : e))
    } catch (e) { toast('Failed to update permission', 'error') }
    finally { setPermSaving(prev => ({ ...prev, [`${uid}-${permCode}`]: false })) }
  }

  const groupedPerms = permissions.reduce((acc, p) => {
    const mod = p.module || 'other'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  const filtered = users.filter(u=>!search||u.full_name?.toLowerCase().includes(search.toLowerCase())||u.email?.includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-serif font-bold">Team & Permissions</h1><p className="text-gray-500 text-sm mt-1">Manage team members, roles, project assignments & module access</p></div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{load();if(hasRole('admin'))loadPerms()}} className="flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-300 text-sm hover:bg-slate-200"><RefreshCw className="w-4 h-4" /> Refresh</button>
          {hasRole('admin')&&<button onClick={openCreate} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 hover:bg-blue-800 text-sm"><Plus className="w-4 h-4"/> Add User</button>}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={()=>setShowForm(false)}><div className="bg-white   w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b"><h2 className="font-semibold">{editUser?'Edit User':'Add User'}</h2><button onClick={()=>setShowForm(false)}><X className="w-5 h-5"/></button></div>
        <form onSubmit={save} className="p-5 space-y-5">
          {error&&<p className="text-sm text-red-600 bg-red-50 px-3 py-2 ">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">First Name *</label><input value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none" required/></div>
            <div><label className="text-sm font-medium">Last Name</label><input value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"/></div>
            <div><label className="text-sm font-medium">Email *</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none" required/></div>
            <div><label className="text-sm font-medium">{editUser?'New Password':'Password *'}</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none" {...(!editUser?{required:true,minLength:6}:{})}/></div>
            <div><label className="text-sm font-medium">Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"/></div>
            <div><label className="text-sm font-medium">Experience (Years)</label><input type="number" step="0.1" value={form.experience_years} onChange={e=>setForm({...form,experience_years:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"/></div>
            <div><label className="text-sm font-medium">Designation</label><select value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"><option value="">Select</option>{DESIGNATIONS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="text-sm font-medium">Department</label><select value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"><option value="">Select</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="col-span-2"><label className="text-sm font-medium">Reports To</label><select value={form.manager_id} onChange={e=>setForm({...form,manager_id:e.target.value})} className="mt-1 w-full px-3 py-2 border  text-sm outline-none"><option value="">None</option>{users.filter(u=>u.is_active&&u.id!==editUser?.id).map(u=><option key={u.id} value={u.id}>{u.full_name} — {u.designation||''}</option>)}</select></div>
          </div>
          <div><label className="text-sm font-medium block mb-2">Roles</label><div className="flex flex-wrap gap-2">{roles.map(r=>(<label key={r.id} className={`px-3 py-1.5  text-sm border cursor-pointer ${form.role_ids.includes(r.id)?'bg-blue-50 border-blue-300 text-blue-700':'bg-gray-50 border-gray-200'}`}><input type="checkbox" className="hidden" checked={form.role_ids.includes(r.id)} onChange={()=>toggleRole(r.id)}/>{r.name}</label>))}</div></div>
          <div><label className="text-sm font-medium block mb-2">Certifications</label><div className="flex flex-wrap gap-2">{CERTS.map(c=>(<button key={c} type="button" onClick={()=>toggleCert(c)} className={`px-3 py-1  text-sm border ${form.certifications.includes(c)?'bg-green-50 border-green-300 text-green-700':'bg-gray-50 border-gray-200'}`}>{form.certifications.includes(c)?'✓ ':''}{c}</button>))}</div></div>
          <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm bg-gray-100 ">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-700 text-white  disabled:opacity-50">{saving?'...':editUser?'Update':'Create'}</button></div>
        </form>
      </div></div>)}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full max-w-xs pl-9 pr-3 py-2 border  text-sm outline-none" placeholder="Search by name or email..." />
      </div>

      <p className="text-sm text-slate-500 mb-3">{filtered.length} of {users.length} team members</p>

      {/* User List */}
      <div className="space-y-2">
        {filtered.map(u => {
          const isSuperAdmin = hasRole('admin')
          const isExpanded = expandedUser === u.id
          return (
            <div key={u.id} className="bg-white  border border-slate-200 overflow-hidden">
              {/* Row Header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedUser(isExpanded ? null : u.id)}>
                <div className="w-9 h-9 bg-blue-100  flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold">{u.full_name?.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.designation || u.department || u.email}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 shrink-0">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700  text-[10px] font-medium">{u.emp_id || '—'}</span>
                    <span>{u.roles?.map(r => r.replace(/_/g,' ')).join(', ') || 'No role'}</span>
                  </div>
                  <span>{u.is_active ? <UserCheck className="w-4 h-4 text-green-500" /> : <UserX className="w-4 h-4 text-red-500" />}</span>
                  {isSuperAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); openEdit(u) }} className="p-1.5  hover:bg-slate-200 text-slate-400 hover:text-blue-700">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-5">
                  {/* Info Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-slate-400">Email</p><p className="font-medium">{u.email}</p></div>
                    <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium">{u.phone || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Emp ID</p><p className="font-medium">{u.emp_id || '—'}</p></div>
                    <div><p className="text-xs text-slate-400">Dept</p><p className="font-medium">{u.department || '—'}</p></div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Briefcase className="w-4 h-4" /> Projects</h4>
                    {u.projects?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {u.projects.map(p => (
                          <span key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-700">
                            {p.proj_id} — {p.title?.slice(0, 30)}
                            <span className={`ml-1 px-1.5 py-0.5 text-[10px] ${p.stage === 'Closed' || p.stage === 'Cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>{p.stage}</span>
                            {p.team_member_id && (
                              <button onClick={() => removeFromProject(u.id, p.team_member_id)}
                                className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50">
                                <Unlink className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-400 italic">No projects assigned</p>}
                    {hasRole('admin', 'project_lead') && (
                      <div className="flex items-center gap-2 mt-3">
                        <select value={assignProject[u.id] || ''} onChange={e => setAssignProject(prev => ({...prev, [u.id]: e.target.value}))}
                          className="text-xs px-2 py-1.5 border border-slate-300 bg-white outline-none flex-1 max-w-xs"
                          onFocus={() => { if (allProjects.length === 0) loadProjects() }}>
                          <option value="">Select project...</option>
                          {allProjects.filter(p => !u.projects?.some(up => up.id === p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.proj_id} — {p.title?.slice(0, 50)}</option>
                          ))}
                        </select>
                        <button onClick={() => assignToProject(u.id, parseInt(assignProject[u.id]))}
                          disabled={!assignProject[u.id] || assigning[u.id]}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 disabled:opacity-50">
                          <Link className="w-3 h-3" /> {assigning[u.id] ? '...' : 'Assign'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Roles & Permissions (super admin only) */}
                  {isSuperAdmin && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Key className="w-4 h-4" /> Roles</h4>
                        <div className="flex flex-wrap gap-2">
                          {roles.map(role => (
                            <label key={role.id} className={`flex items-center gap-2 px-3 py-2  border cursor-pointer text-xs font-medium transition-all ${
                              u.role_ids?.includes(role.id) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}>
                              <input type="checkbox" checked={u.role_ids?.includes(role.id) || false}
                                onChange={() => toggleUserRole(u.id, role.id)}
                                disabled={permSaving[`role-${u.id}`]}
                                className=" text-blue-700 focus:ring-blue-500" />
                              {role.name}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1"><Shield className="w-4 h-4" /> Module Access Permissions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(groupedPerms).map(([module, perms]) => (
                            <div key={module} className="bg-white  border border-slate-200 p-3">
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{PERMISSION_LABELS[module] || module}</p>
                              <div className="space-y-1.5">
                                {perms.map(perm => {
                                  const isGranted = u.permissions?.[perm.code] !== false
                                  const sk = `${u.id}-${perm.code}`
                                  return (
                                    <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                      <button onClick={() => togglePermission(u.id, perm.code, isGranted)}
                                        disabled={permSaving[sk]}
                                        className={`w-5 h-5  flex items-center justify-center text-white text-xs transition-all ${
                                          permSaving[sk] ? 'bg-slate-300' : isGranted ? 'bg-green-500' : 'bg-red-400'
                                        }`}>
                                        {permSaving[sk] ? '...' : isGranted ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
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
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}




