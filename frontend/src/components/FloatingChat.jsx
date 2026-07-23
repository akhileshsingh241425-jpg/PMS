import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { MessageSquare, Send, X, Minus, Maximize2, ChevronLeft, Check, CheckCheck, Paperclip, Users, Search, Reply } from 'lucide-react'

const C = {
  primary: '#6c3ef4', primaryLight: '#F5F3FF',
  text: '#0F172A', muted: '#94A3B8', secondary: '#64748B',
  border: '#E5E7EB', card: '#fff', bg: '#F8FAFC',
  font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function FloatingChat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [allUsers, setAllUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [inputText, setInputText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const {
    connected, onlineUsers, conversations, setConversations,
    activeConv, setActiveConv, messages, setMessages,
    typingUsers, loadConversations, loadMessages,
    sendMessage, startTyping, stopTyping, markRead,
    joinConversation, leaveConversation, deleteMessage,
  } = useChat()

  useEffect(() => { if (open) { loadConversations(); api.get('/api/chat/users').then(r => setAllUsers(r.data.users || [])).catch(() => {}) } }, [open])

  useEffect(() => {
    if (activeConv) {
      joinConversation(activeConv.id)
      loadMessages(activeConv.id).then(msgs => setMessages(msgs))
      markRead(activeConv.id)
      setView('chat')
      return () => leaveConversation(activeConv.id)
    }
  }, [activeConv?.id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filteredConvs = conversations.filter(c => (c.name || '').toLowerCase().includes(userSearch.toLowerCase()))
  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) && u.id !== user?.id
  })

  const handleSend = () => {
    const text = inputText.trim()
    if (!text && !replyTo) return
    if (activeConv) {
      sendMessage({ conversation_id: activeConv.id, message: text, reply_to: replyTo?.id })
      setInputText('')
      setReplyTo(null)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const startConversation = async (recipient) => {
    try {
      const r = await api.post('/api/chat/conversations', { type: 'direct', participant_ids: [recipient.id] })
      setConversations(prev => {
        const exists = prev.find(c => c.id === r.data.conversation.id)
        return exists ? prev : [r.data.conversation, ...prev]
      })
      setActiveConv(r.data.conversation)
    } catch (e) { console.error(e) }
  }

  const getStatusColor = (userId) => {
    const st = onlineUsers[userId]
    if (!st || st.status === 'offline') return '#9CA3AF'
    return st.status === 'online' ? '#22C55E' : '#F59E0B'
  }

  const renderStatus = (msg) => {
    if (msg.is_deleted || msg.sender_id !== user?.id) return null
    const myStatus = msg.statuses?.[user.id]
    if (!myStatus) return <Check size={10} color="#94A3B8" />
    if (myStatus === 'read') return <CheckCheck size={10} color="#3B82F6" />
    if (myStatus === 'delivered') return <CheckCheck size={10} color="#94A3B8" />
    return <Check size={10} color="#94A3B8" />
  }

  if (!user) return null

  return (
    <>
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
          width: 380, height: 540, background: C.card,
          borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: `1px solid ${C.border}`,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px', background: C.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {view === 'chat' && activeConv ? activeConv.name : 'Chat'}
              </span>
              {connected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => navigate('/chat')} title="Open full chat"
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize2 size={12} />
              </button>
              <button onClick={() => setOpen(false)}
                style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Minus size={12} />
              </button>
            </div>
          </div>

          {view === 'chat' && activeConv ? (
            <>
              {/* Chat header */}
              <div style={{
                padding: '8px 12px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 8, background: C.card, flexShrink: 0,
              }}>
                <button onClick={() => { setActiveConv(null); setMessages([]); setView('list') }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: C.secondary }}>
                  <ChevronLeft size={16} />
                </button>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: activeConv.type === 'group' ? '#EDE9FE' : C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
                  {activeConv.type === 'group' ? <Users size={12} /> : (activeConv.name || '?')[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{activeConv.name}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>
                    {activeConv.type === 'direct' && activeConv.other_user && (
                      <><span style={{ width: 5, height: 5, borderRadius: '50%', background: getStatusColor(activeConv.other_user.id), display: 'inline-block', marginRight: 3 }} />Online</>
                    )}
                    {activeConv.type === 'group' && `${activeConv.participants?.length || 0} members`}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', background: '#F8FAFC' }}>
                {messages.map(msg => {
                  const isMe = msg.sender_id === user?.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 3 }}
                      onContextMenu={e => { e.preventDefault(); if (isMe && !msg.is_deleted) { if (confirm('Delete?')) { deleteMessage(msg.id, 'everyone'); api.delete(`/api/chat/messages/${msg.id}`).catch(() => {}) } } }}>
                      <div style={{ maxWidth: '80%', minWidth: 40 }}>
                        {!isMe && <div style={{ fontSize: 9, color: C.muted, marginBottom: 1, marginLeft: 2, fontWeight: 600 }}>{msg.sender_name}</div>}
                        {msg.reply_message && (
                          <div style={{ padding: '3px 6px', borderLeft: `2px solid ${C.primary}`, marginBottom: 2, fontSize: 9, background: '#F1F5F9', borderRadius: '4px 4px 0 0', color: C.secondary }}>
                            {msg.reply_message.sender_name}: {msg.reply_message.message?.slice(0, 40) || 'Media'}
                          </div>
                        )}
                        <div style={{
                          padding: '6px 10px', borderRadius: 12,
                          background: isMe ? C.primary : C.card,
                          color: isMe ? '#fff' : C.text,
                          border: isMe ? 'none' : `1px solid ${C.border}`,
                          fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word',
                          borderBottomRightRadius: isMe ? 4 : 12,
                          borderBottomLeftRadius: isMe ? 12 : 4,
                        }}>
                          {msg.is_deleted ? (
                            <span style={{ fontStyle: 'italic', color: C.muted, fontSize: 10 }}>Deleted</span>
                          ) : msg.message_type === 'image' ? (
                            <img src={msg.file_url} alt="" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8 }} />
                          ) : msg.message_type === 'file' ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isMe ? '#fff' : C.primary, textDecoration: 'underline', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Paperclip size={10} /> {msg.file_name || 'File'}
                            </a>
                          ) : msg.message}
                        </div>
                        <div style={{ fontSize: 8, color: C.muted, marginTop: 1, display: 'flex', alignItems: 'center', gap: 2, justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '0 2px' }}>
                          {formatTime(msg.created_at)}
                          {renderStatus(msg)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {Object.values(typingUsers).filter(t => t.conversation_id === activeConv?.id && t.typing).slice(0, 1).map(t => (
                  <div key={t.user_id} style={{ fontSize: 10, color: C.muted, padding: '2px 4px', fontStyle: 'italic' }}>{t.full_name} typing...</div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div style={{ padding: '4px 10px', background: '#F1F5F9', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
                  <Reply size={10} color={C.primary} />
                  <span style={{ flex: 1, color: C.secondary }}>Replying to <strong>{replyTo.sender_name}</strong></span>
                  <X size={12} color={C.muted} style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)} />
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '8px 10px', borderTop: `1px solid ${C.border}`, background: C.card }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <textarea ref={inputRef} value={inputText} onChange={e => { setInputText(e.target.value); if (activeConv) { startTyping(activeConv.id); clearTimeout(window.typingTimer); window.typingTimer = setTimeout(() => stopTyping(activeConv.id), 2000) } }}
                    onKeyDown={handleKeyDown} placeholder="Type..." rows={1}
                    style={{ flex: 1, padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, resize: 'none', maxHeight: 60 }}
                    onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 60) + 'px' }} />
                  <button onClick={handleSend} disabled={!inputText.trim()}
                    style={{ border: 'none', background: C.primary, color: '#fff', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', opacity: !inputText.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Search */}
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 8, padding: '5px 8px' }}>
                  <Search size={12} color="#94A3B8" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search..."
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 11, width: '100%', fontFamily: C.font }} />
                  {userSearch && <X size={12} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setUserSearch('')} />}
                </div>
              </div>

              {/* Users + Conversations */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {userSearch && filteredUsers.length > 0 && (
                  <div>
                    <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Users</div>
                    {filteredUsers.slice(0, 15).map(u => (
                      <div key={u.id} onClick={() => startConversation(u)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.primary, flexShrink: 0 }}>{(u.full_name || '?')[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.text }}>{u.full_name}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{u.designation || u.department || u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  {filteredConvs.map(conv => (
                    <div key={conv.id} onClick={() => setActiveConv(conv)}
                      style={{ display: 'flex', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: conv.type === 'group' ? '#EDE9FE' : C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: conv.type === 'group' ? '#7C3AED' : C.primary, flexShrink: 0, position: 'relative' }}>
                        {conv.type === 'group' ? <Users size={13} /> : (conv.name || '?')[0]}
                        {conv.type === 'direct' && conv.other_user && (
                          <span style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: getStatusColor(conv.other_user.id), border: '2px solid #fff' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{conv.name}</span>
                          <span style={{ fontSize: 9, color: C.muted }}>{conv.last_message ? formatTime(conv.last_message.created_at) : ''}</span>
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conv.last_message ? (conv.last_message.is_deleted ? 'Deleted' : conv.last_message.message || (conv.last_message.message_type === 'image' ? 'Photo' : 'File')) : 'No messages'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredConvs.length === 0 && !userSearch && (
                    <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 11 }}>No conversations</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          width: 54, height: 54, borderRadius: '50%',
          background: C.primary, color: '#fff', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(108,62,244,0.4)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <MessageSquare size={22} />
      </button>
    </>
  )
}
