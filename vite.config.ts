import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const upstreamUrl = new URL(env.VALHEIM_STATUS_URL || 'https://valstatus.ty-davis.com/status.json')

  return {
    plugins: [vue(), tailwindcss()],
    server: {
      proxy: {
        '/api/valheim/status': {
          target: `${upstreamUrl.protocol}//${upstreamUrl.host}`,
          changeOrigin: true,
          rewrite: () => `${upstreamUrl.pathname}${upstreamUrl.search}`,
          headers: env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET
            ? {
                'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
                'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
              }
            : undefined,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
