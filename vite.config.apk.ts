import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

// Build estático (SPA) para empacotar no APK via Capacitor.
// Sem SSR/Nitro: `vite build --config vite.config.apk.ts` gera `android-dist/` puro,
// com `index.html` + `src/main.tsx` como entrada.
// O build do site (SSR) usa `vite.config.ts`.
export default defineConfig({
  // O HTML SPA fica fora da raiz do projeto para que a publicação web nunca
  // o detecte como entrada. `publicDir` continua apontando para os assets
  // compartilhados do app.
  root: fileURLToPath(new URL("./apk", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
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
    outDir: fileURLToPath(new URL("./android-dist", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
  },
});
