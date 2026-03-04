import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'


import tailwindcss from "@tailwindcss/postcss"
import autoprefixer from "autoprefixer"


// https://vitejs.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  plugins: [
    vue(),
    vueJsx(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base: "./",
  build: {
    assetsDir: "static",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('/node_modules/vuedraggable')) {
            return 'vendor_vuedraggable';
          } if (id.includes('/node_modules/mathjs')) {
            return 'vendor_mathjs';
          } if (id.includes('/node_modules/radix')) {
            return 'vendor_radix';
          } if (id.includes('/node_modules/tailwind')) {
            return 'vendor_tailwind';
          } if (id.includes('/node_modules/sortable')) {
            return 'vendor_sortable';
          } if (id.includes('/node_modules/')) {
            return 'vendor';
          }
          return null;
        },
      },
    },
  },
})
