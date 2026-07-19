import {useState, useEffect} from 'react'
import {View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator} from 'react-native'
import {launchCamera} from 'react-native-image-picker'
import api from '../services/api'
import {C} from '../theme'

export default function FaceRegisterScreen() {
  const [registered, setRegistered] = useState(false)
  const [faceImage, setFaceImage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/api/attendance/face-status').then(r => setRegistered(r.data.face_registered))
  }, [])

  const capture = () => {
    launchCamera({mediaType: 'photo', maxWidth: 320, maxHeight: 240, quality: 0.8, saveToPhotos: false, includeBase64: true}, res => {
      if (res.didCancel) return
      if (res.errorCode) {Alert.alert('Error', res.errorMessage); return}
      setFaceImage(res.assets[0]?.base64 || null)
    })
  }

  const register = async () => {
    if (!faceImage) return
    setSaving(true)
    try {
      await api.post('/api/attendance/register-face', {image: `data:image/jpeg;base64,${faceImage}`})
      Alert.alert('Success', 'Face registered successfully!')
      setRegistered(true)
      setFaceImage(null)
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Registration failed')
    }
    setSaving(false)
  }

  const deleteFace = async () => {
    try {
      await api.post('/api/attendance/delete-face')
      setRegistered(false)
      Alert.alert('Done', 'Face data deleted')
    } catch {Alert.alert('Error', 'Failed to delete')}
  }

  return (
    <View style={s.container}>
      {registered ? (
        <View style={s.statusCard}>
          <Text style={s.statusIcon}>✅</Text>
          <Text style={s.statusTitle}>Face Registered</Text>
          <Text style={s.statusDesc}>Your face will be verified at each clock in/out</Text>
          <TouchableOpacity style={s.deleteBtn} onPress={deleteFace}>
            <Text style={s.deleteText}>Delete Face Data</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.statusCard}>
          <Text style={s.statusIcon}>📸</Text>
          <Text style={s.statusTitle}>Not Registered</Text>
          <Text style={s.statusDesc}>Register your face to enable face verification</Text>
        </View>
      )}

      {faceImage && (
        <View style={s.previewWrap}>
          <Image source={{uri: `data:image/jpeg;base64,${faceImage}`}} style={s.preview} />
          <View style={s.previewBtns}>
            <TouchableOpacity style={s.saveBtn} onPress={register} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>✅ Save Face</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.retakeBtn} onPress={() => setFaceImage(null)}>
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!faceImage && (
        <TouchableOpacity style={s.captureBtn} onPress={capture}>
          <Text style={s.captureText}>📸 Capture Face</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg, padding: 16},
  statusCard: {backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2},
  statusIcon: {fontSize: 48, marginBottom: 8},
  statusTitle: {fontSize: 17, fontWeight: '800', color: C.text},
  statusDesc: {fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 4},
  deleteBtn: {marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: C.dangerLight},
  deleteText: {fontSize: 13, fontWeight: '700', color: C.danger},
  previewWrap: {alignItems: 'center', marginBottom: 20},
  preview: {width: 150, height: 150, borderRadius: 16, marginBottom: 12},
  previewBtns: {flexDirection: 'row', gap: 10},
  saveBtn: {backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12},
  saveText: {color: '#fff', fontWeight: '700', fontSize: 14},
  retakeBtn: {borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center'},
  retakeText: {fontSize: 14, fontWeight: '600', color: C.muted},
  captureBtn: {backgroundColor: C.primary, borderRadius: 12, padding: 16, alignItems: 'center'},
  captureText: {color: '#fff', fontWeight: '700', fontSize: 16},
})
