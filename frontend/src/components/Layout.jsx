import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Target, FileText, Building2, Briefcase, Users, LogOut, Bell, Search, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-workspace', icon: UserCircle, label: 'My Workspace' },
  { to: '/opportunities', icon: Target, label: 'Opportunities' },
  { to: '/leads', icon: FileText, label: 'Leads' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/projects', icon: Briefcase, label: 'Projects' },
  { to: '/teams', icon: Users, label: 'Teams' },
]

function NotifBell() {
  const [count, setCount] = useState(0)
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const fetchCount = async () => {
    try { const r = await api.get('/api/notifications/unread-count'); setCount(r.data.count) } catch (e) {}
  }

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

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
        <Bell className="w-4 h-4" />
        {count > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 z-50 max-h-96 overflow-y-auto shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800">Notifications</p>
            {count > 0 && <button onClick={markAllRead} className="text-xs text-indigo-600 font-semibold hover:underline">Mark all read</button>}
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No new notifications</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { markRead(n.id); if (n.module_type === 'project' && n.module_id) { const tab = n.type === 'finding_query' ? 'queries' : n.type === 'meeting_request' ? 'meeting_requests' : ''; window.location.href = `/projects?projectId=${n.module_id}&tab=${tab}` } }}>
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.created_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const pageTitles = {
  '/': 'Dashboard',
  '/my-workspace': 'My Workspace',
  '/opportunities': 'Opportunities',
  '/leads': 'Leads',
  '/accounts': 'Accounts',
  '/projects': 'Projects',
  '/teams': 'Teams',
  '/users': 'Users',
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const searchTimer = useRef(null)

  useEffect(() => {
    const handleClick = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const doSearch = (q) => {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.length < 2) { setSearchResults([]); setSearchOpen(false); return }
    searchTimer.current = setTimeout(async () => {
      try { const r = await api.get(`/api/search?q=${encodeURIComponent(q)}`); setSearchResults(r.data.results); setSearchOpen(true) }
      catch (e) {}
    }, 300)
  }

  const searchColors = { lead: '#5B21B6', account: '#059669', project: '#2563EB', contact: '#DB2777' }

  const pageTitle = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] || ''

  return (
    <div className="flex h-screen bg-[#F0F2F8]" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 240,
        background: '#fff',
        borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.2s',
      }}>
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '0 14px' : '0 20px',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#5B21B6,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 900, flexShrink: 0,
          }}>P</div>
          {!collapsed && <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E', letterSpacing: '-0.3px' }}>PMS</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {[...nav, ...(user?.role === 'admin' ? [{ to: '/users', icon: Users, label: 'Users' }] : [])].map(item => {
            const active = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
            const Icon = item.icon
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 10px' : '10px 12px',
                borderRadius: 8, textDecoration: 'none',
                background: active ? '#F5F3FF' : 'transparent',
                color: active ? '#5B21B6' : '#6B7280',
                fontWeight: active ? 700 : 500,
                fontSize: 14, position: 'relative',
                transition: 'all 0.12s',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                {active && <div style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: '0 3px 3px 0', background: '#5B21B6',
                }} />}
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <button onClick={() => setCollapsed(!collapsed)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '10px', margin: '0 8px 4px', borderRadius: 8,
          border: 'none', background: 'transparent', color: '#9CA3AF',
          cursor: 'pointer', fontSize: 14,
        }}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User */}
        <div style={{
          padding: collapsed ? '10px 8px' : '12px 16px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#E8E4FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5B21B6', fontSize: 13, fontWeight: 800, flexShrink: 0,
          }}>{user?.first_name?.[0] || '?'}</div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'User'}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{user?.role || ''}</div>
              </div>
              <button onClick={logout} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }} title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {collapsed && (
            <button onClick={logout} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer' }} title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 56, background: '#fff', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Show sidebar' : 'Hide sidebar'} style={{
              padding: '6px', borderRadius: 8, border: 'none', background: '#F3F4F6',
              color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, lineHeight: 1,
            }}>
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>{pageTitle}</span>
            <span style={{ width: 1, height: 16, background: '#E5E7EB' }} />
            <div ref={searchRef} style={{ position: 'relative' }}>
              <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={searchQuery} onChange={e => doSearch(e.target.value)} placeholder="Search anything..." style={{
                width: 240, padding: '7px 10px 7px 32px', borderRadius: 8,
                border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
                fontFamily: 'inherit', background: '#F9FAFB',
              }} />
              {searchOpen && searchResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB', zIndex: 100, maxHeight: 360, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
                  {searchResults.map((r, i) => (
                    <Link key={`${r.type}-${r.id}`} to={r.url} onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', borderBottom: i < searchResults.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#fff', background: searchColors[r.type], padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{r.type}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{r.title}</div>
                        {r.subtitle && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{r.subtitle}</div>}
                      </div>
                      {r.label && <span style={{ fontSize: 11, color: searchColors[r.type], fontWeight: 700, flexShrink: 0 }}>{r.label}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotifBell />
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
