import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ezzium.smarttrack',
  appName: 'SmartTrack',
  webDir: 'dist/smarttrack-ui/browser',
  server: {
    url: 'http://192.168.1.134:4200',
    cleartext: true
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
