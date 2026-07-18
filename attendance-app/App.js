import {useRef, useEffect, useCallback} from 'react'
import {useAuth, AuthProvider} from './src/contexts/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import TasksScreen from './src/screens/TasksScreen'
import TaskDetailScreen from './src/screens/TaskDetailScreen'
import ProjectsScreen from './src/screens/ProjectsScreen'
import ProjectDetailScreen from './src/screens/ProjectDetailScreen'
import MeetingsScreen from './src/screens/MeetingsScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import ReportsScreen from './src/screens/ReportsScreen'
import MoreScreen from './src/screens/MoreScreen'
import DocumentsScreen from './src/screens/DocumentsScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import FaceRegisterScreen from './src/screens/FaceRegisterScreen'
import QRScannerScreen from './src/screens/QRScannerScreen'
import BiometricScreen from './src/screens/BiometricScreen'
import TimesheetScreen from './src/screens/TimesheetScreen'
import InvoicesScreen from './src/screens/InvoicesScreen'
import PMDashboardScreen from './src/screens/PMDashboardScreen'
import ClientPortalScreen from './src/screens/ClientPortalScreen'
import {NavigationContainer, useNavigation} from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {View, Text, ActivityIndicator, StyleSheet, StatusBar, Alert} from 'react-native'
import {C} from './src/theme'
import {requestPermission, registerDeviceToken, setupForegroundHandler, setupBackgroundHandler, setupNotificationOpenedHandler} from './src/services/notifications'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const navigationRef = useRef(null)

function TabIcon({label, focused}) {
  const icons = {Dashboard: '📊', Tasks: '✅', Projects: '📁', More: '☰'}
  return (
    <View style={styles.tabIcon}>
      <Text style={{fontSize: 20}}>{icons[label]}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

function stackScreen(name, component, title) {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: C.card}, headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17}, headerShadowVisible: false, headerTintColor: C.primary}}>
      <Stack.Screen name={name} component={component} options={{title: title || name}} />
    </Stack.Navigator>
  )
}

function TasksStack() {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: C.card}, headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17}, headerShadowVisible: false, headerTintColor: C.primary}}>
      <Stack.Screen name="TasksList" component={TasksScreen} options={{title: 'Tasks'}} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{title: 'Task'}} />
    </Stack.Navigator>
  )
}

function ProjectsStack() {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: C.card}, headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17}, headerShadowVisible: false, headerTintColor: C.primary}}>
      <Stack.Screen name="ProjectsList" component={ProjectsScreen} options={{title: 'Projects'}} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{title: 'Project'}} />
    </Stack.Navigator>
  )
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{headerStyle: {backgroundColor: C.card}, headerTitleStyle: {fontWeight: '700', color: '#1A1A2E', fontSize: 17}, headerShadowVisible: false, headerTintColor: C.primary}}>
      <Stack.Screen name="MoreMenu" component={MoreScreen} options={{title: 'More'}} />
      <Stack.Screen name="History" component={HistoryScreen} options={{title: 'History'}} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{title: 'Profile'}} />
      <Stack.Screen name="Meetings" component={MeetingsScreen} options={{title: 'Meetings'}} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{title: 'Notifications'}} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{title: 'Reports'}} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{title: 'Documents'}} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{title: 'Calendar'}} />
      <Stack.Screen name="FaceRegister" component={FaceRegisterScreen} options={{title: 'Face Registration'}} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{title: 'QR Attendance'}} />
      <Stack.Screen name="Biometric" component={BiometricScreen} options={{title: 'Biometric Auth'}} />
      <Stack.Screen name="Timesheet" component={TimesheetScreen} options={{title: 'Timesheet'}} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{title: 'Invoices'}} />
      <Stack.Screen name="PMDashboard" component={PMDashboardScreen} options={{title: 'PM Dashboard'}} />
      <Stack.Screen name="ClientPortal" component={ClientPortalScreen} options={{title: 'Client Portal'}} />
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
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{title: 'Attendance', headerTitle: 'Attendance'}} />
        <Tab.Screen name="Tasks" component={TasksStack} options={{headerShown: false}} />
        <Tab.Screen name="Projects" component={ProjectsStack} options={{headerShown: false}} />
        <Tab.Screen name="More" component={MoreStack} options={{headerShown: false}} />
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
