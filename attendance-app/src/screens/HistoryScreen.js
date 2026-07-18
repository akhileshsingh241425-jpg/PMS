import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function HistoryScreen() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/attendance/history?per_page=60')
      .then(r => setRecords(r.data.attendance))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Attendance History</Text>
      {records.length === 0 ? (
        <Text style={s.empty}>No records found</Text>
      ) : (
        records.map(r => (
          <View key={r.id} style={s.row}>
            <View style={s.dateBox}>
              <Text style={s.dateDay}>{new Date(r.date).getDate()}</Text>
              <Text style={s.dateMonth}>{new Date(r.date).toLocaleString('default', {month: 'short'})}</Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={s.rowTitle}>
                {r.clock_in ? new Date(r.clock_in).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '—'}
                {' — '}
                {r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'Active'}
              </Text>
              <Text style={s.rowMeta}>
                {r.duration ? `${Math.floor(r.duration)}h ${Math.round((r.duration - Math.floor(r.duration)) * 60)}m` : '—'}
                {r.project_name ? ` · ${r.project_name}` : ''}
              </Text>
            </View>
            <View style={[s.badge, {backgroundColor: r.clock_out ? C.successLight : C.warningLight}]}>
              <Text style={[s.badgeText, {color: r.clock_out ? C.success : C.warning}]}>
                {r.clock_out ? 'Done' : 'Live'}
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
  title: {fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 13},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1},
  dateBox: {width: 44, alignItems: 'center'},
  dateDay: {fontSize: 18, fontWeight: '800', color: C.text},
  dateMonth: {fontSize: 10, color: C.muted, textTransform: 'uppercase'},
  rowTitle: {fontSize: 14, fontWeight: '600', color: C.text},
  rowMeta: {fontSize: 12, color: C.muted, marginTop: 2},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeText: {fontSize: 11, fontWeight: '700'},
})
