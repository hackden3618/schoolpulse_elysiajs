import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        allowedHosts: ['.ngrok-free.dev', '.ngrok.app', '.ngrok.io'],
        port: 3001,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
})
