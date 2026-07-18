import {useState} from 'react'
import {View, Text, StyleSheet, Alert, ActivityIndicator} from 'react-native'
import {C} from '../theme'
import api from '../services/api'

export default function QRScannerScreen() {
  const [scanning, setScanning] = useState(true)
  const [clocking, setClocking] = useState(false)

  const handleQR = async (data) => {
    if (clocking) return
    setScanning(false)
    setClocking(true)
    try {
      let projectId, location
      try {
        const parsed = JSON.parse(data)
        projectId = parsed.project_id
        location = parsed.location
      } catch { location = data }

      await api.post('/api/attendance/clock-in', {
        lat: null, lon: null,
        location_name: location || 'QR Scan',
        project_id: projectId,
        work_description: 'QR Scan Clock In',
      })
      Alert.alert('Clocked In', 'Attendance marked via QR')
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Clock-in failed')
    }
    setClocking(false)
    setScanning(true)
  }

  return (
    <View style={s.container}>
      {clocking ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /><Text style={{marginTop: 12, color: C.muted}}>Processing...</Text></View>
      ) : (
        <View style={s.placeholder}>
          <Text style={{fontSize: 48, marginBottom: 12}}>📷</Text>
          <Text style={s.title}>QR Attendance</Text>
          <Text style={s.desc}>Point camera at office QR code to clock in</Text>
          <Text style={s.note}>Note: QR scanner requires react-native-camera-kit or expo-camera</Text>
          <Text style={s.demo}>Demo QR data: {`{"project_id": 1, "location": "Office"}`}</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  placeholder: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  title: {fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8},
  desc: {fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 16},
  note: {fontSize: 11, color: C.warning, textAlign: 'center', marginBottom: 8},
  demo: {fontSize: 10, color: C.textLight, textAlign: 'center', fontFamily: 'monospace'},
})
