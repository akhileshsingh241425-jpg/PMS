import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, Hash, HelpCircle, Layers, Plus, Trash2, Settings as SettingsIcon, ChevronUp, ChevronDown } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'

const TABS = [
  { key: 'formats', label: 'Numbering Formats', icon: FileText },
  { key: 'sectors', label: 'Client Categories / Sectors', icon: Layers },
  { key: 'stages', label: 'Project Stages', icon: SettingsIcon },
]

export default function Settings() {
  const [settings, setSettings] = useState([])
  const [sectors, setSectors] = useState([])
  const [stageTemplates, setStageTemplates] = useState({})
  const [projectTypes, setProjectTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [msg, setMsg] = useState('')
  const [newSector, setNewSector] = useState('')
  const [tab, setTab] = useState('formats')
  const [newStage, setNewStage] = useState({ project_type: '', name: '', color: '#6366F1' })

  const load = async () => {
    try {
      setLoading(true)
      const [sr, secr, ptr] = await Promise.all([
        api.get('/api/masters/settings'),
        api.get('/api/masters/sectors'),
        api.get('/api/projects/stage-templates'),
      ])
      setSettings(sr.data.settings || [])
      setSectors(secr.data.sectors || [])
      setStageTemplates(ptr.data.templates || {})
      setProjectTypes(Object.keys(ptr.data.templates || {}))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000) }

  const update = async (sid, value) => {
    setSaving(prev => ({ ...prev, [sid]: true }))
    try {
      await api.put(`/api/masters/settings/${sid}`, { value })
      flash('Settings saved!')
      await load()
    } catch (e) { flash('Failed to save') }
    finally { setSaving(prev => ({ ...prev, [sid]: false })) }
  }

  const addSector = async () => {
    if (!newSector.trim()) return
    try {
      await api.post('/api/masters/sectors', { name: newSector.trim() })
      setNewSector('')
      flash('Sector added!')
      await load()
    } catch (e) { flash(e.response?.data?.error || 'Failed to add') }
  }

  const deleteSector = async (id) => {
    if (!confirm('Delete this sector?')) return
    try {
      await api.delete(`/api/masters/sectors/${id}`)
      await load()
    } catch (e) { flash('Failed to delete') }
  }

  const moveStage = async (projectType, stages, fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= stages.length) return
    const newStages = [...stages]
    const [removed] = newStages.splice(fromIndex, 1)
    newStages.splice(toIndex, 0, removed)
    setStageTemplates(prev => ({ ...prev, [projectType]: newStages }))
    const updates = newStages.map((s, i) => ({ id: s.id, order: i }))
    try {
      await Promise.all(updates.map(u => api.put(`/api/projects/stage-templates/${u.id}`, { order: u.order })))
      await load()
    } catch (e) { flash('Failed to reorder'); await load() }
  }

  const addStage = async (projectType) => {
    if (!newStage.name.trim()) return
    try {
      await api.post('/api/projects/stage-templates', { project_type: projectType, name: newStage.name.trim(), color: newStage.color })
      setNewStage({ project_type: projectType, name: '', color: '#6366F1' })
      flash('Stage added!')
      await load()
    } catch (e) { flash(e.response?.data?.error || 'Failed to add') }
  }

  const updateStage = async (stage) => {
    try {
      await api.put(`/api/projects/stage-templates/${stage.id}`, { name: stage.name, color: stage.color, is_active: stage.is_active, order: stage.order })
      flash('Stage updated!')
      await load()
    } catch (e) { flash('Failed to update') }
  }

  const deleteStage = async (id) => {
    if (!confirm('Delete this stage?')) return
    try {
      await api.delete(`/api/projects/stage-templates/${id}`)
      await load()
    } catch (e) { flash('Failed to delete') }
  }

  const initializeTemplates = async () => {
    try {
      await api.post('/api/projects/stage-templates/initialize')
      flash('Templates initialized!')
      await load()
    } catch (e) { flash('Failed to initialize') }
  }

  const handleStageNameChange = (id, projectType, value) => {
    setStageTemplates(prev => ({ ...prev, [projectType]: prev[projectType].map(s => s.id === id ? { ...s, name: value } : s) }))
  }
  const handleStageColorChange = (id, projectType, color) => {
    setStageTemplates(prev => ({ ...prev, [projectType]: prev[projectType].map(s => s.id === id ? { ...s, color } : s) }))
  }
  const handleStageActiveToggle = (id, projectType, isActive) => {
    setStageTemplates(prev => ({ ...prev, [projectType]: prev[projectType].map(s => s.id === id ? { ...s, is_active: isActive } : s) }))
  }

  const meta = {
    'po_out_number_format': {
      label: 'PO OUT Number Format',
      desc: 'Template for vendor purchase order numbers',
      icon: FileText,
      placeholder: 'INFOCUS-IT/PO/{FY}/{VENDOR_CODE}/{N:03d}',
      hint: <span><b>{'{FY}'}</b> = Financial Year &nbsp;|&nbsp; <b>{'{VENDOR_CODE}'}</b> = Vendor Code &nbsp;|&nbsp; <b>{'{N:03d}'}</b> = Auto-number (3-digit)</span>,
    },
    'po_in_proj_id_format': {
      label: 'PO IN / Project ID Format',
      desc: 'Template for incoming work order / project IDs',
      icon: Hash,
      placeholder: 'INF/PRJ/{FY}/{N:03d}',
      hint: <span><b>{'{FY}'}</b> = Financial Year &nbsp;|&nbsp; <b>{'{N:03d}'}</b> = Auto-number (3-digit)</span>,
    },
  }

  const cardStyle = { background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '12px 14px' }
  const inputStyle = { width: '100%', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }

  if (loading) return <p style={{ color: C.muted, padding: 30, fontSize: 13 }}>Loading settings...</p>

  return (
    <div style={{ padding: '14px 20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 12, color: C.muted, margin: '2px 0 0' }}>Configure application-wide settings</p>
        </div>
        {msg && (
          <div style={{ padding: '5px 12px', borderRadius: 6, background: '#D1FAE5', border: '1px solid #A7F3D0', fontSize: 12, color: '#065F46', fontWeight: 600 }}>
            {msg}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: `2px solid ${C.border}` }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600, fontFamily: C.font,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: tab === t.key ? C.blue : C.muted,
              borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 0.15s',
            }}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'formats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {settings.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No settings configured</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {settings.map(s => {
                const m = meta[s.key] || { label: s.key, desc: s.description, icon: FileText, hint: null }
                const Icon = m.icon
                return (
                  <div key={s.id} style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, flexShrink: 0 }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: 12.5, fontWeight: 700, color: C.text, margin: '0 0 1px' }}>{m.label}</h3>
                        <p style={{ fontSize: 11, color: C.muted, margin: '0 0 6px' }}>{m.desc}</p>
                        <input
                          value={s.value}
                          onChange={e => setSettings(settings.map(x => x.id === s.id ? { ...x, value: e.target.value } : x))}
                          placeholder={m.placeholder}
                          style={{ ...inputStyle, fontFamily: 'monospace', background: '#FAFBFC' }}
                        />
                        {m.hint && <div style={{ marginTop: 5, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{m.hint}</div>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
                          <button
                            onClick={() => update(s.id, s.value)}
                            disabled={saving[s.id]}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 5, border: 'none', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: saving[s.id] ? 0.6 : 1 }}
                          >
                            <Save className="w-3 h-3" /> {saving[s.id] ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Help box - only relevant to numbering formats */}
          <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 11.5, color: '#92400E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 5 }}>
              <HelpCircle className="w-3.5 h-3.5" /> How placeholders work
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 5 }}>
              <span><code style={{ fontWeight: 700 }}>{'{FY}'}</code> → Financial Year (e.g. 2026-27)</span>
              <span><code style={{ fontWeight: 700 }}>{'{VENDOR_CODE}'}</code> → Vendor/Client code</span>
              <span><code style={{ fontWeight: 700 }}>{'{N:03d}'}</code> → Sequential number (03→04 for 4-digit)</span>
            </div>
            <p style={{ margin: 0, fontSize: 11 }}>
              <b>Example:</b> <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/{'{FY}'}/{'{VENDOR_CODE}'}/{'{N:04d}'}</code>
              {' → '}
              <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 3 }}>PO/2026-27/XX/0001</code>
            </p>
          </div>
        </div>
      )}

      {tab === 'sectors' && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Client Categories / Sectors</h3>
          <p style={{ fontSize: 11, color: C.muted, margin: '0 0 10px' }}>Shown in the Client Category dropdown on the onboarding form.</p>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <input
              value={newSector}
              onChange={e => setNewSector(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSector()}
              placeholder="New sector name..."
              style={{ ...inputStyle, flex: 1, maxWidth: 260 }}
            />
            <button onClick={addSector} disabled={!newSector.trim()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: newSector.trim() ? 1 : 0.5 }}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {sectors.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', textAlign: 'center', padding: 16 }}>No sectors added yet</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sectors.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', borderRadius: 20, background: '#F1F5F9', border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{s.name}</span>
                  <button onClick={() => deleteSector(s.id)} style={{ width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#FEE2E2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'stages' && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>Project Stages by Type</h3>
            <button onClick={initializeTemplates} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw className="w-3 h-3" /> Initialize Defaults
            </button>
          </div>
          <p style={{ fontSize: 11, color: C.muted, margin: '0 0 10px' }}>Default lifecycle stage sequence used when creating new projects of each type.</p>

          {projectTypes.length === 0 && (
            <div style={{ textAlign: 'center', padding: 30, color: C.muted }}>
              <SettingsIcon className="w-8 h-8" style={{ marginBottom: 6, opacity: 0.5 }} />
              <p style={{ fontSize: 12 }}>No project types configured. Click "Initialize Defaults" to create stage templates.</p>
            </div>
          )}

          {projectTypes.map((pt, ptIdx) => {
            const stages = stageTemplates[pt] || []
            return (
              <div key={pt} style={{ marginBottom: ptIdx < projectTypes.length - 1 ? 14 : 0, paddingTop: ptIdx > 0 ? 10 : 0, borderTop: ptIdx > 0 ? `1px solid ${C.border}` : 'none' }}>
                <h4 style={{ fontSize: 11.5, fontWeight: 700, color: C.text, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{pt}</h4>

                <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    value={newStage.name}
                    onChange={e => setNewStage({ ...newStage, name: e.target.value, project_type: pt })}
                    onKeyDown={e => e.key === 'Enter' && addStage(pt)}
                    placeholder="New stage name..."
                    style={{ ...inputStyle, flex: 1, maxWidth: 220, padding: '5px 8px' }}
                  />
                  <input
                    type="color"
                    value={newStage.color}
                    onChange={e => setNewStage({ ...newStage, color: e.target.value, project_type: pt })}
                    style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                  />
                  <button onClick={() => addStage(pt)} disabled={!newStage.name.trim()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: newStage.name.trim() ? 1 : 0.5 }}>
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>

                {stages.length === 0 ? (
                  <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', padding: '6px 0' }}>No stages defined. Add stages above or click "Initialize Defaults".</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {stages.map((stage, idx) => (
                      <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6, background: '#F9FAFB', border: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                          <button onClick={() => moveStage(pt, stages, idx, idx - 1)} disabled={idx === 0} style={{ width: 16, height: 12, border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D1D5DB' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveStage(pt, stages, idx, idx + 1)} disabled={idx === stages.length - 1} style={{ width: 16, height: 12, border: 'none', background: 'transparent', cursor: idx === stages.length - 1 ? 'default' : 'pointer', color: idx === stages.length - 1 ? '#D1D5DB' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="color"
                          value={stage.color}
                          onChange={e => handleStageColorChange(stage.id, pt, e.target.value)}
                          style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        />
                        <input
                          value={stage.name}
                          onChange={e => handleStageNameChange(stage.id, pt, e.target.value)}
                          style={{ flex: 1, padding: '3px 7px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 11.5, fontWeight: 500, fontFamily: C.font, background: '#fff' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: C.text, cursor: 'pointer', flexShrink: 0 }}>
                          <input
                            type="checkbox"
                            checked={stage.is_active}
                            onChange={e => handleStageActiveToggle(stage.id, pt, e.target.checked)}
                            style={{ width: 12, height: 12, accentColor: C.blue }}
                          />
                          Active
                        </label>
                        <button onClick={() => updateStage(stage)} style={{ padding: '3px 8px', borderRadius: 4, border: 'none', background: '#E5E7EB', color: '#374151', fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                          Save
                        </button>
                        <button onClick={() => deleteStage(stage.id)} style={{ width: 22, height: 22, borderRadius: 4, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
