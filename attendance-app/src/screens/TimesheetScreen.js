import {useState, useEffect, useCallback} from 'react'
import {View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl, Alert, ActivityIndicator} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function TimesheetScreen({route}) {
  const {projectId} = route.params || {}
  const [entries, setEntries] = useState([])
  const [hours, setHours] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [projects, setProjects] = useState([])
  const [selectedPid, setSelectedPid] = useState(projectId || '')

  const load = useCallback(async () => {
    try {
      if (!selectedPid) {
        const r = await api.get('/api/employee/projects')
        setProjects(r.data.projects || [])
        if (r.data.projects?.length) setSelectedPid(r.data.projects[0].id)
      }
      if (selectedPid) {
        const r = await api.get(`/api/projects/${selectedPid}/timesheets`)
        setEntries(r.data.timesheets || [])
      }
    } catch (_) {}
    setLoading(false)
    setRefreshing(false)
  }, [selectedPid])

  useEffect(() => {load()}, [load])
  const onRefresh = () => {setRefreshing(true); load()}

  const addEntry = async () => {
    if (!hours || !desc.trim()) {Alert.alert('Error', 'Hours and description required'); return}
    setSaving(true)
    try {
      await api.post(`/api/projects/${selectedPid}/timesheets`, {hours: parseFloat(hours), description: desc, date: new Date().toISOString().split('T')[0]})
      setHours('')
      setDesc('')
      load()
    } catch (e) {Alert.alert('Error', e.response?.data?.error || 'Failed')}
    setSaving(false)
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={s.title}>Timesheet</Text>
      {!projectId && projects.length > 0 && (
        <View style={s.pickerRow}>
          {projects.map(p => (
            <TouchableOpacity key={p.id} style={[s.pill, selectedPid === p.id && s.pillActive]} onPress={() => setSelectedPid(p.id)}>
              <Text style={[s.pillText, selectedPid === p.id && s.pillTextActive]}>{p.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={s.card}>
        <TextInput style={s.input} value={hours} onChangeText={setHours} placeholder="Hours (e.g. 4.5)" keyboardType="decimal-pad" placeholderTextColor={C.textLight} />
        <TextInput style={s.inputMulti} value={desc} onChangeText={setDesc} placeholder="Work description" multiline placeholderTextColor={C.textLight} />
        <TouchableOpacity style={s.addBtn} onPress={addEntry} disabled={saving}>
          <Text style={s.addBtnText}>{saving ? 'Saving...' : '+ Add Entry'}</Text>
        </TouchableOpacity>
      </View>
      {entries.length === 0 ? <Text style={s.empty}>No entries</Text> : entries.map(e => (
        <View key={e.id} style={s.entry}>
          <View style={{flex: 1}}>
            <Text style={s.entryDesc}>{e.description}</Text>
            <Text style={s.entryDate}>{e.date?.split('T')[0]} · {e.status}</Text>
          </View>
          <Text style={s.entryHours}>{e.hours}h</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 12},
  pickerRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12},
  pill: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border},
  pillActive: {backgroundColor: C.primary, borderColor: C.primary},
  pillText: {fontSize: 11, fontWeight: '600', color: C.muted},
  pillTextActive: {color: '#fff'},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 12, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  input: {borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 8, color: C.text},
  inputMulti: {borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, fontSize: 13, minHeight: 50, marginBottom: 8, color: C.text},
  addBtn: {backgroundColor: C.primary, borderRadius: 8, padding: 10, alignItems: 'center'},
  addBtnText: {color: '#fff', fontWeight: '700', fontSize: 13},
  empty: {textAlign: 'center', color: C.muted, padding: 20},
  entry: {flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 8, padding: 12, marginBottom: 6, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1},
  entryDesc: {fontSize: 13, fontWeight: '600', color: C.text},
  entryDate: {fontSize: 11, color: C.muted, marginTop: 2},
  entryHours: {fontSize: 16, fontWeight: '800', color: C.primary, marginLeft: 8},
})
