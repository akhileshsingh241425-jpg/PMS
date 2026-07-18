import {Platform} from 'react-native'
import messaging from '@react-native-firebase/messaging'
import api from './api'

let onNotificationOpened = null
let onMessageReceived = null

export async function requestPermission() {
  const auth = await messaging().requestPermission()
  return auth === messaging.AuthorizationStatus.AUTHORIZED || auth === messaging.AuthorizationStatus.PROVISIONAL
}

export async function getToken() {
  try {
    const token = await messaging().getToken()
    return token
  } catch {
    return null
  }
}

export async function registerDeviceToken() {
  const token = await getToken()
  if (!token) return
  try {
    await api.post('/api/push/register-token', {token, platform: Platform.OS})
  } catch {}
}

export async function unregisterDeviceToken() {
  try {
    const token = await getToken()
    if (token) await api.post('/api/push/unregister-token', {token})
  } catch {}
}

export function setupForegroundHandler(handler) {
  onMessageReceived = handler
  return messaging().onMessage(async remoteMessage => {
    if (handler) handler(remoteMessage)
  })
}

export function setupBackgroundHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // System notification auto-displayed by FCM
    return Promise.resolve()
  })
}

export function setupNotificationOpenedHandler(navigationRef) {
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationData(remoteMessage.data, navigationRef)
  })

  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      setTimeout(() => handleNotificationData(remoteMessage.data, navigationRef), 500)
    }
  })
}

function handleNotificationData(data, navigationRef) {
  if (!data || !navigationRef?.current) return
  const {module_type, module_id} = data
  if (module_type === 'task' && module_id) {
    navigationRef.current.navigate('Tasks', {screen: 'TaskDetail', params: {taskId: Number(module_id)}})
  } else if (module_type === 'meeting' && module_id) {
    navigationRef.current.navigate('More', {screen: 'Meetings'})
  } else if (module_type === 'attendance') {
    navigationRef.current.navigate('Dashboard')
  }
}
