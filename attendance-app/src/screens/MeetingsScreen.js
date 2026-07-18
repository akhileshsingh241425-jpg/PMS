import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Linking} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

const STATUS_COLORS = {
  scheduled: C.primary, completed: C.success,
  cancelled: C.danger, in_progress: C.warning,
}

export default function MeetingsScreen() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/employee/meetings')
      setMeetings(r.data.meetings || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Upcoming */}
      <Text style={s.sectionTitle}>Upcoming</Text>
      {meetings.filter(m => m.status === 'scheduled').length === 0 ? (
        <Text style={s.empty}>No upcoming meetings</Text>
      ) : meetings.filter(m => m.status === 'scheduled').map(m => (
        <MeetingCard key={m.id} meeting={m} />
      ))}

      {/* Past */}
      <Text style={[s.sectionTitle, {marginTop: 20}]}>Past Meetings</Text>
      {meetings.filter(m => m.status !== 'scheduled').length === 0 ? (
        <Text style={s.empty}>No past meetings</Text>
      ) : meetings.filter(m => m.status !== 'scheduled').map(m => (
        <MeetingCard key={m.id} meeting={m} />
      ))}
    </ScrollView>
  )
}

function MeetingCard({meeting}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.title} numberOfLines={1}>{meeting.title}</Text>
        <View style={[s.badge, {backgroundColor: STATUS_COLORS[meeting.status] || C.muted}]}>
          <Text style={s.badgeText}>{meeting.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={s.detail}>📅 {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString('en-IN', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '—'}</Text>
      {meeting.project_name ? <Text style={s.detail}>📁 {meeting.project_name}</Text> : null}
      {meeting.description ? <Text style={s.detail} numberOfLines={2}>{meeting.description}</Text> : null}
      {meeting.location ? <Text style={s.detail}>📍 {meeting.location}</Text> : null}
      {meeting.meeting_link ? (
        <TouchableOpacity style={s.linkBtn} onPress={() => Linking.openURL(meeting.meeting_link)}>
          <Text style={s.linkText}>🔗 Join Meeting</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10},
  empty: {textAlign: 'center', color: C.muted, padding: 20, fontSize: 13},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  title: {fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  badgeText: {fontSize: 9, color: '#fff', fontWeight: '700'},
  detail: {fontSize: 12, color: C.muted, marginBottom: 3},
  linkBtn: {marginTop: 6},
  linkText: {fontSize: 13, color: C.primary, fontWeight: '600'},
})
