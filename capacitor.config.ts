
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.smarthub.app',
  appName: 'SmartHub - Device Access',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    Contacts: {},
    Device: {},
    Network: {},
    Camera: {
      allowEditing: false,
      saveToGallery: true,
      quality: 90
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {},
    Media: {
      androidGalleryMode: false
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    }
  },
  ios: {
    scheme: 'SmartHub'
  },
  android: {
    path: 'smarthub'
  }
}

export default config
