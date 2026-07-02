import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Target, FileText, Building2, Briefcase, Users, LogOut, ChevronRight, Bell } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/opportunities', icon: Target, label: 'Opportunities' },
  { to: '/leads', icon: FileText, label: 'Leads' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/projects', icon: Briefcase, label: 'Projects' },
  { to: '/users', icon: Users, label: 'Team' },

]

function NotifBell() {
  const [count, setCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const fetchCount = async () => {
    try { const r = await api.get('/api/notifications/unread-count'); setCount(r.data.count) } catch (e) {}
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCount()
    const iv = setInterval(fetchCount, 30000)
    return () => clearInterval(iv)
  }, [])

  const toggle = async () => {
    setOpen(!open)
    if (!open) {
      try { const r = await api.get('/api/notifications?unread_only=true'); setNotifs(r.data.notifications) } catch (e) {}
    }
  }

  const markRead = async (id) => {
    try { await api.put(`/api/notifications/${id}/read`); fetchCount(); setNotifs(prev => prev.filter(n => n.id !== id)) } catch (e) {}
  }

  const markAllRead = async () => {
    try { await api.put('/api/notifications/read-all'); setCount(0); setNotifs([]) } catch (e) {}
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
        <Bell className="w-5 h-5" />
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {count > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No new notifications</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => { markRead(n.id); if (n.module_type === 'project' && n.module_id) { const tab = n.type === 'finding_query' ? 'queries' : n.type === 'meeting_request' ? 'meeting_requests' : ''; window.location.href = `/projects?projectId=${n.module_id}&tab=${tab}` } }}>
                <p className="text-sm font-medium text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.created_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Dark Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-slate-900 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          {!collapsed && <span className="ml-3 font-semibold text-white text-sm">PMS <span className="text-slate-400 text-xs">v2</span></span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = pathname === item.to
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-white border border-violet-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-violet-400' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 border-t border-slate-700">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.designation || user?.roles?.[0]?.replace(/_/g,' ')}</p>
              </div>
            )}
            <button onClick={logout} className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="h-8 flex items-center justify-center border-t border-slate-700 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3 shrink-0">
          <NotifBell />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
