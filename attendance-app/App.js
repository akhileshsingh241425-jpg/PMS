import {useAuth, AuthProvider} from './src/contexts/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import {NavigationContainer} from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {View, Text, ActivityIndicator, StyleSheet, StatusBar} from 'react-native'
import {C} from './src/theme'

const Tab = createBottomTabNavigator()

function TabIcon({label, focused}) {
  const icons = {Dashboard: '📊', History: '📅', Profile: '👤'}
  return (
    <View style={styles.tabIcon}>
      <Text style={{fontSize: 20}}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

function AppContent() {
  const {user, loading} = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused}) => <TabIcon label={route.name} focused={focused} />,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          headerStyle: {backgroundColor: C.card},
          headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17},
          headerShadowVisible: false,
        })}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Attendance'}} />
        <Tab.Screen name="History" component={HistoryScreen} options={{title: 'History'}} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{title: 'Profile'}} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg},
  tabBar: {backgroundColor: C.card, borderTopColor: C.border, borderTopWidth: 1, height: 65, paddingTop: 6},
  tabIcon: {alignItems: 'center'},
  tabLabel: {fontSize: 10, color: C.muted, marginTop: 2},
  tabLabelActive: {color: C.primary, fontWeight: '700'},
})
