import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

const STATUS_COLORS = {pending: C.warning, in_progress: C.primary, completed: C.success}

export default function TaskDetailScreen({route}) {
  const {taskId} = route.params
  const [task, setTask] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [newItemText, setNewItemText] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {load()}, [])

  const load = async () => {
    try {
      const r = await api.get(`/api/employee/tasks/${taskId}`)
      setTask(r.data.task)
      setChecklist(r.data.checklist || [])
      setComments(r.data.comments || [])
    } catch (_) {}
    setLoading(false)
  }

  const toggleChecklist = async (item) => {
    try {
      await api.put(`/api/employee/checklist/${item.id}`, {is_completed: !item.is_completed})
      load()
    } catch (_) {Alert.alert('Error', 'Failed to update')}
  }

  const addChecklist = async () => {
    if (!newItemText.trim()) return
    try {
      await api.post(`/api/employee/tasks/${taskId}/checklist`, {text: newItemText})
      setNewItemText('')
      setShowAddItem(false)
      load()
    } catch (_) {}
  }

  const addComment = async () => {
    if (!commentText.trim()) return
    try {
      await api.post(`/api/employee/tasks/${taskId}/comments`, {text: commentText})
      setCommentText('')
      load()
    } catch (_) {Alert.alert('Error', 'Failed to add comment')}
  }

  const updateStatus = async () => {
    const statuses = ['Open', 'In Progress', 'Completed']
    const idx = statuses.indexOf(task.status)
    const next = statuses[(idx + 1) % statuses.length]
    try {
      await api.put(`/api/employee/tasks/${taskId}/status`, {status: next})
      load()
    } catch (_) {}
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  if (!task) return <View style={s.center}><Text>Task not found</Text></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.card}>
        <View style={s.statusRow}>
          <TouchableOpacity style={[s.statusBtn, {backgroundColor: STATUS_COLORS[task.status] || C.muted}]} onPress={updateStatus}>
            <Text style={s.statusBtnText}>{task.status.toUpperCase()} →</Text>
          </TouchableOpacity>
          <View style={[s.badge, {backgroundColor: task.priority === 'High' || task.priority === 'Urgent' ? C.danger : task.priority === 'Normal' ? C.warning : C.success}]}>
            <Text style={s.badgeText}>{task.priority}</Text>
          </View>
        </View>
        <Text style={s.title}>{task.title}</Text>
        {task.description ? <Text style={s.desc}>{task.description}</Text> : null}
        <View style={s.metaRow}>
          <Text style={s.meta}>Project: {task.project_name || '—'}</Text>
          <Text style={s.meta}>Due: {task.due_date ? task.due_date.split('T')[0] : '—'}</Text>
        </View>
      </View>

      {/* Checklist */}
      <Text style={s.sectionTitle}>Checklist <Text style={s.sectionSub}>({checklist.filter(c => c.is_completed).length}/{checklist.length})</Text></Text>
      {showAddItem ? (
        <View style={s.addItemRow}>
          <TextInput style={s.addItemInput} value={newItemText} onChangeText={setNewItemText} placeholder="New item..." placeholderTextColor={C.textLight} autoFocus />
          <TouchableOpacity style={s.addItemBtn} onPress={addChecklist}><Text style={s.addItemBtnText}>Add</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => {setShowAddItem(false); setNewItemText('')}}><Text style={s.cancelBtn}>Cancel</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddItem(true)}>
          <Text style={s.addBtnText}>+ Add item</Text>
        </TouchableOpacity>
      )}
      {checklist.map(c => (
        <TouchableOpacity key={c.id} style={s.checkRow} onPress={() => toggleChecklist(c)}>
          <View style={[s.checkbox, c.is_completed && s.checkboxDone]}>
            {c.is_completed ? <Text style={s.checkmark}>✓</Text> : null}
          </View>
          <Text style={[s.checkText, c.is_completed && s.checkTextDone]}>{c.text}</Text>
        </TouchableOpacity>
      ))}

      {/* Comments */}
      <Text style={s.sectionTitle}>Comments</Text>
      <View style={s.commentInputRow}>
        <TextInput style={s.commentInput} value={commentText} onChangeText={setCommentText} placeholder="Write a comment..." placeholderTextColor={C.textLight} multiline />
        <TouchableOpacity style={s.sendBtn} onPress={addComment}><Text style={s.sendBtnText}>Send</Text></TouchableOpacity>
      </View>
      {comments.map(c => (
        <View key={c.id} style={s.commentCard}>
          <View style={s.commentHeader}>
            <Text style={s.commentUser}>{c.author_name || 'User'}</Text>
            <Text style={s.commentTime}>{new Date(c.created_at).toLocaleDateString()}</Text>
          </View>
          <Text style={s.commentText}>{c.text}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 16, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12},
  statusBtn: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8},
  statusBtnText: {color: '#fff', fontWeight: '700', fontSize: 12},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  badgeText: {fontSize: 10, color: '#fff', fontWeight: '700'},
  title: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6},
  desc: {fontSize: 13, color: C.muted, lineHeight: 20},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 12},
  meta: {fontSize: 12, color: C.textLight},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 6},
  sectionSub: {fontSize: 12, color: C.muted, fontWeight: '400'},
  addBtn: {marginBottom: 8},
  addBtnText: {color: C.primary, fontWeight: '600', fontSize: 13},
  addItemRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8},
  addItemInput: {flex: 1, backgroundColor: C.card, borderRadius: 8, padding: 8, fontSize: 13, borderWidth: 1, borderColor: C.border, color: C.text},
  addItemBtn: {backgroundColor: C.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8},
  addItemBtnText: {color: '#fff', fontWeight: '700', fontSize: 12},
  cancelBtn: {fontSize: 12, color: C.muted, fontWeight: '600'},
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 8, padding: 12, marginBottom: 6},
  checkbox: {width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center'},
  checkboxDone: {backgroundColor: C.success, borderColor: C.success},
  checkmark: {color: '#fff', fontSize: 12, fontWeight: '800'},
  checkText: {fontSize: 13, color: C.text, flex: 1},
  checkTextDone: {textDecorationLine: 'line-through', color: C.muted},
  commentInputRow: {flexDirection: 'row', gap: 8, marginBottom: 12},
  commentInput: {flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 10, fontSize: 13, borderWidth: 1, borderColor: C.border, maxHeight: 60, color: C.text},
  sendBtn: {backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center'},
  sendBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},
  commentCard: {backgroundColor: C.card, borderRadius: 8, padding: 12, marginBottom: 8},
  commentHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  commentUser: {fontWeight: '700', fontSize: 12, color: C.text},
  commentTime: {fontSize: 10, color: C.textLight},
  commentText: {fontSize: 13, color: C.text},
})
