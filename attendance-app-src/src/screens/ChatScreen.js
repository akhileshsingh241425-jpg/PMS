import {useState, useEffect, useRef, useCallback} from 'react'
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function ChatScreen() {
  const [projects, setProjects] = useState([])
  const [selectedPid, setSelectedPid] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  const loadProjects = useCallback(async () => {
    try {
      const r = await api.get('/api/chat/recent-projects')
      setProjects(r.data.projects || [])
      if (r.data.projects?.length) setSelectedPid(r.data.projects[0].id)
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {loadProjects()}, [loadProjects])

  const loadMessages = useCallback(async () => {
    if (!selectedPid) return
    setLoading(true)
    try {
      const r = await api.get('/api/chat/messages', {params: {project_id: selectedPid, limit: 50}})
      setMessages(r.data.messages || [])
    } catch (_) {}
    setLoading(false)
  }, [selectedPid])

  useEffect(() => {loadMessages()}, [loadMessages])

  const send = async () => {
    if (!input.trim() || !selectedPid) return
    setSending(true)
    try {
      const r = await api.post('/api/chat/messages', {project_id: selectedPid, message: input})
      setMessages(prev => [...prev, r.data.message])
      setInput('')
      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100)
    } catch (_) {}
    setSending(false)
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Project selector */}
      {projects.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.projectRow}>
          {projects.map(p => (
            <TouchableOpacity key={p.id} style={[s.pill, selectedPid === p.id && s.pillActive]} onPress={() => setSelectedPid(p.id)}>
              <Text style={[s.pillText, selectedPid === p.id && s.pillTextActive]}>{p.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView ref={scrollRef} style={s.msgContainer} contentContainerStyle={s.msgContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: false})}>
        {loading ? <ActivityIndicator color={C.primary} /> : messages.map(m => (
          <View key={m.id} style={s.msgBubble}>
            <View style={s.msgHeader}>
              <Text style={s.msgSender}>{m.sender_name}</Text>
              <Text style={s.msgTime}>{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text>
            </View>
            <Text style={s.msgText}>{m.message}</Text>
          </View>
        ))}
        {!loading && messages.length === 0 && <Text style={s.empty}>No messages yet. Start the conversation!</Text>}
      </ScrollView>

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput style={s.input} value={input} onChangeText={setInput} placeholder="Type a message..." placeholderTextColor={C.textLight} multiline />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending || !input.trim()}>
          <Text style={s.sendText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  projectRow: {padding: 10, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border},
  pill: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: C.bg, marginRight: 6},
  pillActive: {backgroundColor: C.primary},
  pillText: {fontSize: 12, fontWeight: '600', color: C.muted},
  pillTextActive: {color: '#fff'},
  msgContainer: {flex: 1},
  msgContent: {padding: 12, paddingBottom: 20},
  msgBubble: {backgroundColor: C.card, borderRadius: 10, padding: 10, marginBottom: 8, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1},
  msgHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  msgSender: {fontSize: 11, fontWeight: '700', color: C.primary},
  msgTime: {fontSize: 9, color: C.textLight},
  msgText: {fontSize: 13, color: C.text, lineHeight: 18},
  empty: {textAlign: 'center', color: C.muted, padding: 40},
  inputRow: {flexDirection: 'row', padding: 10, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, gap: 8, alignItems: 'flex-end'},
  input: {flex: 1, backgroundColor: C.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80, color: C.text},
  sendBtn: {backgroundColor: C.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, justifyContent: 'center'},
  sendText: {color: '#fff', fontWeight: '700', fontSize: 14},
})
