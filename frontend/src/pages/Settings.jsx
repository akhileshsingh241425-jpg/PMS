import { useState, useEffect } from 'react'
import { Save, RefreshCw, FileText, Hash, HelpCircle, Layers, Plus, Trash2, X, Settings as SettingsIcon, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import api from '../services/api'
import { C } from '../components/styleConstants'

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
  const [editingStage, setEditingStage] = useState(null)
  const [dragItem, setDragItem] = useState(null)

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

  const handleStageDragStart = (e, item) => {
    setDragItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleStageDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleStageDrop = async (e, projectType, stages, dragItem) => {
    e.preventDefault()
    if (!dragItem || dragItem.project_type !== projectType) return
    const dragIndex = stages.findIndex(s => s.id === dragItem.id)
    const hoverIndex = stages.findIndex(s => s.id === dragItem.id) // This needs the hovered item, will fix
    setDragItem(null)
  }

  const moveStage = async (projectType, stages, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    const newStages = [...stages]
    const [removed] = newStages.splice(fromIndex, 1)
    newStages.splice(toIndex, 0, removed)
    // Update order
    const updates = newStages.map((s, i) => ({ id: s.id, order: i }))
    try {
      await Promise.all(updates.map(u => api.put(`/api/projects/stage-templates/${u.id}`, { order: u.order })))
      await load()
    } catch (e) { setMsg('Failed to reorder'); setTimeout(() => setMsg(''), 3000) }
  }

  const addStage = async (projectType) => {
    if (!newStage.name.trim()) return
    try {
      await api.post('/api/projects/stage-templates', { project_type: projectType, name: newStage.name.trim(), color: newStage.color })
      setNewStage({ project_type: projectType, name: '', color: '#6366F1' })
      setMsg('Stage added!')
      setTimeout(() => setMsg(''), 3000)
      await load()
    } catch (e) { setMsg(e.response?.data?.error || 'Failed to add'); setTimeout(() => setMsg(''), 3000) }
  }

  const updateStage = async (stage) => {
    try {
      await api.put(`/api/projects/stage-templates/${stage.id}`, { name: stage.name, color: stage.color, is_active: stage.is_active, order: stage.order })
      setMsg('Stage updated!')
      setTimeout(() => setMsg(''), 3000)
      await load()
    } catch (e) { setMsg('Failed to update'); setTimeout(() => setMsg(''), 3000) }
  }

  const deleteStage = async (id) => {
    if (!confirm('Delete this stage?')) return
    try {
      await api.delete(`/api/projects/stage-templates/${id}`)
      await load()
    } catch (e) { setMsg('Failed to delete'); setTimeout(() => setMsg(''), 3000) }
  }

  const initializeTemplates = async () => {
    try {
      await api.post('/api/projects/stage-templates/initialize')
      setMsg('Templates initialized!')
      setTimeout(() => setMsg(''), 3000)
      await load()
    } catch (e) { setMsg('Failed to initialize'); setTimeout(() => setMsg(''), 3000) }
  }

  const handleStageNameChange = (id, projectType, value) => {
    setStageTemplates(prev => ({
      ...prev,
      [projectType]: prev[projectType].map(s => s.id === id ? { ...s, name: value } : s)
    }))
  }

  const handleStageColorChange = (id, projectType, color) => {
    setStageTemplates(prev => ({
      ...prev,
      [projectType]: prev[projectType].map(s => s.id === id ? { ...s, color } : s)
    }))
  }

  const handleStageActiveToggle = (id, projectType, isActive) => {
    setStageTemplates(prev => ({
      ...prev,
      [projectType]: prev[projectType].map(s => s.id === id ? { ...s, is_active: isActive } : s)
    }))
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
        <button onClick={() => setTab('stages')} style={{ padding: '6px 16px', borderRadius: '8px 8px 0 0', border: `1px solid ${tab === 'stages' ? C.border : 'transparent'}`, borderBottom: tab === 'stages' ? '2px solid #fff' : '2px solid transparent', background: tab === 'stages' ? '#fff' : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: tab === 'stages' ? C.blue : C.muted, fontFamily: C.font, marginBottom: -1 }}>
          <SettingsIcon className="w-3.5 h-3.5" style={{ marginRight: 4, verticalAlign: 'middle' }} /> Project Stages
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

      {tab === 'stages' && (
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Project Stages by Type</h3>
            <button onClick={initializeTemplates} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw className="w-3.5 h-3.5" /> Initialize Defaults
            </button>
          </div>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>Define lifecycle stages for each project type. These will be used as the default stage sequence when creating new projects.</p>

          {projectTypes.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
              <SettingsIcon className="w-12 h-12" style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>No project types configured. Click "Initialize Defaults" to create stage templates.</p>
            </div>
          )}

          {projectTypes.map(pt => {
            const stages = stageTemplates[pt] || []
            return (
              <div key={pt} style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 8px', textTransform: 'uppercase' }}>{pt}</h4>
                
                {/* Add new stage */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                  <input
                    value={newStage.name}
                    onChange={e => setNewStage({ ...newStage, name: e.target.value, project_type: pt })}
                    onKeyDown={e => e.key === 'Enter' && addStage(pt)}
                    placeholder="New stage name..."
                    style={{ flex: 1, maxWidth: 250, padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: C.font }}
                  />
                  <input
                    type="color"
                    value={newStage.color}
                    onChange={e => setNewStage({ ...newStage, color: e.target.value, project_type: pt })}
                    style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0 }}
                  />
                  <button onClick={() => addStage(pt)} disabled={!newStage.name.trim()} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none', background: C.blue, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: newStage.name.trim() ? 1 : 0.5 }}>
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {/* Stage list - draggable */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {stages.length === 0 ? (
                    <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', padding: '12px 8px' }}>No stages defined. Add stages above or click "Initialize Defaults".</p>
                  ) : (
                    stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        draggable
                        onDragStart={e => handleStageDragStart(e, { ...stage, project_type: pt })}
                        onDragOver={handleStageDragOver}
                        onDrop={e => handleStageDrop(e, pt, stages, dragItem)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: '#F9FAFB', border: `1px solid ${C.border}`, cursor: 'grab' }}
                      >
                        <GripVertical className="w-4 h-4" style={{ color: C.muted, cursor: 'grab' }} />
                        <input
                          type="color"
                          value={stage.color}
                          onChange={e => handleStageColorChange(stage.id, pt, e.target.value)}
                          style={{ width: 24, height: 24, borderRadius: 4, border: `1px solid ${C.border}`, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        />
                        <input
                          value={stage.name}
                          onChange={e => handleStageNameChange(stage.id, pt, e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12, fontWeight: 500, fontFamily: C.font, background: '#fff' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.text, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={stage.is_active}
                            onChange={e => handleStageActiveToggle(stage.id, pt, e.target.checked)}
                            style={{ width: 14, height: 14, accentColor: C.blue }}
                          />
                          Active
                        </label>
                        <button
                          onClick={() => updateStage(stage)}
                          style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#E5E7EB', color: '#374151', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button onClick={() => deleteStage(stage.id)} style={{ width: 26, height: 26, borderRadius: 4, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}