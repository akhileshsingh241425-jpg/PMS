import {useState} from 'react'
import {TouchableOpacity, Text, ActivityIndicator, Alert, Image, View, StyleSheet} from 'react-native'
import {launchCamera} from 'react-native-image-picker'
import Geolocation from '@react-native-community/geolocation'
import api from '../services/api'
import {C} from '../theme'

export default function ClockButton({today, onUpdate, faceRequired}) {
  const [loading, setLoading] = useState(false)
  const [faceImage, setFaceImage] = useState(null)
  const isIn = today && !today.clock_out

  const getLocation = () => new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos => {
        const {latitude, longitude} = pos.coords
        resolve({lat: latitude, lon: longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`})
      },
      () => resolve(null),
      {enableHighAccuracy: true, timeout: 10000},
    )
  })

  const captureFace = () => new Promise(resolve => {
    if (!faceRequired && faceImage) { resolve(faceImage); return }
    launchCamera({mediaType: 'photo', maxWidth: 320, maxHeight: 240, quality: 0.5, saveToPhotos: false, includeBase64: true}, res => {
      if (res.didCancel) resolve(null)
      else if (res.errorCode) {Alert.alert('Camera error', res.errorMessage); resolve(null)}
      else resolve(res.assets[0]?.base64 || null)
    })
  })

  const handlePress = async () => {
    setLoading(true)
    try {
      if (faceRequired && !faceImage) {
        const img = await captureFace()
        if (!img) { setLoading(false); return }
        setFaceImage(img)
      }

      const loc = await getLocation()
      const body = {
        lat: loc?.lat, lon: loc?.lon, location_name: loc?.name,
        face_image: faceImage ? `data:image/jpeg;base64,${faceImage}` : undefined,
      }

      if (isIn) {
        await api.post('/api/attendance/clock-out', body)
        Alert.alert('Clocked Out', 'Have a great day!')
      } else {
        await api.post('/api/attendance/clock-in', body)
        Alert.alert('Clocked In', 'Your session has started')
      }
      setFaceImage(null)
      onUpdate()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <View style={{alignItems: 'center'}}>
      {faceImage && (
        <Image source={{uri: `data:image/jpeg;base64,${faceImage}`}} style={s.preview} />
      )}
      <TouchableOpacity style={[s.btn, {backgroundColor: isIn ? C.danger : C.success}]} onPress={handlePress} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.text}>{isIn ? 'CLOCK OUT' : 'CLOCK IN'}</Text>}
      </TouchableOpacity>
      {faceRequired && !faceImage && (
        <Text style={s.hint}>📸 Face verification required</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  btn: {paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, minWidth: 180, alignItems: 'center'},
  text: {color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1},
  preview: {width: 80, height: 80, borderRadius: 40, marginBottom: 8},
  hint: {fontSize: 11, color: C.warning, marginTop: 6},
})
