import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'
import ClockButton from '../components/ClockButton'
import StatsCard from '../components/StatsCard'

export default function DashboardScreen() {
  const [today, setToday] = useState(null)
  const [active, setActive] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([
        api.get('/api/attendance/today'),
        api.get('/api/attendance/active'),
      ])
      setToday(t.data.attendance)
      setActive(a.data.active)
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  const now = new Date()
  const durToday = today?.clock_in ? ((Date.now() - new Date(today.clock_in).getTime()) / 3600000) : 0

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Clock Card */}
      <View style={s.clockCard}>
        <Text style={s.statusIcon}>{today && !today.clock_out ? '🟢' : '⏸️'}</Text>
        <Text style={s.statusText}>
          {today && !today.clock_out
            ? `Clocked in since ${new Date(today.clock_in).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
            : today?.clock_out
            ? `Last session: ${Math.round(today.duration || 0)}h`
            : 'Not clocked in today'}
        </Text>
        <ClockButton today={today} onUpdate={load} />
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatsCard label="Today" value={today ? (today.clock_out ? 'Completed' : 'Active') : '—'} color={C.success} />
        <StatsCard label="Duration" value={durToday > 0 ? `${Math.floor(durToday)}h ${Math.round((durToday - Math.floor(durToday)) * 60)}m` : '—'} color={C.primary} />
        <StatsCard label="Online Now" value={`${active.length}`} color={C.warning} />
      </View>

      {/* Active Now */}
      <Text style={s.sectionTitle}>Active Team Members</Text>
      {active.length === 0 ? (
        <Text style={s.empty}>No active sessions</Text>
      ) : (
        active.map(s => (
          <View key={s.id} style={s.activeRow}>
            <View style={s.dot} />
            <View style={{flex: 1}}>
              <Text style={s.activeName}>{s.user_name}</Text>
              <Text style={s.activeMeta}>
                Since {new Date(s.clock_in).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                {s.project_name ? ` · ${s.project_name}` : ''}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg},
  clockCard: {backgroundColor: C.card, borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2},
  statusIcon: {fontSize: 48, marginBottom: 8},
  statusText: {fontSize: 14, color: C.muted, marginBottom: 16, textAlign: 'center'},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 20},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 10},
  empty: {textAlign: 'center', color: C.muted, padding: 20, fontSize: 13},
  activeRow: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.successLight, borderRadius: 10, padding: 12, marginBottom: 8},
  dot: {width: 10, height: 10, borderRadius: 5, backgroundColor: C.success},
  activeName: {fontSize: 14, fontWeight: '600', color: C.text},
  activeMeta: {fontSize: 12, color: C.muted, marginTop: 2},
})
