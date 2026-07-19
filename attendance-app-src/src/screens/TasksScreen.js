import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

const STATUSES = ['all', 'Open', 'Pending', 'In Progress', 'Completed']
const PRIORITY_COLORS = {High: C.danger, Urgent: C.danger, Normal: C.warning, Low: C.success}

export default function TasksScreen({navigation}) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/employee/tasks', {params: filter !== 'all' ? {status: filter} : {}})
      setTasks(r.data.tasks || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [filter])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        {STATUSES.map(st => (
          <TouchableOpacity key={st} style={[s.chip, filter === st && s.chipActive]} onPress={() => setFilter(st)}>
            <Text style={[s.chipText, filter === st && s.chipTextActive]}>{st.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tasks.length === 0 ? (
        <Text style={s.empty}>No tasks found</Text>
      ) : tasks.map(t => (
        <TouchableOpacity key={t.id} style={s.taskCard} onPress={() => navigation.navigate('TaskDetail', {taskId: t.id})}>
          <View style={s.taskHeader}>
            <Text style={s.taskTitle} numberOfLines={1}>{t.title}</Text>
            <View style={[s.badge, {backgroundColor: PRIORITY_COLORS[t.priority] || C.muted}]}>
              <Text style={s.badgeText}>{t.priority}</Text>
            </View>
          </View>
          {t.description ? <Text style={s.taskDesc} numberOfLines={2}>{t.description}</Text> : null}
          <View style={s.taskMeta}>
            <Text style={s.metaText}>{t.project_name || '—'}</Text>
            <Text style={s.metaText}>Due: {t.due_date ? t.due_date.split('T')[0] : '—'}</Text>
          </View>
          <View style={s.progressWrap}>
            <View style={[s.progressBar, {width: `${t.checklist_count > 0 ? (t.checklist_completed / t.checklist_count * 100) : 0}%`}]} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg},
  filterRow: {marginBottom: 14},
  chip: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: C.card, marginRight: 8, borderWidth: 1, borderColor: C.border},
  chipActive: {backgroundColor: C.primary, borderColor: C.primary},
  chipText: {fontSize: 12, fontWeight: '600', color: C.muted},
  chipTextActive: {color: '#fff'},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 14},
  taskCard: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  taskHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  taskTitle: {fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10},
  badgeText: {fontSize: 10, color: '#fff', fontWeight: '700', textTransform: 'uppercase'},
  taskDesc: {fontSize: 12, color: C.muted, marginTop: 6},
  taskMeta: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
  metaText: {fontSize: 11, color: C.textLight},
  progressWrap: {height: 3, backgroundColor: C.bg, borderRadius: 2, marginTop: 10, overflow: 'hidden'},
  progressBar: {height: '100%', backgroundColor: C.primary, borderRadius: 2},
})
