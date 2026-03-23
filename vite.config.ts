import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const upstreamUrl = new URL(process.env.OPENAI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
  const proxyTarget = `${upstreamUrl.protocol}//${upstreamUrl.host}`;
  const apiBasePath = upstreamUrl.pathname.replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.OPENAI_DEFAULT_MODEL': JSON.stringify(process.env.OPENAI_DEFAULT_MODEL || env.OPENAI_DEFAULT_MODEL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify this; file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, apiBasePath),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              const apiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY || '';
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
            });
          },
        },
      },
    },
  };
});
