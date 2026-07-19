import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function ReportsScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const perf = await api.get('/api/employee/performance')
        setData({performance: perf.data})
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Performance */}
      {data?.performance && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Performance</Text>
          <View style={s.grid}>
            <StatBox label="Total Tasks" value={data.performance.total_tasks || 0} />
            <StatBox label="Completed" value={data.performance.completed_tasks || 0} color={C.success} />
            <StatBox label="Completion" value={`${data.performance.completion_rate || 0}%`} color={C.primary} />
            <StatBox label="On-Time" value={`${data.performance.on_time_rate || 0}%`} color={C.warning} />
          </View>
        </View>
      )}

      {/* Task Breakdown */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Task Breakdown</Text>
        <View style={s.grid}>
          <StatBox label="Pending" value={data?.performance?.pending_tasks || 0} color={C.warning} />
          <StatBox label="On Time" value={data?.performance?.completed_on_time || 0} color={C.success} />
          <StatBox label="Overdue" value={data?.performance?.pending_overdue || 0} color={C.danger} />
          <StatBox label="Overdue Done" value={data?.performance?.overdue_completed || 0} color={C.primary} />
        </View>
      </View>
    </ScrollView>
  )
}

function StatBox({label, value, color}) {
  return (
    <View style={statBox.s}>
      <Text style={[statBox.v, color ? {color} : null]}>{value}</Text>
      <Text style={statBox.l}>{label}</Text>
    </View>
  )
}

const statBox = StyleSheet.create({
  s: {flex: 1, minWidth: '45%', backgroundColor: C.bg, borderRadius: 10, padding: 14, alignItems: 'center'},
  v: {fontSize: 20, fontWeight: '800', color: C.text},
  l: {fontSize: 11, color: C.muted, marginTop: 2},
})

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 12, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
})
