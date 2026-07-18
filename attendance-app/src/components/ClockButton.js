import {useState} from 'react'
import {TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet} from 'react-native'
import Geolocation from '@react-native-community/geolocation'
import api from '../services/api'
import {C} from '../theme'

export default function ClockButton({today, onUpdate}) {
  const [loading, setLoading] = useState(false)
  const isIn = today && !today.clock_out

  const handlePress = async () => {
    setLoading(true)
    try {
      const loc = await getLocation()
      if (isIn) {
        await api.post('/api/attendance/clock-out', {work_description: ''})
        Alert.alert('Clocked Out', 'Have a great day!')
      } else {
        await api.post('/api/attendance/clock-in', {
          lat: loc?.lat, lon: loc?.lon, location_name: loc?.name,
        })
        Alert.alert('Clocked In', 'Your session has started')
      }
      onUpdate()
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Something went wrong')
    }
    setLoading(false)
  }

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

  return (
    <TouchableOpacity style={[s.btn, {backgroundColor: isIn ? C.danger : C.success}]} onPress={handlePress} disabled={loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.text}>{isIn ? 'CLOCK OUT' : 'CLOCK IN'}</Text>}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: {paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, minWidth: 180, alignItems: 'center'},
  text: {color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1},
})
