import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            "firebase-vendor": [
              "firebase/app",
              "firebase/firestore",
              "firebase/auth",
            ],
            "ui-vendor": ["react", "react-dom", "lucide-react", "motion"],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
