import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native'
import api from '../services/api'
import {C} from '../theme'

export default function ProjectDetailScreen({route}) {
  const {projectId} = route.params
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {load()}, [])

  const load = async () => {
    try {
      const r = await api.get(`/api/employee/projects/${projectId}`)
      setProject(r.data.project)
    } catch (_) {}
    setLoading(false)
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.primary} /></View>
  if (!project) return <View style={s.center}><Text>Project not found</Text></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Info */}
      <View style={s.card}>
        <Text style={s.title}>{project.title}</Text>
        <Text style={s.stageBadge}>{project.stage}</Text>
        {project.description ? <Text style={s.desc}>{project.description}</Text> : null}
        <View style={s.divider} />
        <InfoRow label="Client" value={project.account_name} />
        <InfoRow label="PM" value={project.pm_name} />
        <InfoRow label="Start" value={project.start_date?.split('T')[0]} />
        <InfoRow label="Target" value={project.target_date?.split('T')[0]} />
        <InfoRow label="Value" value={project.total_value ? `₹${Number(project.total_value).toLocaleString()}` : '—'} />
      </View>

      {/* Team */}
      {project.team?.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Team ({project.team.length})</Text>
          {project.team.map(m => (
            <View key={m.id} style={s.teamRow}>
              <Text style={s.teamName}>{m.name}</Text>
              <Text style={s.teamRole}>{m.role || '—'}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Coming soon', 'Task list will open')}>
          <Text style={s.actionText}>📋 Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Coming soon', 'Documents will open')}>
          <Text style={s.actionText}>📄 Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => Alert.alert('Coming soon', 'Meetings will open')}>
          <Text style={s.actionText}>📅 Meetings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function InfoRow({label, value}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || '—'}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  content: {padding: 16, paddingBottom: 40},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  card: {backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 12, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  title: {fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4},
  stageBadge: {fontSize: 11, color: C.primary, fontWeight: '600', marginBottom: 8},
  desc: {fontSize: 13, color: C.muted, lineHeight: 19},
  divider: {height: 1, backgroundColor: C.border, marginVertical: 10},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4},
  infoLabel: {fontSize: 13, color: C.muted},
  infoValue: {fontSize: 13, color: C.text, fontWeight: '600'},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8},
  teamRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.bg},
  teamName: {fontSize: 13, fontWeight: '600', color: C.text},
  teamRole: {fontSize: 12, color: C.muted},
  actionsRow: {flexDirection: 'row', gap: 8, marginTop: 4},
  actionBtn: {flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 14, alignItems: 'center', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  actionText: {fontSize: 13, fontWeight: '600', color: C.text},
})
