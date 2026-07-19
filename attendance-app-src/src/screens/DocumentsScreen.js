import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function DocumentsScreen() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await api.get('/api/employee/documents')
      setDocs(r.data.documents || [])
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {docs.length === 0 ? (
        <Text style={s.empty}>No documents available</Text>
      ) : docs.map(d => (
        <TouchableOpacity key={d.id} style={s.card} onPress={() => Alert.alert(d.file_name, `Type: ${d.file_type || '—'}\nCategory: ${d.category || '—'}`)}>
          <Text style={s.docIcon}>{d.file_type === 'pdf' ? '📄' : d.file_type?.match(/image|png|jpg|jpeg/) ? '🖼️' : '📎'}</Text>
          <View style={{flex: 1}}>
            <Text style={s.docName} numberOfLines={1}>{d.file_name}</Text>
            <Text style={s.docMeta}>{d.category || 'Document'} · {d.uploaded_by_name || '—'}</Text>
            {d.uploaded_at && <Text style={s.docDate}>{new Date(d.uploaded_at).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}</Text>}
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
  empty: {textAlign: 'center', color: C.muted, padding: 40, fontSize: 14},
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 8, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  docIcon: {fontSize: 28},
  docName: {fontSize: 14, fontWeight: '600', color: C.text},
  docMeta: {fontSize: 11, color: C.muted, marginTop: 2},
  docDate: {fontSize: 10, color: C.textLight, marginTop: 1},
})
