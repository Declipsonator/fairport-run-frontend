// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            // Proxy all /api/athletes/* → https://api.fairport.run/athletes/*
            '/api/athletes': {
                target: 'https://api.fairport.run',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            // Proxy all /api/relays → https://api.fairport.run/relays
            '/api/relays': {
                target: 'https://api.fairport.run',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
