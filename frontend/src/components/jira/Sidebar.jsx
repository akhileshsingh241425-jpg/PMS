import { NavLink, useParams } from 'react-router-dom'
import { Route, Layers, Kanban, Code, Bell, FileText, Plus, Settings, Users, Calendar } from 'lucide-react'

const linkStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '6px 12px', borderRadius: 4, textDecoration: 'none',
  fontSize: 13, fontWeight: isActive ? 600 : 400,
  color: isActive ? '#0052CC' : '#172B4D',
  background: isActive ? '#DEEBFF' : 'transparent',
  borderLeft: isActive ? '3px solid #0052CC' : '3px solid transparent',
  marginLeft: -8, transition: 'all 0.1s',
  fontFamily: 'inherit',
})

const NAV_ITEMS = [
  { to: 'roadmap', label: 'Roadmap', icon: Route },
  { to: 'backlog', label: 'Backlog', icon: Layers },
  { to: 'board', label: 'Board', icon: Kanban },
  { to: 'code', label: 'Code', icon: Code },
  { to: 'on-call', label: 'On-call', icon: Bell },
  { to: 'project-pages', label: 'Project pages', icon: FileText },
]

export default function Sidebar({ project }) {
  const { id } = useParams()

  return (
    <aside style={{
      width: 224, background: '#F4F5F7', borderRight: '1px solid #DFE1E6',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'auto',
    }}>
      {/* Project header */}
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #DFE1E6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4, background: '#0052CC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0,
          }}>{project?.proj_id?.[0] || 'P'}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#172B4D', lineHeight: 1.2 }}>{project?.title || 'Project'}</div>
            <div style={{ fontSize: 11, color: '#5E6C84' }}>Software project</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={`/projects/${id}/${item.to}`}
              style={({ isActive }) => linkStyle(isActive)}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        <div style={{ borderTop: '1px solid #DFE1E6', margin: '8px 0', paddingTop: 8 }}>
          <NavLink to={`/projects/${id}/team`} style={({ isActive }) => linkStyle(isActive)}>
            <Users className="w-4 h-4" /> Team
          </NavLink>
          <NavLink to={`/projects/${id}/calendar`} style={({ isActive }) => linkStyle(isActive)}>
            <Calendar className="w-4 h-4" /> Calendar
          </NavLink>
        </div>

        <div style={{ flex: 1 }} />

        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '6px 12px', borderRadius: 4, border: 'none', background: 'transparent',
          color: '#5E6C84', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          textAlign: 'left',
        }}>
          <Plus className="w-4 h-4" /> Add item
        </button>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '6px 12px', borderRadius: 4, border: 'none', background: 'transparent',
          color: '#5E6C84', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          textAlign: 'left',
        }}>
          <Settings className="w-4 h-4" /> Project settings
        </button>
      </nav>
    </aside>
  )
}
