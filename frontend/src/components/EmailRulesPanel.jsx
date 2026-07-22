import { useState, useEffect, useCallback } from 'react'
import { X, Flag } from 'lucide-react'
import { C } from './styleConstants'
import { listRules, createRule, deleteRule, updateRule } from '../api/emailApi'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function EmailRulesPanel({ onClose }) {
  const [rules, setRules] = useState([])
  const [employees, setEmployees] = useState([])
  const [name, setName] = useState('')
  const [matchType, setMatchType] = useState('domain')
  const [matchValue, setMatchValue] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignTo, setAssignTo] = useState('')

  const load = useCallback(async () => {
    try { const r = await listRules(); setRules(r.rules || []); setEmployees(r.employees || []) } catch (e) {}
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name || !matchValue) return
    await createRule({ name, match_type: matchType, match_value: matchValue, category, priority, assign_to_id: assignTo || null })
    setName(''); setMatchValue(''); setCategory(''); setPriority('Medium'); setAssignTo(''); load()
  }

  return (
    <div style={{ margin: '0 24px 16px', padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flag className="w-4 h-4" /> Auto Rules
        </h3>
        <button onClick={onClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Rule name" style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, width: 130 }} />
        <select value={matchType} onChange={e => setMatchType(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="domain">Domain (@gmail.com)</option>
          <option value="sender">Sender (email@)</option>
          <option value="subject">Subject (keyword)</option>
        </select>
        <input value={matchValue} onChange={e => setMatchValue(e.target.value)} placeholder="Match value" style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, width: 150 }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">→ Any</option>
          {CATEGORIES.map(c => <option key={c} value={c}>→ {c}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={assignTo} onChange={e => setAssignTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
          <option value="">→ No assign</option>
          {employees.map(e => <option key={e.id} value={e.id}>→ {e.name}</option>)}
        </select>
        <button onClick={handleAdd} disabled={!name || !matchValue}
          style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: name && matchValue ? C.blue : '#E2E8F0', color: name && matchValue ? '#fff' : '#94A3B8', fontSize: 12, cursor: name && matchValue ? 'pointer' : 'default', fontFamily: C.font }}>
          + Add
        </button>
      </div>
      {rules.map(r => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
          <button onClick={async () => { await updateRule(r.id, { is_active: !r.is_active }); load() }}
            style={{ padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: C.font, background: r.is_active ? '#D1FAE5' : '#FEE2E2', color: r.is_active ? '#065F46' : '#991B1B' }}>
            {r.is_active ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontWeight: 600, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          <span style={{ color: C.secondary }}>{r.match_type}: {r.match_value}</span>
          {r.category && <span style={{ color: C.blue }}>→ {r.category}</span>}
          {r.priority && <span style={{ color: '#F59E0B' }}>| {r.priority}</span>}
          {r.assign_to_name && <span style={{ color: '#6D28D9' }}>| → {r.assign_to_name}</span>}
          <button onClick={async () => { await deleteRule(r.id); load() }} style={{ marginLeft: 'auto', padding: 2, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {rules.length === 0 && <p style={{ fontSize: 12, color: C.secondary, margin: 0 }}>No rules yet. Add one above.</p>}
    </div>
  )
}
