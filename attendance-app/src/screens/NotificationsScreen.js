import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/employee/notifications')
      setNotifs(r.data.notifications || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  const markRead = async (id) => {
    try {
      await api.put(`/api/employee/notifications/${id}/read`)
      load()
    } catch (_) {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/api/employee/notifications/read-all')
      load()
    } catch (_) {}
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.headerRow}>
        <Text style={s.sectionTitle}>Notifications {unread > 0 && <Text style={s.unreadBadge}>({unread})</Text>}</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifs.length === 0 ? (
        <Text style={s.empty}>No notifications</Text>
      ) : notifs.map(n => (
        <TouchableOpacity key={n.id} style={[s.card, !n.is_read && s.cardUnread]} onPress={() => markRead(n.id)}>
          <View style={s.notifRow}>
            {!n.is_read && <View style={s.dot} />}
            <View style={{flex: 1}}>
              <Text style={s.notifTitle}>{n.title}</Text>
              <Text style={s.notifMsg} numberOfLines={2}>{n.message}</Text>
              <Text style={s.notifTime}>{new Date(n.created_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}</Text>
            </View>
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
  headerRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: C.text},
  unreadBadge: {color: C.danger, fontSize: 14},
  markAllBtn: {color: C.primary, fontWeight: '600', fontSize: 13},
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 14},
  card: {backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 8, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  cardUnread: {borderLeftWidth: 3, borderLeftColor: C.primary},
  notifRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, marginTop: 6},
  notifTitle: {fontSize: 14, fontWeight: '700', color: C.text},
  notifMsg: {fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 17},
  notifTime: {fontSize: 10, color: C.textLight, marginTop: 4},
})
