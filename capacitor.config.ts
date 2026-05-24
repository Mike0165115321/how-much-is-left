import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.howmuchisleft.app',
  appName: 'How Much Is Left',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
