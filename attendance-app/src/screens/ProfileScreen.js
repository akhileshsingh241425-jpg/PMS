import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'
import {useAuth} from '../contexts/AuthContext'
import {C} from '../theme'

export default function ProfileScreen() {
  const {user, logout} = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/employee/performance')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ])
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* User Info */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.first_name?.[0] || '?'}</Text>
        </View>
        <Text style={s.name}>{user?.full_name || 'User'}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.role}>{user?.role?.toUpperCase() || ''}</Text>
      </View>

      {/* Performance Stats */}
      {stats && (
        <View style={s.statsGrid}>
          {[
            {label: 'Completed', value: stats.completed_tasks, color: C.success},
            {label: 'On Time', value: `${stats.on_time_rate || 0}%`, color: C.primary},
            {label: 'Pending', value: stats.pending_tasks, color: C.warning},
            {label: 'Overdue', value: stats.pending_overdue, color: C.danger},
          ].map((st, i) => (
            <View key={i} style={s.statBox}>
              <Text style={[s.statValue, {color: st.color}]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  profileCard: {backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2},
  avatar: {width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  avatarText: {fontSize: 28, fontWeight: '800', color: C.primary},
  name: {fontSize: 20, fontWeight: '700', color: '#1A1A2E'},
  email: {fontSize: 13, color: C.muted, marginTop: 2},
  role: {fontSize: 11, fontWeight: '700', color: C.primary, backgroundColor: C.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8, overflow: 'hidden'},
  statsGrid: {flexDirection: 'row', gap: 8, marginBottom: 20},
  statBox: {flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  statValue: {fontSize: 22, fontWeight: '800'},
  statLabel: {fontSize: 11, color: C.muted, marginTop: 2},
  actions: {marginTop: 8},
  logoutBtn: {backgroundColor: C.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.dangerLight},
  logoutText: {fontSize: 15, fontWeight: '700', color: C.danger},
})
