import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native'
import {useAuth} from '../contexts/AuthContext'
import {C} from '../theme'

const MENU_ITEMS = [
  {icon: '📅', label: 'History', screen: 'History'},
  {icon: '👤', label: 'Profile', screen: 'Profile'},
  {icon: '📊', label: 'Reports', screen: 'Reports'},
  {icon: '📅', label: 'Meetings', screen: 'Meetings'},
  {icon: '🔔', label: 'Notifications', screen: 'Notifications'},
  {icon: '📄', label: 'Documents', screen: 'Documents'},
  {icon: '📋', label: 'Calendar', screen: 'Calendar'},
  {icon: '📸', label: 'Face Registration', screen: 'FaceRegister'},
  {icon: '📷', label: 'QR Attendance', screen: 'QRScanner'},
  {icon: '🔐', label: 'Biometric', screen: 'Biometric'},
  {icon: '⏱️', label: 'Timesheet', screen: 'Timesheet'},
  {icon: '🧾', label: 'Invoices', screen: 'Invoices'},
  {icon: '📊', label: 'PM Dashboard', screen: 'PMDashboard'},
  {icon: '🏢', label: 'Client Portal', screen: 'ClientPortal'},
]

export default function MoreScreen({navigation}) {
  const {user, logout} = useAuth()

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* User Card */}
      <View style={s.userCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}</Text>
        </View>
        <Text style={s.userName}>{user?.first_name} {user?.last_name}</Text>
        <Text style={s.userRole}>{user?.designation || user?.role || 'Employee'}</Text>
      </View>

      {/* Menu */}
      <View style={s.menuCard}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={item.screen} style={[s.menuRow, i < MENU_ITEMS.length - 1 && s.menuBorder]} onPress={() => navigation.navigate(item.screen)}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  userCard: {backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2},
  avatar: {width: 64, height: 64, borderRadius: 32, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  avatarText: {fontSize: 24, fontWeight: '800', color: C.primary},
  userName: {fontSize: 18, fontWeight: '800', color: C.text},
  userRole: {fontSize: 13, color: C.muted, marginTop: 2},
  menuCard: {backgroundColor: C.card, borderRadius: 12, marginBottom: 16, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  menuRow: {flexDirection: 'row', alignItems: 'center', padding: 16},
  menuBorder: {borderBottomWidth: 1, borderBottomColor: C.bg},
  menuIcon: {fontSize: 18, marginRight: 12},
  menuLabel: {fontSize: 15, fontWeight: '600', color: C.text, flex: 1},
  menuArrow: {fontSize: 20, color: C.textLight, fontWeight: '300'},
  logoutBtn: {backgroundColor: C.dangerLight, borderRadius: 12, padding: 16, alignItems: 'center'},
  logoutText: {fontSize: 15, fontWeight: '700', color: C.danger},
})
