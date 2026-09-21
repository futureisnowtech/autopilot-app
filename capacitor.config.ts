import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.autopilot.app',
  appName: 'Autopilot',
  webDir: 'public',
  server: {
    // Hosted web app URL for dynamic SSR & API routes support
    // Set CAPACITOR_SERVER_URL environment variable to your deployed production domain
    url: process.env.CAPACITOR_SERVER_URL || 'https://autopilot-app.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d0d1f',
    },
  },
};

export default config;
