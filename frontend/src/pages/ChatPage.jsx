import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Search, MessageSquare, Users, Plus, Send, Paperclip, X, ChevronLeft, Trash2, Reply, MoreHorizontal, Check, CheckCheck } from 'lucide-react'

const C = {
  bg: '#F8FAFC', card: '#fff', border: '#E5E7EB',
  primary: '#6c3ef4', primaryLight: '#F5F3FF',
  text: '#0F172A', muted: '#94A3B8', secondary: '#64748B',
  success: '#10B981', font: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const { user } = useAuth()
  const {
    connected, onlineUsers, conversations, setConversations,
    activeConv, setActiveConv, messages, setMessages,
    typingUsers, loading, loadConversations, loadMessages,
    sendMessage, startTyping, stopTyping, markRead,
    joinConversation, leaveConversation, deleteMessage,
  } = useChat()
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [allUsers, setAllUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { api.get('/api/chat/users').then(r => setAllUsers(r.data.users || [])).catch(() => {}) }, [])

  useEffect(() => {
    if (activeConv) {
      joinConversation(activeConv.id)
      loadMessages(activeConv.id).then(msgs => setMessages(msgs))
      markRead(activeConv.id)
      setShowSidebar(false)
      setHasMore(true)
      return () => leaveConversation(activeConv.id)
    }
  }, [activeConv?.id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text && !replyTo) return
    if (activeConv) {
      sendMessage({ conversation_id: activeConv.id, message: text, reply_to: replyTo?.id })
      setInputText('')
      setReplyTo(null)
    }
  }, [inputText, activeConv, replyTo, sendMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInputChange = (e) => {
    setInputText(e.target.value)
    if (activeConv) {
      startTyping(activeConv.id)
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => stopTyping(activeConv.id), 2000)
    }
  }

  const handleScroll = useCallback(async () => {
    const el = messagesContainerRef.current
    if (!el || el.scrollTop > 50 || !hasMore || messages.length === 0) return
    const oldest = messages[0]
    const older = await loadMessages(activeConv.id, oldest.id)
    if (older.length === 0) { setHasMore(false); return }
    setMessages(prev => [...older, ...prev])
  }, [messages, activeConv, hasMore, loadMessages])

  const startConversation = async (recipient) => {
    try {
      const r = await api.post('/api/chat/conversations', { type: 'direct', participant_ids: [recipient.id] })
      const conv = r.data.conversation
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id)
        return exists ? prev : [conv, ...prev]
      })
      setActiveConv(conv)
      setShowNewChat(false)
      setUserSearch('')
    } catch (e) { console.error(e) }
  }

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) return
    try {
      const r = await api.post('/api/chat/conversations', { type: 'group', name: groupName, participant_ids: selectedMembers.map(u => u.id) })
      setConversations(prev => [r.data.conversation, ...prev])
      setActiveConv(r.data.conversation)
      setShowGroupModal(false)
      setGroupName('')
      setSelectedMembers([])
    } catch (e) { console.error(e) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await api.post('/api/upload', fd)
      if (activeConv) sendMessage({ conversation_id: activeConv.id, message: '', message_type: file.type.startsWith('image/') ? 'image' : 'file', file_url: r.data.url, file_name: file.name, file_size: file.size })
    } catch (e) { console.error(e) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeleteMsg = async (msg) => {
    if (window.confirm('Delete this message?')) {
      deleteMessage(msg.id, 'everyone')
      try { await api.delete(`/api/chat/messages/${msg.id}`) } catch (e) {}
    }
    setContextMenu(null)
  }

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase()
    return (u.full_name || '').toLowerCase().includes(q) || (u.designation || '').toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q)
  })

  const filteredConvs = conversations.filter(c => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    return (c.name || '').toLowerCase().includes(q)
  })

  const getStatusColor = (userId) => {
    const st = onlineUsers[userId]
    if (!st || st.status === 'offline') return '#9CA3AF'
    return st.status === 'online' ? '#22C55E' : '#F59E0B'
  }

  const getStatusText = (userId) => {
    const st = onlineUsers[userId]
    if (!st || st.status === 'offline') return 'Offline'
    return st.status === 'online' ? 'Online' : 'Away'
  }

  const renderStatusIcons = (msg) => {
    if (msg.is_deleted) return null
    if (msg.sender_id !== user.id) return null
    const myStatus = msg.statuses?.[user.id]
    if (!myStatus) return <Check size={12} className="text-slate-400" />
    if (myStatus === 'read') return <CheckCheck size={12} className="text-blue-500" />
    if (myStatus === 'delivered') return <CheckCheck size={12} className="text-slate-400" />
    return <Check size={12} className="text-slate-400" />
  }

  return (
    <div style={{ height: '100vh', display: 'flex', background: C.bg, fontFamily: C.font, overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: showSidebar ? 340 : 0, minWidth: showSidebar ? 340 : 0,
        borderRight: `1px solid ${C.border}`, background: C.card,
        display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden',
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color={C.primary} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Chat</span>
            {connected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setShowNewChat(!showNewChat)} title="New Chat"
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: C.primaryLight, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} />
            </button>
            <button onClick={() => setShowGroupModal(true)} title="New Group"
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: C.primaryLight, color: C.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 8, padding: '6px 10px' }}>
            <Search size={14} color="#94A3B8" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations..."
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, width: '100%', fontFamily: C.font }} />
            {searchQuery && <X size={14} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />}
          </div>
        </div>

        {/* New Chat / User List */}
        {showNewChat && (
          <div style={{ borderBottom: `1px solid ${C.border}`, padding: '8px 12px', maxHeight: 240, overflowY: 'auto' }}>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search employees..."
              autoFocus
              style={{ width: '100%', padding: '6px 10px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} />
            <div style={{ marginTop: 6 }}>
              {filteredUsers.slice(0, 30).map(u => (
                <div key={u.id} onClick={() => startConversation(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
                    {(u.full_name || '?')[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: C.text }}>{u.full_name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{u.designation || u.department || u.role}</div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: 10, fontSize: 11, color: C.muted }}>No users found</div>}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: C.muted, fontSize: 12 }}>Loading...</div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 12 }}>
              <MessageSquare size={24} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div>No conversations yet</div>
              <div style={{ fontSize: 10, marginTop: 4 }}>Click + to start a chat</div>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <div key={conv.id} onClick={() => setActiveConv(conv)}
                style={{
                  display: 'flex', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  background: activeConv?.id === conv.id ? C.primaryLight : 'transparent',
                  borderBottom: `1px solid #F1F5F9`,
                }}
                onMouseEnter={e => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = '#FAFBFC' }}
                onMouseLeave={e => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: conv.type === 'group' ? '#EDE9FE' : C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: conv.type === 'group' ? '#7C3AED' : C.primary, flexShrink: 0, position: 'relative' }}>
                  {conv.type === 'group' ? <Users size={16} /> : (conv.name || '?')[0]}
                  {conv.type === 'direct' && conv.other_user && (
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: getStatusColor(conv.other_user.id), border: '2px solid #fff' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{conv.name}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{conv.last_message ? formatTime(conv.last_message.created_at) : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {conv.last_message ? (conv.last_message.is_deleted ? 'Message deleted' : conv.last_message.message || (conv.last_message.message_type === 'image' ? '📷 Photo' : '📎 File')) : 'No messages yet'}
                    </span>
                    {conv.unread_count > 0 && (
                      <span style={{ background: C.primary, color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center' }}>{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!activeConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: C.muted }}>
            <MessageSquare size={48} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Company Chat</div>
            <div style={{ fontSize: 12 }}>Select a conversation or start a new one</div>
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} style={{ padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.card, cursor: 'pointer', fontSize: 12, color: C.primary, fontWeight: 600 }}>Show Sidebar</button>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.card, display: 'flex', alignItems: 'center', gap: 10 }}>
              {!showSidebar && (
                <button onClick={() => setShowSidebar(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: C.secondary }}>
                  <ChevronLeft size={18} />
                </button>
              )}
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: activeConv.type === 'group' ? '#EDE9FE' : C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: activeConv.type === 'group' ? '#7C3AED' : C.primary, flexShrink: 0 }}>
                {activeConv.type === 'group' ? <Users size={15} /> : (activeConv.name || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{activeConv.name}</div>
                <div style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {activeConv.type === 'direct' && activeConv.other_user && (
                    <><span style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(activeConv.other_user.id) }} /> {getStatusText(activeConv.other_user.id)}</>
                  )}
                  {activeConv.type === 'group' && `${activeConv.participants?.length || 0} members`}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {messages.map(msg => {
                const isMe = msg.sender_id === user.id
                const showAvatar = !isMe
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}
                    onContextMenu={e => { e.preventDefault(); if (isMe && !msg.is_deleted) setContextMenu({ x: e.clientX, y: e.clientY, msg }) }}>
                    <div style={{ maxWidth: '75%', minWidth: 60 }}>
                      {!isMe && (
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, marginLeft: 4, fontWeight: 600 }}>{msg.sender_name}</div>
                      )}
                      {/* Reply preview */}
                      {msg.reply_message && (
                        <div style={{ padding: '4px 8px', borderLeft: `2px solid ${C.primary}`, marginBottom: 4, fontSize: 10, background: '#F1F5F9', borderRadius: '4px 4px 0 0', color: C.secondary }}>
                          {msg.reply_message.sender_name}: {msg.reply_message.message?.slice(0, 60) || 'Media'}
                        </div>
                      )}
                      <div style={{
                        padding: '7px 12px', borderRadius: 14,
                        background: isMe ? C.primary : C.card,
                        color: isMe ? '#fff' : C.text,
                        border: isMe ? 'none' : `1px solid ${C.border}`,
                        fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word',
                        borderBottomRightRadius: isMe ? 4 : 14,
                        borderBottomLeftRadius: isMe ? 14 : 4,
                      }}>
                        {msg.is_deleted ? (
                          <span style={{ fontStyle: 'italic', color: C.muted, fontSize: 11 }}>Message deleted</span>
                        ) : msg.message_type === 'image' ? (
                          <img src={msg.file_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                        ) : msg.message_type === 'file' ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ color: isMe ? '#fff' : C.primary, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Paperclip size={12} /> {msg.file_name || 'File'}
                          </a>
                        ) : msg.message}
                      </div>
                      {/* Time + Status */}
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3, justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                        {formatTime(msg.created_at)}
                        {renderStatusIcons(msg)}
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Typing indicator */}
              {Object.values(typingUsers).filter(t => t.conversation_id === activeConv?.id && t.typing).slice(0, 1).map(t => (
                <div key={t.user_id} style={{ fontSize: 11, color: C.muted, padding: '4px 8px', fontStyle: 'italic' }}>{t.full_name} is typing...</div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div style={{ padding: '6px 14px', background: '#F1F5F9', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <Reply size={12} color={C.primary} />
                <span style={{ flex: 1, color: C.secondary }}>Replying to <strong>{replyTo.sender_name}</strong>: {replyTo.message?.slice(0, 50)}</span>
                <X size={14} color={C.muted} style={{ cursor: 'pointer' }} onClick={() => setReplyTo(null)} />
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}`, background: C.card }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button onClick={() => fileInputRef.current?.click()} title="Attach file"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px 4px', color: C.secondary }}>
                  <Paperclip size={18} />
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                <textarea value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{ flex: 1, padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: C.font, resize: 'none', maxHeight: 100, lineHeight: 1.4 }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }} />
                <button onClick={handleSend} disabled={!inputText.trim() && !replyTo}
                  style={{ border: 'none', background: C.primary, color: '#fff', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', opacity: !inputText.trim() && !replyTo ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} />
          <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden' }}>
            <div onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null) }}
              style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: C.text }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Reply size={13} /> Reply
            </div>
            {contextMenu.msg.sender_id === user.id && !contextMenu.msg.is_deleted && (
              <div onClick={() => handleDeleteMsg(contextMenu.msg)}
                style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Trash2 size={13} /> Delete
              </div>
            )}
          </div>
        </>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowGroupModal(false)}>
          <div style={{ background: C.card, borderRadius: 16, width: 420, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>New Group</span>
              <button onClick={() => setShowGroupModal(false)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F1F5F9', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name *"
                style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} />
            </div>
            <div style={{ padding: '8px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, color: C.secondary }}>Add Members ({selectedMembers.length})</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px' }}>
              {allUsers.filter(u => u.id !== user.id).map(u => {
                const selected = selectedMembers.some(m => m.id === u.id)
                return (
                  <div key={u.id} onClick={() => setSelectedMembers(prev => selected ? prev.filter(m => m.id !== u.id) : [...prev, u])}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${selected ? C.primary : C.border}`, background: selected ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selected && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.primary, flexShrink: 0 }}>{(u.full_name || '?')[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: C.text }}>{u.full_name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{u.designation || u.department || u.role}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={createGroup} disabled={!groupName.trim() || selectedMembers.length < 2}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: groupName.trim() && selectedMembers.length >= 2 ? 1 : 0.5 }}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
