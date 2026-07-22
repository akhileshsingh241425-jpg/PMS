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

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('pms_token')
    const s = io(import.meta.env.VITE_API_URL || '', {
      path: '/api/socket.io',
      query: { token },
      transports: ['websocket', 'polling'],
    })
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('user_status', (data) => {
      setOnlineUsers(prev => ({ ...prev, [data.user_id]: { status: data.status, last_seen: data.last_seen, full_name: data.full_name } }))
    })
    s.on('new_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
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
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', data)
    }
  }, [])

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
