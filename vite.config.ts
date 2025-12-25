import { defineConfig, Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Read package.json to get version
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Plugin to inject package.json version as VITE_APP_VERSION
const injectVersionPlugin = (): Plugin => {
  const version = packageJson.version;
  return {
    name: 'inject-version',
    config(config, { mode }) {
      // Load existing env vars
      const env = loadEnv(mode, process.cwd(), '');
      // Set VITE_APP_VERSION from package.json if not already set in env file
      if (!env.VITE_APP_VERSION && !process.env.VITE_APP_VERSION) {
        process.env.VITE_APP_VERSION = version;
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectVersionPlugin()],
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