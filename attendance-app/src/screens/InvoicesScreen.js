import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

const STATUS_COLORS = {Draft: C.muted, Sent: C.primary, Paid: C.success, Overdue: C.danger, Cancelled: C.textLight}

export default function InvoicesScreen({route}) {
  const {projectId} = route.params || {}
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      if (!projectId) { setLoading(false); return }
      const r = await api.get(`/api/projects/${projectId}/invoices`)
      setInvoices(r.data.invoices || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [projectId])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {invoices.length === 0 ? (
        <Text style={s.empty}>No invoices</Text>
      ) : invoices.map(inv => (
        <View key={inv.id} style={s.card}>
          <View style={s.header}>
            <Text style={s.invNo}>{inv.invoice_no || `#${inv.id}`}</Text>
            <View style={[s.badge, {backgroundColor: STATUS_COLORS[inv.status] || C.muted}]}>
              <Text style={s.badgeText}>{inv.status}</Text>
            </View>
          </View>
          {inv.amount && <Text style={s.amount}>₹{Number(inv.amount).toLocaleString()}</Text>}
          {inv.tax > 0 && <Text style={s.tax}>+ Tax: ₹{Number(inv.tax).toLocaleString()}</Text>}
          <View style={s.divider} />
          <View style={s.metaRow}>
            <Text style={s.meta}>Issued: {inv.issued_date?.split('T')[0] || '—'}</Text>
            <Text style={s.meta}>Due: {inv.due_date?.split('T')[0] || '—'}</Text>
          </View>
          {inv.paid_date && <Text style={s.paid}>Paid: {inv.paid_date?.split('T')[0]}</Text>}
          {inv.notes && <Text style={s.notes}>{inv.notes}</Text>}
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  empty: {textAlign: 'center', color: C.muted, padding: 40},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6},
  invNo: {fontSize: 14, fontWeight: '700', color: C.text},
  badge: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  badgeText: {fontSize: 10, color: '#fff', fontWeight: '700'},
  amount: {fontSize: 22, fontWeight: '800', color: C.text},
  tax: {fontSize: 12, color: C.muted, marginTop: 2},
  divider: {height: 1, backgroundColor: C.border, marginVertical: 8},
  metaRow: {flexDirection: 'row', justifyContent: 'space-between'},
  meta: {fontSize: 11, color: C.textLight},
  paid: {fontSize: 11, color: C.success, fontWeight: '600', marginTop: 4},
  notes: {fontSize: 12, color: C.muted, marginTop: 6},
})
