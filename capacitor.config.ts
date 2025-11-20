import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.freedomaviation.app',
  appName: 'FreedomAviation',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow navigation to your API server
    allowNavigation: [
      'localhost:*',
      '*.freedomaviation.com',
      '*.supabase.co'
    ]
  },
  ios: {
    contentInset: 'always',
    // Configure scheme for OAuth redirects
    scheme: 'freedomaviation'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff'
    }
  }
};

export default config;

