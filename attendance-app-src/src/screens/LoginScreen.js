import {useState} from 'react'
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform} from 'react-native'
import {useAuth} from '../contexts/AuthContext'
import {C} from '../theme'

export default function LoginScreen() {
  const {login} = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {Alert.alert('Error', 'Email and password required'); return}
    setLoading(true)
    try {
      await login(email, password)
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.error || 'Check your credentials')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <View style={s.logo}>
          <Text style={s.logoText}>PMS</Text>
        </View>
        <Text style={s.title}>Attendance App</Text>
        <Text style={s.subtitle}>Sign in to your account</Text>

        <TextInput style={s.input} placeholder="Email" value={email} onChangeText={setEmail}
          autoCapitalize="none" keyboardType="email-address" placeholderTextColor={C.textLight} />
        <TextInput style={s.input} placeholder="Password" value={password} onChangeText={setPassword}
          secureTextEntry placeholderTextColor={C.textLight} />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 24},
  card: {backgroundColor: C.card, borderRadius: 16, padding: 32, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4},
  logo: {width: 56, height: 56, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16},
  logoText: {color: '#fff', fontSize: 22, fontWeight: '900'},
  title: {fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center'},
  subtitle: {fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 28},
  input: {borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 12, color: C.text, backgroundColor: '#F9FAFB'},
  btn: {backgroundColor: C.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8},
  btnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
})
