import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, ssrBuild }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: ssrBuild ? {
      input: 'src/entry-server.tsx',
      output: {
        format: 'es'
      }
    } : undefined
  },
  ssr: {
    noExternal: ['@supabase/supabase-js', '@tanstack/react-query', 'react-router-dom']
  }
}));