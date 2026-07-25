import { useState, useEffect } from 'react'
import { Settings, Shield, FileText, DollarSign, Sliders, Bell, Users, Lock, Plus, History, CheckCircle, XCircle, Clock } from 'lucide-react'
import api from '../services/api'

const C = { bg: '#F6F8FC', card: '#fff', border: '#ECECEC', text: '#1F2937', muted: '#6B7280', primary: '#5B3DF5', blue: '#0052CC', shadow: '0 1px 3px rgba(0,0,0,0.06)' }

const GROUP_ICONS = {
  organisation: { icon: Settings, label: 'Organisation' },
  numbering: { icon: FileText, label: 'Numbering' },
  masters: { icon: Sliders, label: 'Masters' },
  financial: { icon: DollarSign, label: 'Financial' },
  templates: { icon: FileText, label: 'Templates' },
  workflow: { icon: Sliders, label: 'Workflow' },
  notifications: { icon: Bell, label: 'Notifications' },
  users_roles: { icon: Users, label: 'Users & Roles' },
  security: { icon: Lock, label: 'Security' },
}

const inputS = { width: '100%', padding: '7px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', background: '#fff', color: C.text, boxSizing: 'border-box' }

export default function SettingsPage() {
  const [settings, setSettings] = useState([])
  const [groups, setGroups] = useState([])
  const [activeGroup, setActiveGroup] = useState('organisation')
  const [editingId, setEditingId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [effDate, setEffDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [sugForm, setSugForm] = useState({ parameter_name: '', module: '', reason: '', example_values: '' })
  const [suggestions, setSuggestions] = useState([])
  const [showHistory, setShowHistory] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => { loadSettings() }, [])
  useEffect(() => { loadSuggestions() }, [])

  const loadSettings = async () => {
    try { const r = await api.get('/api/settings'); setSettings(r.data.settings); setGroups(r.data.groups) }
    catch (e) {}
  }

  const loadSuggestions = async () => {
    try { const r = await api.get('/api/settings/suggestions'); setSuggestions(r.data.suggestions) }
    catch (e) {}
  }

  const filtered = settings.filter(s => s.group === activeGroup)

  const startEdit = (s) => {
    setEditingId(s.id); setEditVal(s.value); setEffDate(s.effective_from || '')
  }

  const saveEdit = async (s) => {
    setSaving(true)
    try {
      const payload = { value: editVal }
      if (effDate) payload.effective_from = effDate
      await api.put(`/api/settings/${s.id}`, payload)
      setEditingId(null); await loadSettings(); setMsg('Saved!')
      setTimeout(() => setMsg(''), 2000)
    } catch (e) { setMsg('Failed to save') }
    finally { setSaving(false) }
  }

  const approveSetting = async (sid) => {
    try { await api.post(`/api/settings/${sid}/approve`); await loadSettings(); setMsg('Approved!'); setTimeout(() => setMsg(''), 2000) }
    catch (e) { setMsg('Failed') }
  }

  const rejectSetting = async (sid) => {
    try { await api.post(`/api/settings/${sid}/reject`); await loadSettings(); setMsg('Rejected'); setTimeout(() => setMsg(''), 2000) }
    catch (e) { setMsg('Failed') }
  }

  const viewHistory = async (sid) => {
    try { const r = await api.get(`/api/settings/${sid}/history`); setHistoryData(r.data.versions); setShowHistory(sid) }
    catch (e) {}
  }

  const submitSuggestion = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/settings/suggestions', sugForm)
      setShowSuggest(false); setSugForm({ parameter_name: '', module: '', reason: '', example_values: '' })
      loadSuggestions(); setMsg('Suggestion submitted!'); setTimeout(() => setMsg(''), 3000)
    } catch (err) { setMsg(err.response?.data?.error || 'Failed') }
  }

  const reviewSuggestion = async (sid, status) => {
    const remark = status === 'rejected' ? prompt('Rejection remark:') : ''
    if (status === 'rejected' && !remark) return
    try { await api.put(`/api/settings/suggestions/${sid}`, { status, admin_remark: remark || '' }); loadSuggestions(); loadSettings() }
    catch (e) {}
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Left sidebar */}
      <div style={{ width: 200, background: C.card, borderRight: `1px solid ${C.border}`, padding: '16px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Settings className="w-4 h-4" style={{ color: C.primary }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Settings</span>
        </div>
        {groups.map(g => {
          const gi = GROUP_ICONS[g] || { icon: Settings, label: g }
          const Icon = gi.icon
          return (
            <div key={g} onClick={() => setActiveGroup(g)} style={{
              padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: activeGroup === g ? 700 : 500, color: activeGroup === g ? C.primary : C.muted,
              background: activeGroup === g ? '#F5F3FF' : 'transparent',
              borderRight: activeGroup === g ? `3px solid ${C.primary}` : '3px solid transparent',
            }}>
              <Icon className="w-3.5 h-3.5" />
              {gi.label}
            </div>
          )
        })}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: '12px 16px 8px' }} />
        <button onClick={() => setShowSuggest(true)} style={{ margin: '0 12px', padding: '7px 12px', borderRadius: 6, border: `1px dashed ${C.primary}`, background: '#F5F3FF', width: 'calc(100% - 24px)', fontSize: 11, fontWeight: 600, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
          <Plus className="w-3 h-3" /> Suggest a Setting
        </button>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, padding: 20 }}>
        {msg && <div style={{ padding: '8px 14px', background: '#D1FAE5', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#065F46', marginBottom: 12 }}>{msg}</div>}

        {/* Group header */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{(GROUP_ICONS[activeGroup] || {}).label || activeGroup}</h2>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{filtered.length} parameters</p>
        </div>

        {/* Settings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.label}</span>
                    {s.is_sensitive && <Shield className="w-3 h-3" style={{ color: '#F59E0B' }} title="Sensitive — needs approval" />}
                    <span style={{ fontSize: 9, color: C.muted, fontFamily: 'monospace' }}>{s.key}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{s.description}</div>

                  {editingId === s.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input value={editVal} onChange={e => setEditVal(e.target.value)} style={{ ...inputS, width: 300 }} autoFocus />
                      <input type="date" value={effDate} onChange={e => setEffDate(e.target.value)} style={{ ...inputS, width: 140 }} />
                      <button onClick={() => saveEdit(s)} disabled={saving} style={{ padding: '6px 14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{saving ? '...' : 'Save'}</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', background: '#fff', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.value || '—'}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => startEdit(s)} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: 4, background: '#fff', fontSize: 10, fontWeight: 600, color: C.blue, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => viewHistory(s.id)} style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: '#F5F3FF', fontSize: 10, fontWeight: 600, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><History className="w-3 h-3" /> History</button>
                  {s.is_sensitive && !s.checker_id && (
                    <>
                      <button onClick={() => approveSetting(s.id)} style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: '#D1FAE5', fontSize: 10, fontWeight: 600, color: '#065F46', cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => rejectSetting(s.id)} style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: '#FEE2E2', fontSize: 10, fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Reject</button>
                    </>
                  )}
                  {s.is_sensitive && s.checker_id && (
                    <span style={{ fontSize: 9, color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle className="w-3 h-3" /> Approved</span>
                  )}
                </div>
              </div>

              {/* Version history */}
              {showHistory === s.id && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 4 }}>Version History</div>
                  {historyData.length === 0 ? <span style={{ fontSize: 11, color: C.muted }}>No history</span> : historyData.map(v => (
                    <div key={v.id} style={{ fontSize: 11, color: C.muted, display: 'flex', gap: 8, padding: '2px 0' }}>
                      <span style={{ fontFamily: 'monospace', color: '#DC2626' }}>{v.old_value}</span>
                      <span>→</span>
                      <span style={{ fontFamily: 'monospace', color: '#059669' }}>{v.new_value}</span>
                      <span style={{ color: '#9CA3AF' }}>{v.changed_at ? new Date(v.changed_at).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggestions section */}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus className="w-4 h-4" /> User Suggestions ({suggestions.length})
            </h3>
            {suggestions.map(sug => (
              <div key={sug.id} style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '10px 14px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sug.parameter_name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Module: {sug.module}</div>
                    <div style={{ fontSize: 11, color: C.text, marginTop: 2 }}>{sug.reason}</div>
                    {sug.example_values && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Example: {sug.example_values}</div>}
                    {sug.admin_remark && <div style={{ fontSize: 10, color: '#991B1B', marginTop: 2 }}>Remark: {sug.admin_remark}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {sug.status === 'pending' && (
                      <>
                        <button onClick={() => reviewSuggestion(sug.id, 'accepted')} style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: '#D1FAE5', fontSize: 10, fontWeight: 600, color: '#065F46', cursor: 'pointer' }}>Accept</button>
                        <button onClick={() => reviewSuggestion(sug.id, 'rejected')} style={{ padding: '4px 8px', border: 'none', borderRadius: 4, background: '#FEE2E2', fontSize: 10, fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Reject</button>
                      </>
                    )}
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                      background: sug.status === 'accepted' ? '#D1FAE5' : sug.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                      color: sug.status === 'accepted' ? '#065F46' : sug.status === 'rejected' ? '#991B1B' : '#92400E',
                    }}>{sug.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggest a Setting Modal */}
      {showSuggest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowSuggest(false)}>
          <div style={{ background: C.card, borderRadius: 12, width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 14px' }}>Suggest a Setting</h3>
            <form onSubmit={submitSuggestion}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>Parameter Name *</label>
                  <input value={sugForm.parameter_name} onChange={e => setSugForm(f => ({ ...f, parameter_name: e.target.value }))} required style={inputS} placeholder="e.g. Retest window days" /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>Module</label>
                  <select value={sugForm.module} onChange={e => setSugForm(f => ({ ...f, module: e.target.value }))} style={inputS}>
                    <option value="">Select module</option>
                    <option>PO IN</option><option>PO OUT</option><option>Projects</option><option>Plan Builder</option>
                    <option>Client Module</option><option>Mail</option><option>Reports</option><option>User Module</option>
                  </select></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>Why needed? * (min 20 chars)</label>
                  <textarea value={sugForm.reason} onChange={e => setSugForm(f => ({ ...f, reason: e.target.value }))} required minLength={20} style={{ ...inputS, minHeight: 60, resize: 'vertical' }} /></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 3, display: 'block' }}>Example values</label>
                  <input value={sugForm.example_values} onChange={e => setSugForm(f => ({ ...f, example_values: e.target.value }))} style={inputS} placeholder="Default value, options" /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
                <button type="button" onClick={() => setShowSuggest(false)} style={{ padding: '7px 16px', border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '7px 16px', border: 'none', borderRadius: 6, background: C.blue, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
