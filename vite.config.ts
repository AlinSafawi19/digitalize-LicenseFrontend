import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Performance optimization: More granular code splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-core': ['@mui/material', '@mui/icons-material'],
          'mui-dates': ['@mui/x-date-pickers-pro'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'charts': ['recharts'],
          'date-utils': ['date-fns', 'moment', 'moment-timezone'],
        },
      },
    },
  },
  server: {
    port: 3001,
    open: true,
  },
});