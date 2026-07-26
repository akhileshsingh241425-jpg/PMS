import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, Hash, HelpCircle } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const r = await api.get('/api/masters/settings')
      setSettings(r.data.settings || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const update = async (sid, value) => {
    setSaving(prev => ({ ...prev, [sid]: true }))
    setMsg('')
    try {
      await api.put(`/api/masters/settings/${sid}`, { value })
      setMsg('Settings saved!')
      setTimeout(() => setMsg(''), 3000)
      await load()
    } catch (e) { setMsg('Failed to save'); setTimeout(() => setMsg(''), 3000) }
    finally { setSaving(prev => ({ ...prev, [sid]: false })) }
  }

  const meta = {
    'po_out_number_format': {
      label: 'PO OUT Number Format',
      desc: 'Template for vendor purchase order numbers',
      icon: FileText,
      placeholder: 'INFOCUS-IT/PO/{FY}/{VENDOR_CODE}/{N:03d}',
      hint: (
        <span style={{ fontSize: 11, color: C.muted }}>
          <b>{'{FY}'}</b> = Financial Year &nbsp;|&nbsp; <b>{'{VENDOR_CODE}'}</b> = Vendor Code &nbsp;|&nbsp; <b>{'{N:03d}'}</b> = Auto-number (3-digit)
        </span>
      ),
    },
    'po_in_proj_id_format': {
      label: 'PO IN / Project ID Format',
      desc: 'Template for incoming work order / project IDs',
      icon: Hash,
      placeholder: 'INF/PRJ/{FY}/{N:03d}',
      hint: (
        <span style={{ fontSize: 11, color: C.muted }}>
          <b>{'{FY}'}</b> = Financial Year &nbsp;|&nbsp; <b>{'{N:03d}'}</b> = Auto-number (3-digit)
        </span>
      ),
    },
  }

  if (loading) return <p style={{ color: C.muted, padding: 40, fontSize: 14 }}>Loading settings...</p>

  return (
    <div style={{ padding: '0 0 32px', maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Configure application-wide numbering formats</p>
      </div>

      {msg && (
        <div style={{ marginBottom: 14, padding: '8px 14px', borderRadius: 8, background: msg === 'Settings saved!' ? '#D1FAE5' : '#FEF2F2', border: `1px solid ${msg === 'Settings saved!' ? '#A7F3D0' : '#FECACA'}`, fontSize: 12, color: msg === 'Settings saved!' ? '#065F46' : '#B91C1C', fontWeight: 500 }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {settings.map(s => {
          const m = meta[s.key] || { label: s.key, desc: s.description, icon: FileText, hint: null }
          const Icon = m.icon
          return (
            <div key={s.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, flexShrink: 0 }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>{m.label}</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: '0 0 10px' }}>{m.desc}</p>
                  <input
                    value={s.value}
                    onChange={e => {
                      const updated = settings.map(x => x.id === s.id ? { ...x, value: e.target.value } : x)
                      setSettings(updated)
                    }}
                    placeholder={m.placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box', background: '#FAFBFC' }}
                  />
                  {m.hint && <div style={{ marginTop: 8 }}>{m.hint}</div>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      onClick={() => update(s.id, s.value)}
                      disabled={saving[s.id]}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 16px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving[s.id] ? 0.6 : 1 }}
                    >
                      <Save className="w-3.5 h-3.5" /> {saving[s.id] ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
          <HelpCircle className="w-4 h-4" /> How placeholders work
        </div>
        <p style={{ margin: '0 0 4px' }}>The system replaces these placeholders when generating numbers:</p>
        <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
          <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{FY}'}</td><td>→ Current Financial Year (e.g. 2026-27)</td></tr>
          <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{VENDOR_CODE}'}</td><td>→ Vendor/Client code from the master</td></tr>
          <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{N:03d}'}</td><td>→ Sequential number (change 03 to 04 for 4-digit)</td></tr>
        </table>
        <p style={{ margin: '8px 0 0', fontSize: 11 }}><b>Example:</b> <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/{'{FY}'}/{'{VENDOR_CODE}'}/{'{N:04d}'}</code> → <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/2026-27/XX/0001</code></p>
      </div>
    </div>
  )
}
