// Preview-only config: binds the dev server to 0.0.0.0 and accepts the sandbox proxy
// host so the app can be looked at in a browser preview. Not used by the build.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5199, strictPort: true, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 5199, strictPort: true, allowedHosts: true },
});
