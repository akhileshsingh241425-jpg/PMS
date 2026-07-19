import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function PMDashboardScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/pm/dashboard')
        setData(r.data)
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.section}>Projects</Text>
        <View style={s.grid}>
          <StatBox label="Total" value={data?.project_counts?.total || 0} />
          <StatBox label="Active" value={data?.project_counts?.active || 0} color={C.success} />
          <StatBox label="Completed" value={data?.project_counts?.completed || 0} color={C.primary} />
          <StatBox label="Delayed" value={data?.project_counts?.delayed || 0} color={C.danger} />
        </View>
      </View>
      <View style={s.card}>
        <Text style={s.section}>Team Tasks</Text>
        <View style={s.grid}>
          <StatBox label="Total" value={data?.task_counts?.total || 0} />
          <StatBox label="In Progress" value={data?.task_counts?.in_progress || 0} color={C.warning} />
          <StatBox label="Completed" value={data?.task_counts?.completed || 0} color={C.success} />
          <StatBox label="Overdue" value={data?.task_counts?.overdue || 0} color={C.danger} />
        </View>
      </View>
      {data?.upcoming_meetings?.length > 0 && (
        <View style={s.card}>
          <Text style={s.section}>Upcoming Meetings</Text>
          {data.upcoming_meetings.slice(0, 5).map((m, i) => (
            <View key={i} style={s.meetingRow}>
              <Text style={s.meetingTitle}>{m.title}</Text>
              <Text style={s.meetingDate}>{m.meeting_date ? new Date(m.meeting_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) : '—'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

function StatBox({label, value, color}) {
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
  card: {backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 12, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  section: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  meetingRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.bg},
  meetingTitle: {fontSize: 13, fontWeight: '600', color: C.text, flex: 1},
  meetingDate: {fontSize: 11, color: C.muted},
})
