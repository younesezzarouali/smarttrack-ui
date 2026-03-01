#!/bin/bash

# 1. Get Local IP
IP_ADDR=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}')
PORT=4200

echo "🚀 Starting iOS Live Reload on http://$IP_ADDR:$PORT"

# 2. Update capacitor.config.ts for Live Reload
cat <<EOF > capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ezzium.smarttrack',
  appName: 'SmartTrack',
  webDir: 'dist/smarttrack-ui/browser',
  server: {
    url: 'http://$IP_ADDR:$PORT',
    cleartext: true
  }
};

export default config;
EOF

# 3. Patch environment.ts for backend access
cat <<EOF > src/app/environments/environment.ts
export const environment = {
    production: false,
    apiUrl: 'http://$IP_ADDR:8080'
};
EOF

# 4. Sync Capacitor
npx cap copy ios

# 5. Open Xcode
npx cap open ios

# 6. Start Angular Dev Server (bound to IP)
echo "--- Starting Angular Dev Server ---"
npm start -- --host $IP_ADDR --port $PORT
