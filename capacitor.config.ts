import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.savori.app',
  appName: 'Savori',
  webDir: 'out',

  // Server configuration - load from hosted URL (Vercel)
  // For development, comment out server block and use webDir
  server: {
    // Production: your Vercel URL
    // url: 'https://your-app.vercel.app',

    // Development: use local dev server
    // url: 'http://localhost:3000',
    // cleartext: true,

    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a', // Dark background matching app
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  // iOS specific
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },

  // Android specific  
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Disable in production
  },
};

export default config;
