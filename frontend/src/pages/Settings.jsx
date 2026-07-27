import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, Hash, HelpCircle, Layers, Plus, Trash2, X } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [msg, setMsg] = useState('')
  const [newSector, setNewSector] = useState('')
  const [tab, setTab] = useState('formats')

  const load = async () => {
    try {
      setLoading(true)
      const [sr, secr] = await Promise.all([
        api.get('/api/masters/settings'),
        api.get('/api/masters/sectors'),
      ])
      setSettings(sr.data.settings || [])
      setSectors(secr.data.sectors || [])
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

  const addSector = async () => {
    if (!newSector.trim()) return
    try {
      await api.post('/api/masters/sectors', { name: newSector.trim() })
      setNewSector('')
      setMsg('Sector added!')
      setTimeout(() => setMsg(''), 3000)
      await load()
    } catch (e) { setMsg(e.response?.data?.error || 'Failed to add'); setTimeout(() => setMsg(''), 3000) }
  }

  const deleteSector = async (id) => {
    if (!confirm('Delete this sector?')) return
    try {
      await api.delete(`/api/masters/sectors/${id}`)
      await load()
    } catch (e) { setMsg('Failed to delete'); setTimeout(() => setMsg(''), 3000) }
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
    <div style={{ padding: '0 0 32px', maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Configure application-wide settings</p>
      </div>

      {msg && (
        <div style={{ marginBottom: 14, padding: '8px 14px', borderRadius: 8, background: '#D1FAE5', border: '1px solid #A7F3D0', fontSize: 12, color: '#065F46', fontWeight: 500 }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        <button onClick={() => setTab('formats')} style={{ padding: '6px 16px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === 'formats' ? C.border : 'transparent'}`, borderBottom: tab === 'formats' ? '2px solid #fff' : '2px solid transparent', background: tab === 'formats' ? '#fff' : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: tab === 'formats' ? C.blue : C.muted, fontFamily: C.font, marginBottom: -1 }}>
          <FileText className="w-3.5 h-3.5" style={{ marginRight: 4, verticalAlign: 'middle' }} /> Numbering Formats
        </button>
        <button onClick={() => setTab('sectors')} style={{ padding: '6px 16px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === 'sectors' ? C.border : 'transparent'}`, borderBottom: tab === 'sectors' ? '2px solid #fff' : '2px solid transparent', background: tab === 'sectors' ? '#fff' : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: tab === 'sectors' ? C.blue : C.muted, fontFamily: C.font, marginBottom: -1 }}>
          <Layers className="w-3.5 h-3.5" style={{ marginRight: 4, verticalAlign: 'middle' }} /> Client Categories / Sectors
        </button>
      </div>

      {tab === 'formats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {settings.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>No settings configured</p>
          ) : settings.map(s => {
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
      )}

      {tab === 'sectors' && (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Client Categories / Sectors</h3>
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>Manage the list of sectors/categories shown in the Client Category dropdown on the onboarding form.</p>

          {/* Add new */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={newSector}
              onChange={e => setNewSector(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSector()}
              placeholder="New sector name..."
              style={{ flex: 1, padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: C.font }}
            />
            <button onClick={addSector} disabled={!newSector.trim()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: newSector.trim() ? 1 : 0.5 }}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* List */}
          {sectors.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>No sectors added yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sectors.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: '#F9FAFB', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.name}</span>
                  <button onClick={() => deleteSector(s.id)} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help footer */}
      <div style={{ marginTop: 20, padding: 16, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
          <HelpCircle className="w-4 h-4" /> How placeholders work
        </div>
        <p style={{ margin: '0 0 4px' }}>The system replaces these placeholders when generating numbers:</p>
        <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{FY}'}</td><td>→ Current Financial Year (e.g. 2026-27)</td></tr>
            <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{VENDOR_CODE}'}</td><td>→ Vendor/Client code from the master</td></tr>
            <tr><td style={{ padding: '2px 12px 2px 0', fontFamily: 'monospace', fontWeight: 600 }}>{'{N:03d}'}</td><td>→ Sequential number (change 03 to 04 for 4-digit)</td></tr>
          </tbody>
        </table>
        <p style={{ margin: '8px 0 0', fontSize: 11 }}><b>Example:</b> <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/{'{FY}'}/{'{VENDOR_CODE}'}/{'{N:04d}'}</code> → <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/2026-27/XX/0001</code></p>
      </div>
    </div>
  )
}