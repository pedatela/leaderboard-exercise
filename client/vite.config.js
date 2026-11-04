import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');

  return {
    plugins: [react()],
    server: {
      port: Number(env.DEV_PORT || 5173),
      proxy: { '/api': env.API_PROXY_TARGET || 'http://localhost:3001' },
    },
  };
});
