import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'
import {
  ChevronLeft, Target, FileText, User, Phone, Mail, Globe,
  MessageSquare, Send, Calendar, Clock, DollarSign, Building2,
  CheckCircle, ArrowRight, Edit3, Tag, TrendingUp, Briefcase,
  Upload, FileText as FileTextIcon, X
} from 'lucide-react'

const STAGES = [
  { name: 'Prospecting', prob: 10, color: 'bg-slate-500' },
  { name: 'Qualification', prob: 10, color: 'bg-blue-500' },
  { name: 'Needs Analysis', prob: 20, color: 'bg-indigo-500' },
  { name: 'Value Proposition', prob: 50, color: 'bg-violet-500' },
  { name: 'Identify Decision Makers', prob: 70, color: 'bg-purple-500' },
  { name: 'Perception Analysis', prob: 80, color: 'bg-fuchsia-500' },
  { name: 'Proposal/Price Quote', prob: 90, color: 'bg-amber-500' },
  { name: 'Negotiation/Review', prob: 90, color: 'bg-orange-500' },
  { name: 'Closed Won', prob: 100, color: 'bg-emerald-500' },
  { name: 'Closed Lost', prob: 0, color: 'bg-red-500' },
]

export default function OpportunitiesDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)
  const [activityForm, setActivityForm] = useState({ activity_type: 'Meeting', title: '', description: '', activity_date: '' })
  const [editRemark, setEditRemark] = useState(null)
  const [viewRemark, setViewRemark] = useState(null)
  const remarkEditorRef = useRef(null)
  const openRemarkEditor = (r) => { setEditRemark(r); setViewRemark(null); setTimeout(() => { if (remarkEditorRef.current) remarkEditorRef.current.innerHTML = r.text || '' }, 50) }
  const saveRemark = async () => {
    if (!editRemark) return
    const text = remarkEditorRef.current?.innerHTML || ''
    if (!text.trim()) return
    try { await api.put(`/api/opportunities/${id}/remarks/${editRemark.id}`, { text }); loadDetail(); setEditRemark(null); toast('Saved') }
    catch (e) { toast('Failed to save', 'error') }
  }
  const execCmd = (cmd, val = null) => { document.execCommand(cmd, false, val) }

  const loadDetail = async () => {
    try {
      const response = await api.get(`/api/opportunities/${id}`)
      setData(response.data)
    } catch (error) {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadDetail() }, [id])

  const addRemark = async (e) => {
    e.preventDefault(); if (!noteText.trim()) return; setSending(true)
    try { await api.post(`/api/opportunities/${id}/remarks`, { text: noteText }); setNoteText(''); loadDetail() }
    catch (e) {} finally { setSending(false) }
  }

  const changeStage = async (stage) => {
    if (stage === 'Closed Lost') {
      const reason = prompt('Why was this opportunity lost? (This is required)')
      if (!reason) return
      await api.put(`/api/opportunities/${id}`, { stage, loss_reason: reason })
    } else {
      await api.put(`/api/opportunities/${id}`, { stage })
    }
    loadDetail()
  }

  const convertToLead = async () => {
    if (!confirm('This will create a Lead from this opportunity. Continue?')) return
    setConverting(true)
    try {
      const response = await api.post(`/api/opportunities/${id}/convert-to-lead`)
      alert(`Lead ${response.data.lead.lead_id} created!`)
      navigate('/leads')
    } catch (e) { alert(e.response?.data?.error || 'Conversion failed') }
    finally { setConverting(false) }
  }

  const addActivity = async (e) => {
    e.preventDefault(); if (!activityForm.title.trim()) return
    try {
      await api.post(`/api/opportunities/${id}/activities`, { ...activityForm, activity_date: activityForm.activity_date || undefined })
      setActivityForm({ activity_type: 'Meeting', title: '', description: '', activity_date: '' })
      loadDetail()
    } catch (e) {}
  }

  const addNote = async (e) => {
    e.preventDefault(); if (!noteText.trim()) return
    try { await api.post(`/api/opportunities/${id}/notes`, { content: noteText }); setNoteText(''); loadDetail() } catch (e) {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-400 animate-pulse">Loading opportunity details...</p></div>
  if (!data) return null

  const { opportunity: o, remarks = [], documents = [], activities = [], notes = [] } = data

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Breadcrumbs */}
      <nav className="text-sm text-slate-500 mb-4">
        <span onClick={() => navigate('/opportunities')} className="hover:text-violet-600 cursor-pointer">Opportunities</span>
        <span className="mx-2">/</span>
        <span className="text-slate-900 font-medium">{o.company_name}</span>
      </nav>

      {/* Back button */}
      <div className="mb-4">
        <button onClick={() => navigate('/opportunities')} className="text-sm text-violet-600 hover:text-violet-800 flex items-center gap-1 font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Opportunities
        </button>
      </div>

      {/* Stage Pipeline Header */}
      <div className="bg-white border border-slate-200 mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Current Stage</span>
            <span className={`px-3 py-1 text-sm font-bold text-white shadow-sm ${STAGES.find(s => s.name === o.stage)?.color || 'bg-slate-500'}`}>{o.stage} ({o.probability || 0}%)</span>
          </div>
          {o.stage === 'Closed Won' && (
            <button onClick={convertToLead} disabled={converting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm">
              <ArrowRight className="w-3.5 h-3.5" /> {converting ? 'Converting...' : 'Convert to Lead'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap px-5 py-3 gap-1.5 border-t border-slate-100">
          {STAGES.map(s => (
            <button key={s.name} onClick={() => changeStage(s.name)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                o.stage === s.name
                  ? `${s.color} text-white border-transparent shadow-sm`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
              }`}>
              {s.name} <span className="opacity-70">({s.prob}%)</span>
            </button>
          ))}
        </div>
        {o.loss_reason && (
          <div className="mx-5 mb-3 p-3 bg-red-50 border border-red-200">
            <p className="text-xs font-semibold text-red-600 uppercase mb-1">Loss Reason</p>
            <p className="text-sm text-red-700">{o.loss_reason}</p>
          </div>
        )}
      </div>

      {/* Opportunity Information Grid */}
      <div className="bg-white border border-slate-200 shadow-sm mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">Opportunity Information</h2></div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Name</span><p className="text-slate-800 font-medium mt-0.5">{o.contact_name || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Phone</span><p className="text-slate-800 font-medium mt-0.5">{o.contact_phone || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Email</span><p className="text-slate-800 font-medium mt-0.5">{o.contact_email || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Website</span><p className="text-slate-800 font-medium mt-0.5">—</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Company</span><p className="text-slate-800 font-medium mt-0.5">{o.company_name || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Address</span><p className="text-slate-800 font-medium mt-0.5">—</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">State</span><p className="text-slate-800 font-medium mt-0.5">—</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Pincode</span><p className="text-slate-800 font-medium mt-0.5">—</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Source</span><p className="text-slate-800 font-medium mt-0.5">{o.source || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Probability</span><p className="text-slate-800 font-medium mt-0.5">{o.probability || 0}%</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Assigned To</span><p className="text-slate-800 font-medium mt-0.5">{o.assigned_name || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Service</span><p className="text-slate-800 font-medium mt-0.5">{o.service_interest || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Created By</span><p className="text-slate-800 font-medium mt-0.5">{o.created_by_name || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Created On</span><p className="text-slate-800 font-medium mt-0.5">{o.created_at?.slice(0, 10) || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Expected Close</span><p className="text-slate-800 font-medium mt-0.5">{o.expected_close_date || '—'}</p></div>
            <div><span className="text-[11px] font-semibold text-slate-400 uppercase">Last Updated</span><p className="text-slate-800 font-medium mt-0.5">{o.updated_at?.slice(0, 10) || '—'}</p></div>
          </div>
        </div>
      </div>

      {/* Description */}
      {o.description && (
        <div className="bg-white border border-slate-200 shadow-sm mb-5">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">Description</h2></div>
          <div className="px-5 py-4"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{o.description}</p></div>
        </div>
      )}

      {/* Remarks */}
      <div className="bg-white border border-slate-200 shadow-sm mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">Remarks</h2></div>
        <div className="px-5 py-4">
          <form onSubmit={addRemark} className="flex gap-2 mb-4">
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
              placeholder="DD-MM-YY — remark" />
            <button type="submit" disabled={sending || !noteText.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> {sending ? '...' : 'Add'}
            </button>
          </form>
          {(!remarks || remarks.length === 0) ? (
            <p className="text-sm text-slate-400 italic">No remarks yet.</p>
          ) : (
            <div className="space-y-2">
              {remarks.map(r => (
                <div key={r.id} className="flex items-start gap-3 text-sm border-l-[3px] border-violet-300 pl-4 py-2 bg-slate-50 hover:bg-violet-50/50 transition-colors">
                  <span className="text-xs font-mono text-slate-400 whitespace-nowrap mt-0.5">{r.created_at?.slice(0, 10)}</span>
                  <p onClick={() => openRemarkEditor(r)} className="text-slate-700 flex-1 cursor-pointer hover:text-violet-700" dangerouslySetInnerHTML={{ __html: r.text }} />
                  <span className="text-xs text-slate-400 whitespace-nowrap mt-0.5">— {r.author}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white border border-slate-200 shadow-sm mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">All Activities</h2></div>
        <div className="px-5 py-4">
          <form onSubmit={addActivity} className="flex gap-2 mb-4">
            <select value={activityForm.activity_type} onChange={e => setActivityForm({ ...activityForm, activity_type: e.target.value })}
              className="px-2.5 py-2 border border-slate-300 text-sm bg-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors">
              <option>Meeting</option><option>Reminder</option>
            </select>
            <input value={activityForm.title} onChange={e => setActivityForm({ ...activityForm, title: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-300 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors" placeholder="Title" />
            <input type="date" value={activityForm.activity_date} onChange={e => setActivityForm({ ...activityForm, activity_date: e.target.value })}
              className="px-2.5 py-2 border border-slate-300 text-sm bg-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors" />
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">Add</button>
          </form>
          {(!activities || activities.length === 0) ? (
            <p className="text-sm text-slate-400 italic">No activities.</p>
          ) : (
            <div className="space-y-1.5">
              {activities.map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm py-2 px-3 border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                  <span className={`text-xs font-bold px-2.5 py-1 ${a.activity_type === 'Meeting' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{a.activity_type}</span>
                  <span className="text-slate-700 flex-1 font-medium">{a.title}</span>
                  {a.activity_date && <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{a.activity_date?.slice(0, 10)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white border border-slate-200 shadow-sm mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">Documents</h2></div>
        <div className="px-5 py-4">
          {(!documents || documents.length === 0) ? (
            <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
          ) : (
            <div className="space-y-1.5">
              {documents.map(d => (
                <div key={d.id} className="flex items-center gap-3 text-sm py-2 px-3 border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-violet-50 rounded flex items-center justify-center shrink-0"><FileTextIcon className="w-4 h-4 text-violet-500" /></div>
                  <span className="text-slate-700 flex-1 font-medium">{d.file_name}</span>
                  <span className="text-xs text-slate-400">{d.category} · {d.uploaded_by_name} · {d.uploaded_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 shadow-sm mb-5">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2"><h2 className="text-xs font-bold text-white uppercase tracking-wider">Notes</h2></div>
        <div className="px-5 py-4">
          <form onSubmit={addNote} className="flex gap-2 mb-4">
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors" placeholder="Add a note..." />
            <button type="submit" disabled={!noteText.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50">Add Note</button>
          </form>
          {(!notes || notes.length === 0) ? (
            <p className="text-sm text-slate-400 italic">No notes.</p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="flex items-start gap-3 text-sm py-3 px-3 border border-slate-100 bg-white hover:border-violet-200 hover:shadow-sm transition-all">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-xs font-bold text-white">{n.author?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-700 leading-relaxed">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {n.created_at?.slice(0, 10)} · {n.author}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ REMARK EDITOR MODAL ═══ */}
      {editRemark && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditRemark(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 640, maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Edit Remark</span>
              <button onClick={() => setEditRemark(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {[
                { cmd: 'bold', label: 'B', style: { fontWeight: 700 } },
                { cmd: 'italic', label: 'I', style: { fontStyle: 'italic' } },
                { cmd: 'underline', label: 'U', style: { textDecoration: 'underline' } },
                { type: 'sep' },
                { cmd: 'insertUnorderedList', label: '• List' },
                { cmd: 'insertOrderedList', label: '1. List' },
                { type: 'sep' },
                { cmd: 'formatBlock', val: 'h3', label: 'H3' },
                { cmd: 'formatBlock', val: 'p', label: 'P' },
              ].map((btn, i) => btn.type === 'sep' ? (
                <div key={i} style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px', alignSelf: 'center' }} />
              ) : (
                <button key={i} onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val) }}
                  style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', ...btn.style }}>{btn.label}</button>
              ))}
            </div>
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', minHeight: 180 }}>
              <div ref={remarkEditorRef} contentEditable suppressContentEditableWarning
                style={{ width: '100%', minHeight: 160, outline: 'none', fontSize: 14, lineHeight: 1.7, color: '#374151', fontFamily: 'inherit' }} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {editRemark.text && (
                <button onClick={() => { setViewRemark(editRemark); setEditRemark(null) }}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View</button>
              )}
              <button onClick={() => setEditRemark(null)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#F0F2F8', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveRemark} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REMARK VIEW MODAL ═══ */}
      {viewRemark && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewRemark(null)}>
          <div style={{ background: '#fff', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>Remark</span>
              <button onClick={() => setViewRemark(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F0F2F8', cursor: 'pointer', fontSize: 14, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', fontSize: 14, lineHeight: 1.7, color: '#374151' }} dangerouslySetInnerHTML={{ __html: viewRemark.text || '' }} />
            <div style={{ padding: '12px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setViewRemark(null); setEditRemark(viewRemark); setTimeout(() => { if (remarkEditorRef.current) remarkEditorRef.current.innerHTML = viewRemark.text || '' }, 50) }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#5B21B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, count, headers, rows, onViewAll }) {
  return (
    <div className="border border-slate-300 mb-5">
      <div className="bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">{title} ({count})</h3>
        {onViewAll && <button onClick={onViewAll} className="text-xs text-violet-600 hover:text-violet-800 font-medium">View All →</button>}
      </div>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left text-xs font-bold text-slate-600 border-b border-slate-300 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((row, i) => <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="px-3 py-2 text-xs text-slate-700">{cell}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      ) : <p className="text-xs text-slate-400 p-4">No {title.toLowerCase()}</p>}
    </div>
  )
}