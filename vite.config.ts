import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/invest-insight-innovator/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor":    ["react", "react-dom", "react-router-dom"],
          "query-vendor":    ["@tanstack/react-query"],
          "recharts-vendor": ["recharts"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "sentry-vendor":   ["@sentry/react"],
        },
      },
    },
  },
}));
