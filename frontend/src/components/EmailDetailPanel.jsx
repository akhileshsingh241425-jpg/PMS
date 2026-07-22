import { useState, useEffect, useCallback } from 'react'
import { X, MessageSquare, Activity, User, Bell, Flag, Tag, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import { C } from './styleConstants'
import { categorizeMessage, assignMessage, updateStatus, setPriority, setTags, snoozeMessage, listNotes, addNote, listActivities, getCustomerProfile, checkDuplicate, createFollowup, listTemplates } from '../api/emailApi'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TAGS_PRESET = ['Solar', 'Urgent', 'Tender', 'Payment', 'Warranty', 'Support', 'VIP']
const CAT_COLORS = { Lead: '#6D28D9', Client: '#10B981', 'Follow-up': '#F59E0B', Support: '#3B82F6', Task: '#EC4899', Meeting: '#8B5CF6', Invoice: '#EF4444', Other: '#64748B' }

export default function EmailDetailPanel({ msg, employees, onClose, onRefresh }) {
  const [notes, setNotes] = useState([])
  const [activities, setActivities] = useState([])
  const [newNote, setNewNote] = useState('')
  const [snoozeDate, setSnoozeDate] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [followupNote, setFollowupNote] = useState('')
  const [profile, setProfile] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('actions')

  const loadDetails = useCallback(async () => {
    try { const r = await listNotes(msg.id); setNotes(r.notes || []) } catch (e) {}
    try { const r = await listActivities(msg.id); setActivities(r.activities || []) } catch (e) {}
    try { const r = await getCustomerProfile(msg.id); setProfile(r) } catch (e) {}
    try { const r = await checkDuplicate(msg.id); setDuplicates(r.duplicates || []) } catch (e) {}
    try { const r = await listTemplates(); setTemplates(r.templates || []) } catch (e) {}
  }, [msg.id])

  useEffect(() => { loadDetails() }, [loadDetails])

  const handleCategorize = async (cat) => { await categorizeMessage(msg.id, cat); msg.category = cat; onRefresh() }
  const handleAssign = async (uid) => { await assignMessage(msg.id, uid); const emp = employees.find(e => e.id === uid); msg.assigned_to_id = uid; msg.assigned_to_name = emp?.name; msg.status = 'Assigned'; onRefresh() }
  const handleStatus = async (st) => { await updateStatus(msg.id, st); msg.status = st; onRefresh() }
  const handlePriority = async (pr) => { await setPriority(msg.id, pr); msg.priority = pr; onRefresh() }
  const handleAddNote = async () => { if (!newNote.trim()) return; await addNote(msg.id, newNote); setNewNote(''); loadDetails() }
  const handleSnooze = async () => { if (!snoozeDate) return; await snoozeMessage(msg.id, new Date(snoozeDate).toISOString()); onRefresh(); setSnoozeDate('') }
  const handleFollowup = async () => { if (!followupDate) return; await createFollowup(msg.id, new Date(followupDate).toISOString(), followupNote); setFollowupDate(''); setFollowupNote(''); loadDetails() }
  const handleAddTag = async (t) => { const tags = [...new Set([...(msg.tags || []), t])]; await setTags(msg.id, tags); msg.tags = tags; onRefresh() }
  const handleRemoveTag = async (t) => { const tags = (msg.tags || []).filter(x => x !== t); await setTags(msg.id, tags); msg.tags = tags; onRefresh() }
  const handleTemplateSelect = async (t) => { await addNote(msg.id, `Template: ${t.name}\nSubject: ${t.subject}\nBody: ${t.body}`); loadDetails() }

  const badge = (s) => ({ padding: '3px 10px', borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 600, fontFamily: C.font, whiteSpace: 'nowrap', ...s })

  return (
    <div style={{ flex: '0 0 60%', minWidth: 0, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{msg.subject || '(no subject)'}</div>
          <div style={{ fontSize: 13, color: C.text }}><strong>{msg.sender_name}</strong> &lt;{msg.sender_email}&gt;</div>
          <div style={{ fontSize: 11, color: C.secondary, marginTop: 2 }}>
            {msg.received_at ? new Date(msg.received_at).toLocaleString('en-IN') : ''}
            {msg.recipient_email && `  · To: ${msg.recipient_email}`}
            {msg.company && `  · ${msg.company}`}
          </div>
        </div>
        <button onClick={onClose} style={{ padding: 4, borderRadius: 6, border: 'none', background: '#F1F5F9', cursor: 'pointer', color: C.secondary }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Duplicate Alert */}
      {duplicates.length > 0 && (
        <div style={{ padding: '8px 16px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle className="w-4 h-4" /> Duplicate: {duplicates.map(d => `${d.type} #${d.id} (${d.name || ''})`).join(', ')}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 16, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.text, marginBottom: 16, maxHeight: 180, overflow: 'auto' }}>
          {msg.body_preview || '(no content)'}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: `1px solid ${C.border}` }}>
          {[
            { key: 'actions', label: 'Actions' },
            { key: 'notes', label: `Notes (${notes.length})` },
            { key: 'activity', label: 'Activity' },
            { key: 'profile', label: 'Profile' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: '6px 14px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: activeTab === t.key ? 600 : 500, fontFamily: C.font,
                background: activeTab === t.key ? '#F1F5F9' : 'transparent', color: activeTab === t.key ? C.text : C.secondary,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'actions' && (
          <div>
            {/* Actions Row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <select value={msg.status} onChange={e => handleStatus(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={msg.priority} onChange={e => handlePriority(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={msg.category} onChange={e => handleCategorize(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={msg.assigned_to_id || ''} onChange={e => { const v = parseInt(e.target.value); if (v) handleAssign(v) }}
                style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, minWidth: 120 }}>
                <option value="">Assign...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, padding: 10, background: '#F8FAFC', borderRadius: 8 }}>
              <Tag className="w-3 h-3" style={{ color: C.secondary }} />
              {(msg.tags || []).map(t => (
                <span key={t} style={badge({ background: '#DEEBFF', color: C.blue, display: 'flex', alignItems: 'center', gap: 3 })}>
                  {t} <X className="w-3 h-3" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                </span>
              ))}
              <select value="" onChange={e => { if (e.target.value) handleAddTag(e.target.value) }}
                style={{ padding: '2px 6px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 10, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text }}>
                <option value="">+ Tag</option>
                {TAGS_PRESET.filter(t => !(msg.tags || []).includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Snooze + Follow-up */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Bell className="w-3 h-3" style={{ color: C.secondary }} />
                <input type="datetime-local" value={snoozeDate} onChange={e => setSnoozeDate(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', color: C.text }} />
                <button onClick={handleSnooze} disabled={!snoozeDate}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: snoozeDate ? C.blue : '#E2E8F0', color: snoozeDate ? '#fff' : '#94A3B8', fontSize: 11, cursor: snoozeDate ? 'pointer' : 'default', fontFamily: C.font }}>
                  Snooze
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
                <Clock className="w-3 h-3" style={{ color: C.secondary }} />
                <input type="datetime-local" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', color: C.text }} />
                <input value={followupNote} onChange={e => setFollowupNote(e.target.value)} placeholder="Note..."
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', color: C.text }} />
                <button onClick={handleFollowup} disabled={!followupDate}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: followupDate ? '#6D28D9' : '#E2E8F0', color: followupDate ? '#fff' : '#94A3B8', fontSize: 11, cursor: followupDate ? 'pointer' : 'default', fontFamily: C.font }}>
                  Follow-up
                </button>
              </div>
            </div>

            {/* Templates */}
            {templates.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.secondary, marginBottom: 4, fontWeight: 600 }}>Quick Reply Templates</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {templates.map(t => (
                    <button key={t.id} onClick={() => handleTemplateSelect(t)}
                      style={badge({ background: '#DEEBFF', color: C.blue, cursor: 'pointer' })}>
                      <FileText className="w-3 h-3" style={{ marginRight: 3 }} />{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add internal note..."
                style={{ flex: 1, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none' }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }} />
              <button onClick={handleAddNote} disabled={!newNote.trim()}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: newNote.trim() ? C.blue : '#E2E8F0', color: newNote.trim() ? '#fff' : '#94A3B8', fontSize: 12, cursor: newNote.trim() ? 'pointer' : 'default', fontFamily: C.font }}>
                Add Note
              </button>
            </div>
            {notes.map(n => (
              <div key={n.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: C.secondary, marginBottom: 2 }}>{n.user_name} · {n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</div>
                <div style={{ fontSize: 12, color: C.text }}>{n.note}</div>
              </div>
            ))}
            {notes.length === 0 && <p style={{ fontSize: 12, color: C.secondary }}>No notes yet</p>}
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {activities.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 8, marginBottom: 6, padding: '4px 0', borderLeft: '2px solid #E2E8F0', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, color: C.secondary, flexShrink: 0, width: 70 }}>{a.created_at ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                <div style={{ fontSize: 12, color: C.text }}><strong>{a.action}</strong>{a.detail ? `: ${a.detail}` : ''}</div>
              </div>
            ))}
            {activities.length === 0 && <p style={{ fontSize: 12, color: C.secondary }}>No activity yet</p>}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            {profile ? (
              <div>
                <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}><strong>Email:</strong> {profile.sender_email}</div>
                {profile.company && <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}><strong>Company:</strong> {profile.company}</div>}

                {profile.leads.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Leads</div>
                    {profile.leads.map(l => (
                      <div key={l.id} style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 3, fontSize: 12 }}>
                        {l.name} · {l.status}
                      </div>
                    ))}
                  </div>
                )}

                {profile.accounts.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Accounts</div>
                    {profile.accounts.map(a => (
                      <div key={a.id} style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 3, fontSize: 12 }}>
                        {a.name} · {a.email}
                      </div>
                    ))}
                  </div>
                )}

                {profile.previous_emails.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Previous Emails</div>
                    {profile.previous_emails.slice(0, 5).map(e => (
                      <div key={e.id} style={{ padding: '6px 10px', background: '#F8FAFC', borderRadius: 6, marginBottom: 3, fontSize: 12 }}>
                        {e.subject || '(no subject)'} · {e.received_at ? new Date(e.received_at).toLocaleDateString('en-IN') : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p style={{ fontSize: 12, color: C.secondary }}>Loading...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
