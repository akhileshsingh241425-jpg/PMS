import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function ClientPortalScreen() {
  const [dashboard, setDashboard] = useState(null)
  const [projects, setProjects] = useState([])
  const [meetings, setMeetings] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [d, p, m] = await Promise.all([
        api.get('/api/portal/dashboard'),
        api.get('/api/portal/projects'),
        api.get('/api/portal/meetings'),
      ])
      setDashboard(d.data)
      setProjects(p.data.projects || [])
      setMeetings(m.data.meetings || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Tabs */}
      <View style={s.tabRow}>
        {['dashboard', 'projects', 'meetings', 'queries'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'dashboard' && dashboard && (
        <>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Overview</Text>
            <View style={s.grid}>
              <StatBoxC label="Projects" value={dashboard.total_projects || 0} />
              <StatBoxC label="Open Queries" value={dashboard.open_queries || 0} color={C.warning} />
              <StatBoxC label="Meetings" value={dashboard.meetings_count || 0} color={C.primary} />
              <StatBoxC label="Documents" value={dashboard.documents_count || 0} color={C.muted} />
            </View>
          </View>
          {dashboard.recent_activities?.map((a, i) => (
            <View key={i} style={s.activityRow}>
              <Text style={s.activityText}>{a.action || a.message}</Text>
              <Text style={s.activityDate}>{a.date?.split('T')[0] || ''}</Text>
            </View>
          ))}
        </>
      )}

      {tab === 'projects' && projects.map(p => (
        <TouchableOpacity key={p.id} style={s.card} onPress={() => Alert.alert(p.title, p.description || 'No description')}>
          <Text style={s.projectTitle}>{p.title}</Text>
          <Text style={s.projectStage}>{p.stage}</Text>
          {p.description && <Text style={s.projectDesc} numberOfLines={2}>{p.description}</Text>}
        </TouchableOpacity>
      ))}

      {tab === 'meetings' && meetings.map(m => (
        <View key={m.id} style={s.card}>
          <Text style={s.projectTitle}>{m.agenda || m.title}</Text>
          <Text style={s.projectStage}>{m.status} · {m.preferred_date?.split('T')[0]}</Text>
        </View>
      ))}

      {tab === 'queries' && (
        <Text style={s.empty}>Queries coming soon — raise queries from the web portal</Text>
      )}
    </ScrollView>
  )
}

function StatBoxC({label, value, color}) {
  return (
    <View style={stat.s}>
      <Text style={[stat.v, color ? {color} : null]}>{value}</Text>
      <Text style={stat.l}>{label}</Text>
    </View>
  )
}

const stat = StyleSheet.create({
  s: {flex: 1, minWidth: '45%', backgroundColor: C.bg, borderRadius: 10, padding: 14, alignItems: 'center'},
  v: {fontSize: 22, fontWeight: '800', color: C.text},
  l: {fontSize: 11, color: C.muted, marginTop: 2},
})

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  tabRow: {flexDirection: 'row', gap: 4, marginBottom: 16},
  tab: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: C.card},
  tabActive: {backgroundColor: C.primary},
  tabText: {fontSize: 12, fontWeight: '600', color: C.muted},
  tabTextActive: {color: '#fff'},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  activityRow: {backgroundColor: C.card, borderRadius: 8, padding: 12, marginBottom: 6},
  activityText: {fontSize: 12, color: C.text},
  activityDate: {fontSize: 10, color: C.textLight, marginTop: 2},
  projectTitle: {fontSize: 15, fontWeight: '700', color: C.text},
  projectStage: {fontSize: 11, color: C.primary, fontWeight: '600', marginTop: 2},
  projectDesc: {fontSize: 12, color: C.muted, marginTop: 6},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 13},
})
