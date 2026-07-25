import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState({})
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const activeConvIdRef = useRef(null)

  useEffect(() => { activeConvIdRef.current = activeConv?.id || null }, [activeConv])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('pms_token')
    const s = io(import.meta.env.VITE_API_URL || '', {
      path: '/api/socket.io',
      query: { token },
      transports: ['websocket', 'polling'],
    })
    s.on('connect', () => {
      setConnected(true)
      // Reconnects (network blips, idle proxy timeouts) get a new sid server-side,
      // so the room join from before is gone — rejoin or messages stop arriving live.
      if (activeConvIdRef.current) s.emit('join', { conversation_id: activeConvIdRef.current })
    })
    s.on('disconnect', () => setConnected(false))
    s.on('user_status', (data) => {
      setOnlineUsers(prev => ({ ...prev, [data.user_id]: { status: data.status, last_seen: data.last_seen, full_name: data.full_name } }))
    })
    s.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        if (msg.client_id) {
          const idx = prev.findIndex(m => m.id === `local-${msg.client_id}`)
          if (idx !== -1) {
            const next = [...prev]
            next[idx] = msg
            return next
          }
        }
        return [...prev, msg]
      })
      setConversations(prev => prev.map(c => {
        if (c.id === msg.conversation_id) return { ...c, last_message: msg, updated_at: msg.created_at }
        return c
      }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    })
    s.on('typing', (data) => {
      setTypingUsers(prev => {
        if (!data.typing) {
          const next = { ...prev }
          delete next[data.conversation_id + '_' + data.user_id]
          return next
        }
        return { ...prev, [data.conversation_id + '_' + data.user_id]: data }
      })
    })
    s.on('message_deleted', (data) => {
      setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, is_deleted: true, message: null } : m))
    })
    s.on('conversation_update', (data) => {
      setConversations(prev => prev.map(c => {
        if (c.id === data.conversation_id) return { ...c, last_message: data.last_message, updated_at: data.last_message?.created_at }
        return c
      }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    })
    socketRef.current = s
    return () => { s.disconnect() }
  }, [user])

  useEffect(() => {
    if (!user) return
    loadConversations()
  }, [user])

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const r = await api.get('/api/chat/conversations')
      setConversations(r.data.conversations || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  const loadMessages = useCallback(async (convId, before) => {
    try {
      const params = before ? { before } : {}
      const r = await api.get(`/api/chat/conversations/${convId}/messages`, { params })
      return r.data.messages || []
    } catch (e) { return [] }
  }, [])

  const sendMessage = useCallback((data) => {
    const client_id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const optimisticMsg = {
      id: `local-${client_id}`,
      conversation_id: data.conversation_id,
      sender_id: user?.id,
      sender_name: user?.full_name,
      message: data.message || null,
      message_type: data.message_type || 'text',
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      file_size: data.file_size || null,
      reply_to: data.reply_to || null,
      reply_message: null,
      statuses: {},
      created_at: new Date().toISOString(),
      is_deleted: false,
      pending: true,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setConversations(prev => prev.map(c => {
      if (c.id === data.conversation_id) return { ...c, last_message: optimisticMsg, updated_at: optimisticMsg.created_at }
      return c
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    // Socket.IO client buffers emits while briefly disconnected and flushes on reconnect,
    // so no need to gate this on `.connected`.
    socketRef.current?.emit('send_message', { ...data, client_id })
  }, [user])

  const startTyping = useCallback((conversation_id) => {
    socketRef.current?.emit('typing_start', { conversation_id })
  }, [])

  const stopTyping = useCallback((conversation_id) => {
    socketRef.current?.emit('typing_stop', { conversation_id })
  }, [])

  const markRead = useCallback((conversation_id) => {
    socketRef.current?.emit('mark_read', { conversation_id })
    api.post(`/api/chat/conversations/${conversation_id}/read`).catch(() => {})
  }, [])

  const joinConversation = useCallback((conversation_id) => {
    socketRef.current?.emit('join', { conversation_id })
  }, [])

  const leaveConversation = useCallback((conversation_id) => {
    socketRef.current?.emit('leave', { conversation_id })
  }, [])

  const deleteMessage = useCallback((message_id, scope = 'me') => {
    socketRef.current?.emit('delete_message', { message_id, scope })
  }, [])

  const value = {
    connected, onlineUsers, conversations, setConversations,
    activeConv, setActiveConv, messages, setMessages,
    typingUsers, loading, loadConversations, loadMessages,
    sendMessage, startTyping, stopTyping, markRead,
    joinConversation, leaveConversation, deleteMessage,
  }
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
