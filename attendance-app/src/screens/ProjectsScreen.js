import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

const STAGE_COLORS = {
  planning: C.warning, in_progress: C.primary, review: '#8B5CF6',
  completed: C.success, on_hold: C.muted,
}

export default function ProjectsScreen({navigation}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/employee/projects')
      setProjects(r.data.projects || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {projects.length === 0 ? (
        <Text style={s.empty}>No projects assigned</Text>
      ) : projects.map(p => (
        <TouchableOpacity key={p.id} style={s.card} onPress={() => navigation.navigate('ProjectDetail', {projectId: p.id})}>
          <View style={s.cardHeader}>
            <Text style={s.title} numberOfLines={1}>{p.title}</Text>
            <View style={[s.stageBadge, {backgroundColor: STAGE_COLORS[p.stage] || C.muted}]}>
              <Text style={s.stageText}>{p.stage?.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          {p.description ? <Text style={s.desc} numberOfLines={2}>{p.description}</Text> : null}
          <View style={s.metaRow}>
            <Text style={s.meta}>{p.account_name || '—'}</Text>
            <Text style={s.meta}>Due: {p.target_date ? p.target_date.split('T')[0] : '—'}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 14},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8},
  stageBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8},
  stageText: {fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 0.5},
  desc: {fontSize: 12, color: C.muted, marginTop: 6},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
  meta: {fontSize: 11, color: C.textLight},
})
