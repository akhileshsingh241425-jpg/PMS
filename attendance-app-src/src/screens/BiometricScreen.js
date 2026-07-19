import {useState} from 'react'
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native'
import ReactNativeBiometrics from 'react-native-biometrics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {C} from '../theme'

const rnBiometrics = new ReactNativeBiometrics()
const BIO_KEY = 'biometric_enabled'

export default function BiometricScreen({navigation}) {
  const [enabled, setEnabled] = useState(false)
  const [available, setAvailable] = useState(null)

  useState(() => {
    (async () => {
      const {available: avail} = await rnBiometrics.isSensorAvailable()
      setAvailable(avail)
      const val = await AsyncStorage.getItem(BIO_KEY)
      setEnabled(val === 'true')
    })()
  }, [])

  const toggle = async () => {
    if (enabled) {
      await AsyncStorage.setItem(BIO_KEY, 'false')
      setEnabled(false)
      Alert.alert('Disabled', 'Biometric login disabled')
      return
    }
    try {
      const {success} = await rnBiometrics.simplePrompt({promptMessage: 'Enable biometric login'})
      if (success) {
        await AsyncStorage.setItem(BIO_KEY, 'true')
        setEnabled(true)
        Alert.alert('Enabled', 'You can now login with fingerprint/face')
      }
    } catch { Alert.alert('Error', 'Biometric setup failed') }
  }

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.icon}>🔐</Text>
        <Text style={s.title}>Biometric Auth</Text>
        <Text style={s.desc}>
          {available ? 'Use fingerprint or face to unlock the app' : 'Biometric sensor not available on this device'}
        </Text>
        {available && (
          <TouchableOpacity style={[s.btn, enabled && s.btnActive]} onPress={toggle}>
            <Text style={[s.btnText, enabled && s.btnTextActive]}>{enabled ? '✅ Enabled' : 'Enable Biometric'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg, padding: 16, justifyContent: 'center'},
  card: {backgroundColor: C.card, borderRadius: 16, padding: 32, alignItems: 'center', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2},
  icon: {fontSize: 48, marginBottom: 12},
  title: {fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8},
  desc: {fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 20},
  btn: {paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: C.primary, backgroundColor: 'transparent'},
  btnActive: {backgroundColor: C.successLight, borderColor: C.success},
  btnText: {fontSize: 15, fontWeight: '700', color: C.primary},
  btnTextActive: {color: C.success},
})
