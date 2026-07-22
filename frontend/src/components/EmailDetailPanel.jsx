import { useState, useEffect, useCallback } from 'react'
import { X, MessageSquare, Activity, User, Bell, Flag, Tag, Clock, AlertTriangle, CheckCircle, FileText, ChevronDown, Search, UserCheck, Calendar, BookOpen, Briefcase, AtSign, Phone, Building, Star, Send, MoreHorizontal, Mail } from 'lucide-react'
import { C } from './styleConstants'
import { categorizeMessage, assignMessage, updateStatus, setPriority, setTags, snoozeMessage, listNotes, addNote, listActivities, getCustomerProfile, checkDuplicate, createFollowup, listTemplates } from '../api/emailApi'

const CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
const STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TAGS_PRESET = ['Solar', 'Urgent', 'Tender', 'Payment', 'Warranty', 'Support', 'VIP']

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
  const [assignSearch, setAssignSearch] = useState('')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [assignNotes, setAssignNotes] = useState('')
  const [assignDueDate, setAssignDueDate] = useState('')
  const [assigning, setAssigning] = useState(false)

  const loadDetails = useCallback(async () => {
    try { const r = await listNotes(msg.id); setNotes(r.notes || []) } catch (e) {}
    try { const r = await listActivities(msg.id); setActivities(r.activities || []) } catch (e) {}
    try { const r = await getCustomerProfile(msg.id); setProfile(r) } catch (e) {}
    try { const r = await checkDuplicate(msg.id); setDuplicates(r.duplicates || []) } catch (e) {}
    try { const r = await listTemplates(); setTemplates(r.templates || []) } catch (e) {}
  }, [msg.id])

  useEffect(() => { loadDetails() }, [loadDetails])

  const handleCategorize = async (cat) => { await categorizeMessage(msg.id, cat); msg.category = cat; onRefresh() }
  const handleAssign = async (uid) => {
    setAssigning(true)
    try {
      await assignMessage(msg.id, uid, assignNotes, assignDueDate)
      const emp = employees.find(e => e.id === uid)
      msg.assigned_to_id = uid
      msg.assigned_to_name = emp?.name
      msg.status = 'Assigned'
      setShowAssignDropdown(false); setAssignSearch(''); setAssignNotes(''); setAssignDueDate('')
      onRefresh()
    } catch (e) {}
    finally { setAssigning(false) }
  }
  const handleStatus = async (st) => { await updateStatus(msg.id, st); msg.status = st; onRefresh() }
  const handlePriority = async (pr) => { await setPriority(msg.id, pr); msg.priority = pr; onRefresh() }
  const handleAddNote = async () => { if (!newNote.trim()) return; await addNote(msg.id, newNote); setNewNote(''); loadDetails() }
  const handleSnooze = async () => { if (!snoozeDate) return; await snoozeMessage(msg.id, new Date(snoozeDate).toISOString()); onRefresh(); setSnoozeDate('') }
  const handleFollowup = async () => { if (!followupDate) return; await createFollowup(msg.id, new Date(followupDate).toISOString(), followupNote); setFollowupDate(''); setFollowupNote(''); loadDetails() }
  const handleAddTag = async (t) => { const tags = [...new Set([...(msg.tags || []), t])]; await setTags(msg.id, tags); msg.tags = tags; onRefresh() }
  const handleRemoveTag = async (t) => { const tags = (msg.tags || []).filter(x => x !== t); await setTags(msg.id, tags); msg.tags = tags; onRefresh() }
  const handleTemplateSelect = async (t) => { await addNote(msg.id, `Template: ${t.name}\nSubject: ${t.subject}\nBody: ${t.body}`); loadDetails() }

  const filteredEmployees = employees.filter(e => {
    if (!assignSearch) return true
    const q = assignSearch.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
  })

  const initials = (msg.sender_name || msg.sender_email || '?').charAt(0).toUpperCase()
  const catColor = msg.category === 'Lead' ? '#6D28D9' : msg.category === 'Support' ? '#3B82F6' : msg.category === 'Invoice' ? '#EF4444' : msg.category === 'Meeting' ? '#8B5CF6' : msg.category === 'Task' ? '#EC4899' : msg.category === 'Follow-up' ? '#F59E0B' : msg.category === 'Client' ? '#10B981' : '#64748B'

  return (
    <div style={{ flex: 1, minWidth: 0, background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>

      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, lineHeight: 1.3 }}>{msg.subject || '(no subject)'}</div>
            <div style={{ fontSize: 13, color: C.text }}><strong>{msg.sender_name}</strong> <span style={{ color: C.secondary }}>&lt;{msg.sender_email}&gt;</span></div>
            <div style={{ fontSize: 11, color: C.secondary, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Calendar className="w-3 h-3" />{msg.received_at ? new Date(msg.received_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              {msg.recipient_email && <><span style={{ opacity: 0.3 }}>·</span><AtSign className="w-3 h-3" />To: {msg.recipient_email}</>}
              {msg.company && <><span style={{ opacity: 0.3 }}>·</span><Building className="w-3 h-3" />{msg.company}</>}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer', color: C.secondary, flexShrink: 0 }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {duplicates.length > 0 && (
        <div style={{ padding: '8px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle className="w-4 h-4" style={{ flexShrink: 0 }} />
          <span>Duplicate found: {duplicates.map(d => `${d.type} #${d.id} (${d.name || ''})`).join(', ')}</span>
        </div>
      )}

      <div style={{ padding: '16px 20px', flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 10, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: C.text, marginBottom: 18, border: `1px solid ${C.border}`, maxHeight: 200, overflow: 'auto' }}>
          {msg.body_preview || '(no content)'}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: `1px solid ${C.border}` }}>
          {[
            { key: 'actions', label: 'Actions', icon: Send },
            { key: 'notes', label: `Notes (${notes.length})`, icon: MessageSquare },
            { key: 'activity', label: 'Activity', icon: Activity },
            { key: 'profile', label: 'Profile', icon: BookOpen },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: activeTab === t.key ? 600 : 500, fontFamily: C.font, transition: 'all 0.12s',
                  background: activeTab === t.key ? '#F1F5F9' : 'transparent',
                  color: activeTab === t.key ? C.text : C.secondary,
                  borderBottom: activeTab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'actions' && (
          <div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'block' }}>Status</label>
                <select value={msg.status} onChange={e => handleStatus(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, outline: 'none' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'block' }}>Priority</label>
                <select value={msg.priority} onChange={e => handlePriority(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, outline: 'none' }}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'block' }}>Category</label>
                <select value={msg.category} onChange={e => handleCategorize(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, outline: 'none' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'block' }}>Assign as Task To</label>
                <div style={{ position: 'relative' }}>
                  <div onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                    <span>{msg.assigned_to_name ? `Task → ${msg.assigned_to_name}` : 'Select employee...'}</span>
                    <ChevronDown className="w-3 h-3" style={{ color: C.secondary }} />
                  </div>
                  {showAssignDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, marginTop: 4,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 6, padding: '6px 10px', marginBottom: 6 }}>
                          <Search className="w-3 h-3" style={{ color: C.secondary }} />
                          <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                            style={{ border: 'none', outline: 'none', fontSize: 12, fontFamily: C.font, background: 'transparent', flex: 1, color: C.text }}
                            placeholder="Search employee..." />
                        </div>
                        <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
                          placeholder="Assignment notes (task description)..."
                          rows={2}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', color: C.text, resize: 'vertical', boxSizing: 'border-box', outline: 'none', marginBottom: 6 }} />
                        <input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
                      </div>
                      <div style={{ maxHeight: 160, overflow: 'auto' }}>
                        {filteredEmployees.map(e => (
                          <div key={e.id} onClick={() => !assigning && handleAssign(e.id)}
                            style={{ padding: '8px 14px', cursor: assigning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.text, opacity: assigning ? 0.5 : 1, transition: 'background 0.1s' }}
                            onMouseEnter={e => { if (!assigning) e.currentTarget.style.background = '#F1F5F9' }}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {e.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{e.name}</div>
                              <div style={{ fontSize: 10, color: C.secondary }}>{e.email}</div>
                            </div>
                          </div>
                        ))}
                        {filteredEmployees.length === 0 && (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: C.secondary, textAlign: 'center' }}>No employees found</div>
                        )}
                      </div>
                      <div style={{ padding: '6px 10px', borderTop: `1px solid ${C.border}`, textAlign: 'right', fontSize: 10, color: C.secondary }}>
                        Task will be created with email as title
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Tag className="w-3.5 h-3.5" style={{ color: C.secondary }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.secondary }}>Tags</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {(msg.tags || []).map(t => (
                  <span key={t} style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#DEEBFF', color: C.blue, display: 'flex', alignItems: 'center', gap: 4, cursor: 'default' }}>
                    {t} <X className="w-3 h-3" style={{ cursor: 'pointer' }} onClick={() => handleRemoveTag(t)} />
                  </span>
                ))}
                <select value="" onChange={e => { if (e.target.value) handleAddTag(e.target.value) }}
                  style={{ padding: '3px 8px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 10, fontFamily: C.font, background: '#fff', cursor: 'pointer', color: C.text, outline: 'none' }}>
                  <option value="">+ Add Tag</option>
                  {TAGS_PRESET.filter(t => !(msg.tags || []).includes(t)).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Bell className="w-3 h-3" /> Snooze Until
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="datetime-local" value={snoozeDate} onChange={e => setSnoozeDate(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none' }} />
                  <button onClick={handleSnooze} disabled={!snoozeDate}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: snoozeDate ? C.blue : '#E2E8F0', color: snoozeDate ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: 500, cursor: snoozeDate ? 'pointer' : 'default', fontFamily: C.font, whiteSpace: 'nowrap' }}>
                    Snooze
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: C.secondary, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock className="w-3 h-3" /> Follow-up
                </label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="datetime-local" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none', width: '40%' }} />
                  <input value={followupNote} onChange={e => setFollowupNote(e.target.value)} placeholder="Note..."
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none' }} />
                  <button onClick={handleFollowup} disabled={!followupDate}
                    style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: followupDate ? '#6D28D9' : '#E2E8F0', color: followupDate ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: 500, cursor: followupDate ? 'pointer' : 'default', fontFamily: C.font, whiteSpace: 'nowrap' }}>
                    Set
                  </button>
                </div>
              </div>
            </div>

            {templates.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText className="w-3 h-3" /> Quick Reply Templates
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {templates.map(t => (
                    <button key={t.id} onClick={() => handleTemplateSelect(t)}
                      style={{ padding: '4px 12px', borderRadius: 8, background: '#DEEBFF', color: C.blue, cursor: 'pointer', border: 'none', fontSize: 11, fontWeight: 500, fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText className="w-3 h-3" />{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add internal note..." rows={2}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontFamily: C.font, background: '#fff', color: C.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAddNote} disabled={!newNote.trim()}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: newNote.trim() ? C.blue : '#E2E8F0', color: newNote.trim() ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: 500, cursor: newNote.trim() ? 'pointer' : 'default', fontFamily: C.font, alignSelf: 'flex-start' }}>
                Add Note
              </button>
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {notes.map(n => (
                <div key={n.id} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, marginBottom: 6, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.secondary, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User className="w-3 h-3" /> {n.user_name} · {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{n.note}</div>
                </div>
              ))}
              {notes.length === 0 && <p style={{ fontSize: 12, color: C.secondary, textAlign: 'center', padding: 20 }}>No notes yet. Add one above.</p>}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {activities.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 10, marginBottom: 8, padding: '6px 0', borderLeft: `2px solid ${C.blue}20`, paddingLeft: 14 }}>
                <div style={{ fontSize: 11, color: C.secondary, flexShrink: 0, width: 60, textAlign: 'right' }}>
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
                <div style={{ fontSize: 12, color: C.text }}>
                  <span style={{ fontWeight: 600, color: C.blue }}>{a.action}</span>
                  {a.detail ? <span style={{ color: C.secondary }}> — {a.detail}</span> : ''}
                </div>
              </div>
            ))}
            {activities.length === 0 && <p style={{ fontSize: 12, color: C.secondary, textAlign: 'center', padding: 20 }}>No activity yet</p>}
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            {profile ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{profile.sender_name || profile.sender_email}</div>
                    <div style={{ fontSize: 11, color: C.secondary, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AtSign className="w-3 h-3" /> {profile.sender_email}
                      {profile.company && <><span style={{ opacity: 0.3 }}>·</span><Building className="w-3 h-3" />{profile.company}</>}
                    </div>
                  </div>
                </div>

                {profile.leads.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star className="w-3 h-3" /> Leads
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {profile.leads.map(l => (
                        <div key={l.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}` }}>
                          <User className="w-3 h-3" style={{ color: C.secondary }} />
                          <span style={{ fontWeight: 500 }}>{l.name}</span>
                          {l.company && <span style={{ color: C.secondary }}>· {l.company}</span>}
                          <span style={{ marginLeft: 'auto', background: '#DEEBFF', color: C.blue, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.accounts.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building className="w-3 h-3" /> Accounts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {profile.accounts.map(a => (
                        <div key={a.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}` }}>
                          <Building className="w-3 h-3" style={{ color: C.secondary }} />
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                          {a.email && <span style={{ color: C.secondary }}>· {a.email}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.contacts && profile.contacts.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen className="w-3 h-3" /> Contacts
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {profile.contacts.map(c => (
                        <div key={c.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}` }}>
                          <User className="w-3 h-3" style={{ color: C.secondary }} />
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                          {c.email && <span style={{ color: C.secondary }}>· {c.email}</span>}
                          {c.phone && <span style={{ color: C.secondary }}>· {c.phone}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.previous_emails && profile.previous_emails.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.secondary, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail className="w-3 h-3" /> Previous Emails ({profile.previous_emails.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {profile.previous_emails.slice(0, 5).map(e => (
                        <div key={e.id} style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, border: `1px solid ${C.border}` }}>
                          <div style={{ fontWeight: 500, marginBottom: 2 }}>{e.subject || '(no subject)'}</div>
                          <div style={{ fontSize: 11, color: C.secondary }}>{e.received_at ? new Date(e.received_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {e.category || 'No category'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!profile.leads?.length && !profile.accounts?.length && !profile.contacts?.length && !profile.previous_emails?.length && (
                  <p style={{ fontSize: 12, color: C.secondary, textAlign: 'center', padding: 20 }}>No customer data found for this email</p>
                )}
              </div>
            ) : <p style={{ fontSize: 12, color: C.secondary, textAlign: 'center', padding: 20 }}>Loading profile...</p>}
          </div>
        )}
      </div>
    </div>
  )
}
