import {useEffect} from 'react'
import {useAuth, AuthProvider} from './src/contexts/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import TasksScreen from './src/screens/TasksScreen'
import TaskDetailScreen from './src/screens/TaskDetailScreen'
import MeetingsScreen from './src/screens/MeetingsScreen'
import {NavigationContainer} from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {View, Text, ActivityIndicator, StyleSheet, StatusBar, Alert} from 'react-native'
import {createRef} from 'react'
import {C} from './src/theme'
import {requestPermission, registerDeviceToken, setupForegroundHandler, setupBackgroundHandler, setupNotificationOpenedHandler} from './src/services/notifications'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const navigationRef = createRef()

function TabIcon({label, focused}) {
  const icons = {Attendance: '🕐', Tasks: '✅', Meetings: '📅'}
  return (
    <View style={styles.tabIcon}>
      <Text style={{fontSize: 20}}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

function TasksStack() {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: C.card}, headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17}, headerShadowVisible: false, headerTintColor: C.primary}}>
      <Stack.Screen name="TasksList" component={TasksScreen} options={{title: 'My Tasks'}} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{title: 'Task'}} />
    </Stack.Navigator>
  )
}

function AppContent() {
  const {user, loading} = useAuth()

  useEffect(() => {
    if (!user) return
    setupBackgroundHandler()
    requestPermission().then(granted => {
      if (granted) registerDeviceToken()
    })
    const unsub = setupForegroundHandler(msg => {
      Alert.alert(msg.notification?.title || '', msg.notification?.body || '')
    })
    setupNotificationOpenedHandler(navigationRef)
    return () => { if (unsub) unsub() }
  }, [user])

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused}) => <TabIcon label={route.name} focused={focused} />,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          headerShadowVisible: false,
          headerStyle: {backgroundColor: C.card},
          headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17},
        })}>
        <Tab.Screen name="Attendance" component={DashboardScreen} options={{title: 'Attendance', headerTitle: 'Attendance'}} />
        <Tab.Screen name="Tasks" component={TasksStack} options={{headerShown: false}} />
        <Tab.Screen name="Meetings" component={MeetingsScreen} options={{title: 'Meetings', headerTitle: 'My Meetings'}} />
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
