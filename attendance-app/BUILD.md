# PMS Attendance App - Build Guide

## Requirements
- Node.js 18+
- JDK 17 (https://adoptium.net)
- Android Studio + Android SDK 34
- USB connected Android device with USB Debugging enabled

## Steps

```bash
# 1. Go to app directory
cd attendance-app

# 2. Install dependencies
npm install

# 3. Connect phone via USB (accept RSA prompt on phone)

# 4. Run on device
npx react-native run-android

# OR build APK directly:
cd android
# Windows:
gradlew assembleDebug
# Linux/Mac:
./gradlew assembleDebug

# APK location:
# attendance-app/android/app/build/outputs/apk/debug/app-debug.apk
```

## APK Install
- Find `app-debug.apk` in the folder above
- Transfer to phone
- Open file manager → tap APK → Install
- Enable "Install from unknown apps" if prompted

## Phone Permissions to Allow
1. Camera — for face verification & QR scan
2. Location — for clock-in GPS & background tracking
3. Notifications — for push alerts
4. Storage — optional

## Server Config
Backend `FCM_SERVER_KEY` env variable set karna for push notifications:
```bash
export FCM_SERVER_KEY="your_firebase_server_key"
```

Backend already deployed hai to:
```bash
bash deploy.sh
```
