import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Plus, Bell, Settings, ChevronDown, LogOut, User, HelpCircle } from 'lucide-react'

const C = {
  navy: '#0C2340',
  navyLight: '#1A3A5C',
  blue: '#0052CC',
  border: '#DFE1E6',
  text: '#172B4D',
  muted: '#5E6C84',
  bg: '#F4F5F7',
  white: '#FFFFFF',
}

const PROJECTS = [
  { id: 1, name: 'PMS v2', key: 'PMS' },
  { id: 2, name: 'PDI Complete', key: 'PDI' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef(null)
  const avatarRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div style={{
      height: 48, background: C.navy, display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4, background: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 11, fontWeight: 900,
        }}>P</div>
      </Link>

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <NavItem label="Your Work" />
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button onClick={() => setProjectsOpen(!projectsOpen)}
            style={{ ...navBtnStyle, background: projectsOpen ? 'rgba(255,255,255,0.12)' : 'transparent' }}>
            Projects <ChevronDown className="w-3 h-3" />
          </button>
          {projectsOpen && (
            <div style={dropdownStyle}>
              {PROJECTS.map(p => (
                <button key={p.id} onClick={() => { setProjectsOpen(false); navigate(`/projects/${p.id}/backlog`) }}
                  style={dropdownItemStyle}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: C.blue, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{p.key}</div>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <NavItem label="Dashboards" />
        <NavItem label="People" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ ...iconBtnStyle, background: C.blue, color: '#fff' }}>
          <Plus className="w-4 h-4" /> Create
        </button>

        <div ref={searchRef} style={{ position: 'relative' }}>
          <button onClick={() => setSearchOpen(!searchOpen)} style={iconBtnStyle}>
            <Search className="w-4 h-4" />
          </button>
          {searchOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100 }}>
              <input autoFocus placeholder="Search issues..." style={{
                width: 240, padding: '8px 12px', borderRadius: 4, border: '1px solid #DFE1E6',
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }} />
            </div>
          )}
        </div>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={iconBtnStyle}>
            <Bell className="w-4 h-4" />
          </button>
          {notifOpen && (
            <div style={{ ...dropdownStyle, right: 0, left: 'auto', width: 300 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6', fontSize: 13, fontWeight: 600, color: C.text }}>Notifications</div>
              <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 13 }}>No new notifications</div>
            </div>
          )}
        </div>

        <button style={iconBtnStyle}>
          <Settings className="w-4 h-4" />
        </button>

        <div ref={avatarRef} style={{ position: 'relative' }}>
          <button onClick={() => setAvatarOpen(!avatarOpen)}
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(user?.first_name || 'U')[0].toUpperCase()}
          </button>
          {avatarOpen && (
            <div style={{ ...dropdownStyle, right: 0, left: 'auto', width: 200 }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #DFE1E6' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{user?.full_name || user?.first_name || 'User'}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{user?.email}</div>
              </div>
              <button style={dropdownItemStyle}><User className="w-4 h-4" /> Profile</button>
              <button onClick={() => { logout(); navigate('/login') }} style={dropdownItemStyle}><LogOut className="w-4 h-4" /> Log out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NavItem({ label }) {
  return (
    <button style={navBtnStyle}>
      {label}
    </button>
  )
}

const navBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', border: 'none', background: 'transparent',
  color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap',
  fontFamily: 'inherit',
}

const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 4, border: 'none',
  background: 'transparent', color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', fontSize: 12, gap: 4,
}

const dropdownStyle = {
  position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 200,
  background: '#fff', borderRadius: 4, minWidth: 180,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: '1px solid #DFE1E6',
}

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '8px 14px', border: 'none', background: 'transparent',
  color: '#172B4D', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  textAlign: 'left',
}
