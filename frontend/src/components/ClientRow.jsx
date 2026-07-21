import { useState } from 'react'
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react'
import { C } from './styleConstants'

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 20px',
  borderBottom: '1px solid #F1F5F9',
  cursor: 'pointer',
  transition: 'background 0.1s',
  fontSize: 14,
  fontFamily: C.font,
  minHeight: 56,
  boxSizing: 'border-box',
  color: C.text,
}

const avatarMain = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: C.blueDark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 15,
  fontWeight: 700,
  color: '#fff',
  flexShrink: 0,
}

const avatarSub = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: C.blueLight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 700,
  color: C.blue,
  flexShrink: 0,
}

const idBadge = {
  fontSize: 11,
  fontWeight: 600,
  color: C.blue,
  background: C.blueLight,
  padding: '2px 8px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
}

const greenDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: C.green,
  flexShrink: 0,
}

const industryTag = {
  fontSize: 12,
  color: '#475569',
  background: '#F1F5F9',
  padding: '2px 10px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
}

const subBadge = {
  fontSize: 11,
  fontWeight: 600,
  color: C.orangeText,
  background: C.orangeLight,
  padding: '2px 10px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0', minWidth: 0 }}>
          <div style={avatarMain}>
            {(client.name || '?')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                {client.name}
              </span>
              <span style={idBadge}>{client.client_code}</span>
              {client.status === 'Active' && <span style={greenDot} />}
            </div>
            {client.client_type === 'main' && client.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <MapPin className="w-3 h-3" style={{ color: C.secondary, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.secondary }}>{client.location}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ width: 140, textAlign: 'center', flexShrink: 0 }}>
          {client.contact_name && (
            <span
              style={{ fontSize: 13, color: C.blue, cursor: 'pointer' }}
              onClick={e => { e.stopPropagation(); window.location.href = `mailto:${client.contact_email || ''}` }}
            >
              {client.contact_name}
            </span>
          )}
        </div>

        <div style={{ width: 120, textAlign: 'center', flexShrink: 0 }}>
          {client.industry && (
            <span style={industryTag}>{client.industry}</span>
          )}
        </div>

        <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
            {client.project_count || 0}
          </span>
        </div>

        <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
          {hasSubs && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid #E2E8F0',
                background: '#fff',
                cursor: 'pointer',
                color: C.secondary,
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: C.font,
                fontSize: 12,
                gap: 4,
                fontWeight: 500,
              }}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {subClients.length} sub
            </button>
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
                paddingLeft: 64,
                minHeight: 48,
                background: '#FAFBFC',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FAFBFC' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 0', minWidth: 0 }}>
                <div style={avatarSub}>
                  {(sub.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500, fontSize: 13, color: C.text }}>
                      {sub.name}
                    </span>
                    <span style={{ fontSize: 12, color: C.secondary }}>{sub.client_code}</span>
                  </div>
                </div>
              </div>

              <div style={{ width: 140, textAlign: 'center', flexShrink: 0 }}>
                <span style={subBadge}>Sub-Client</span>
              </div>

              <div style={{ width: 120, textAlign: 'center', flexShrink: 0 }} />

              <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                  {sub.project_count || 0}
                </span>
              </div>

              <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
