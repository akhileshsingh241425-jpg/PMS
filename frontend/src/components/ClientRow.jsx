import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { C } from './styleConstants'

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 12px',
  borderBottom: '1px solid #F1F5F9',
  cursor: 'pointer',
  transition: 'background 0.1s',
  fontSize: 12,
  fontFamily: C.font,
  boxSizing: 'border-box',
  color: C.text,
}

const avatarMain = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: C.blueDark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 9,
  fontWeight: 700,
  color: '#fff',
  flexShrink: 0,
}

const avatarSub = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: C.blueLight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 8,
  fontWeight: 700,
  color: C.blue,
  flexShrink: 0,
}

const idBadge = {
  fontSize: 10,
  fontWeight: 600,
  color: C.blue,
  background: C.blueLight,
  padding: '1px 6px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
}

const statusBadge = (status) => ({
  fontSize: 10,
  fontWeight: 600,
  color: status === 'Active' ? '#059669' : status === 'Inactive' ? '#DC2626' : '#D97706',
  background: status === 'Active' ? '#D1FAE5' : status === 'Inactive' ? '#FEE2E2' : '#FEF3C7',
  padding: '1px 6px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
})

export default function ClientRow({ client, onNavigate }) {
  const [expanded, setExpanded] = useState(false)
  const subClients = client.sub_clients || []
  const hasSubs = subClients.length > 0

  return (
    <div>
      <div
        onClick={() => onNavigate(client.id)}
        style={rowStyle}
        onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}>
          <div style={avatarMain}>
            {(client.name || '?')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0, lineHeight: 1.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                {client.name}
              </span>
              <span style={idBadge}>{client.client_code}</span>
              <span style={statusBadge(client.status)}>{client.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              {client.location && <span style={{ fontSize: 10, color: C.secondary }}>{client.location}</span>}
              {client.gst_number && <span style={{ fontSize: 10, color: '#6B7280' }}>GST: {client.gst_number}</span>}
            </div>
          </div>
        </div>

        <div style={{ width: 110, textAlign: 'center', flexShrink: 0, lineHeight: 1.3 }}>
          {client.contact_name && (
            <div style={{ fontSize: 11, color: C.blue, cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); window.location.href = `mailto:${client.contact_email || ''}` }}>
              {client.contact_name}
            </div>
          )}
          {client.contact_phone && (
            <div style={{ fontSize: 10, color: C.secondary }}>{client.contact_phone}</div>
          )}
        </div>

        <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
          {client.industry && (
            <span style={{ fontSize: 11, color: '#475569', background: '#F1F5F9', padding: '1px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{client.industry}</span>
          )}
        </div>

        <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: C.text }}>
            {client.project_count || 0}
          </span>
        </div>

        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
          {hasSubs && (
            <span
              onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
              style={{ fontSize: 10, color: C.orangeText, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {expanded ? <ChevronDown className="w-2.5 h-2.5" style={{ display: 'inline', verticalAlign: 'middle' }} /> : <ChevronRight className="w-2.5 h-2.5" style={{ display: 'inline', verticalAlign: 'middle' }} />}
              {subClients.length}
            </span>
          )}
        </div>
      </div>

      {hasSubs && expanded && (
        <div style={{ background: '#FAFBFC' }}>
          {subClients.map(sub => (
            <div
              key={sub.id}
              onClick={() => onNavigate(sub.id)}
              style={{
                ...rowStyle,
                paddingLeft: 44,
                background: '#FAFBFC',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAFBFC' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 0', minWidth: 0 }}>
                <div style={avatarSub}>
                  {(sub.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500, fontSize: 11, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                      {sub.name}
                    </span>
                    <span style={{ fontSize: 10, color: C.secondary }}>{sub.client_code}</span>
                  </div>
                  {sub.location && <div style={{ fontSize: 10, color: C.secondary }}>{sub.location}</div>}
                </div>
              </div>

              <div style={{ width: 110, textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: C.orangeText }}>Sub</span>
              </div>

              <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }} />

              <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: C.text }}>
                  {sub.project_count || 0}
                </span>
              </div>

              <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
