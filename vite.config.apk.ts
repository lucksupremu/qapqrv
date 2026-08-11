import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Build estático (SPA) para empacotar no APK via Capacitor.
// Sem SSR/Nitro: `vite build --config vite.config.apk.ts` gera `android-dist/` puro,
// com `index.html` + `src/main.tsx` como entrada.
// O build do site (SSR) usa `vite.config.ts`.
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Nunca compartilhar a saída com o build SSR publicado. Isso impede que o
    // index.html do APK (que referencia /src/main.tsx) seja enviado ao site.
    outDir: "android-dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
