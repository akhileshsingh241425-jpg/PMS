import { useState, useEffect, useCallback } from 'react'
import { X, FileText } from 'lucide-react'
import { C } from './styleConstants'
import { listTemplates, createTemplate, deleteTemplate, updateTemplate } from '../api/emailApi'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']

export default function EmailTemplatesPanel({ onClose }) {
  const [templates, setTemplates] = useState([])
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')

  const load = useCallback(async () => {
    try { const r = await listTemplates(); setTemplates(r.templates || []) } catch (e) {}
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!name || !subject || !body) return
    await createTemplate({ name, subject, body, category })
    setName(''); setSubject(''); setBody(''); setCategory(''); load()
  }

  return (
    <div style={{ margin: '0 24px 16px', padding: 16, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText className="w-4 h-4" /> Email Templates
        </h3>
        <button onClick={onClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer' }}><X className="w-4 h-4" /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text }} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
            <option value="">Any category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (e.g. Quotation for {company})" style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body template..." rows={3} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, resize: 'vertical' }} />
        <button onClick={handleAdd} disabled={!name || !subject || !body}
          style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 8, border: 'none', background: name && subject && body ? C.blue : '#E2E8F0', color: name && subject && body ? '#fff' : '#94A3B8', fontSize: 12, cursor: name && subject && body ? 'pointer' : 'default', fontFamily: C.font }}>
          + Add Template
        </button>
      </div>
      {templates.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 4, fontSize: 12 }}>
          <span style={{ fontWeight: 600, width: 120 }}>{t.name}</span>
          <span style={{ color: C.secondary }}>{t.subject}</span>
          {t.category && <span style={badge({ background: '#DEEBFF', color: C.blue })}>{t.category}</span>}
          <button onClick={async () => { await deleteTemplate(t.id); load() }} style={{ marginLeft: 'auto', padding: 2, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {templates.length === 0 && <p style={{ fontSize: 12, color: C.secondary, margin: 0 }}>No templates yet.</p>}
    </div>
  )
}

function badge(s) { return { padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, ...s } }
