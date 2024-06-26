import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { rpc as astroRpc } from 'astro-rpc';

export default defineConfig({
  integrations: [react(), astroRpc()],
  devToolbar: {
    enabled: false,
  },
  vite: {
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  },
});
