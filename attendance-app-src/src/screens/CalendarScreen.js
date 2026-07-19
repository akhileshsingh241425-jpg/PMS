import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function CalendarScreen() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/api/employee/calendar')
        setEvents(r.data.events || [])
      } catch (_) {}
      setLoading(false)
    })()
  }, [])

  // Group events by date
  const grouped = {}
  events.forEach(e => {
    const d = e.date ? e.date.split('T')[0] : 'No date'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {Object.keys(grouped).length === 0 ? (
        <Text style={s.empty}>No upcoming events</Text>
      ) : Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
        <View key={date} style={s.dayGroup}>
          <Text style={s.dateHeader}>{date === 'No date' ? 'Unscheduled' : new Date(date).toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</Text>
          {items.map(e => (
            <View key={`${e.type}_${e.id}`} style={s.eventCard}>
              <Text style={s.eventIcon}>{e.type === 'meeting' ? '📅' : '✅'}</Text>
              <View style={{flex: 1}}>
                <Text style={s.eventTitle}>{e.title}</Text>
                <Text style={s.eventType}>{e.type} {e.status ? `· ${e.status}` : ''}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 14},
  dayGroup: {marginBottom: 16},
  dateHeader: {fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 8, paddingLeft: 4},
  eventCard: {flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 10, padding: 12, marginBottom: 6, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  eventIcon: {fontSize: 18},
  eventTitle: {fontSize: 14, fontWeight: '600', color: C.text},
  eventType: {fontSize: 11, color: C.muted, marginTop: 1},
})
