import {View, Text, StyleSheet} from 'react-native'
import {C} from '../theme'

export default function StatsCard({label, value, color}) {
  return (
    <View style={s.card}>
      <Text style={[s.value, {color: color || C.primary}]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: {flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1},
  value: {fontSize: 18, fontWeight: '800'},
  label: {fontSize: 11, color: C.muted, marginTop: 2},
})
