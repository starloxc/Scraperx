// @ts-check

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import node from '@astrojs/node'
import react from '@astrojs/react'
import viteCacheIsolation from 'astro-vite-cache-isolation'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  compressHTML: true,
  trailingSlash: 'never',

  build: {
    format: 'file',
  },

  prefetch: {
    defaultStrategy: 'viewport',
  },

  adapter: node({
    mode: 'standalone',
  }),

  session: false,

  security: {
    checkOrigin: false,
  },

  vite: {
    ssr: {
      noExternal: [
        '@fontsource-variable/geist',
        '@fontsource-variable/geist-mono',
        '@fontsource-variable/noto-sans-sc',
      ],
    },
    plugins: [/** @type {any} */ (tailwindcss())],
  },

  integrations: [react(), viteCacheIsolation()],
})
