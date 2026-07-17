import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderOpen, ListChecks, Calendar,
  Users, FileText, BarChart3, ArrowLeft, LogOut, Menu, X,
  UserCircle
} from 'lucide-react'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/pm' },
  { key: 'projects', label: 'Projects', icon: FolderOpen, path: '/pm/projects' },
  { key: 'tasks', label: 'Tasks', icon: ListChecks, path: '/pm/tasks' },
  { key: 'team', label: 'Team', icon: Users, path: '/pm/team' },
  { key: 'meetings', label: 'Meetings', icon: Calendar, path: '/pm/meetings' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/pm/reports' },
]

export default function PMLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeKey = NAV_ITEMS.find(i => location.pathname === i.path)?.key || 'dashboard'

  const sidebarStyle = {
    width: 250, minHeight: '100vh', background: '#0F172A', color: '#fff',
    display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 100,
    transition: 'transform 0.2s',
  }
  const mobileStyle = {
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    position: 'fixed', zIndex: 1000,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F1F5F9' }}>
      <div style={{ ...sidebarStyle, ...(window.innerWidth < 768 ? mobileStyle : {}) }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#fff' }}>PM Portal</h2>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{user?.full_name}</p>
            </div>
            {window.innerWidth < 768 && (
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = item.key === activeKey
            return (
              <div key={item.key} onClick={() => { navigate(item.path); setMobileOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                  cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : '#94A3B8', background: active ? '#1E293B' : 'transparent',
                  borderLeft: active ? '3px solid #5B3DF5' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            )
          })}
        </nav>
        <div style={{ padding: '12px 20px', borderTop: '1px solid #1E293B' }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 12, padding: '6px 0' }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <button onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 12, padding: '6px 0' }}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {window.innerWidth < 768 && !mobileOpen && (
        <button onClick={() => setMobileOpen(true)}
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 99, background: '#0F172A', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer' }}>
          <Menu className="w-5 h-5" />
        </button>
      )}

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      )}

      <div style={{ flex: 1, marginLeft: window.innerWidth < 768 ? 0 : 250, padding: '24px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}
