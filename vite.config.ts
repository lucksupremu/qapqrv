import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// SPA estática para empacotar no APK via Capacitor.
// Sem SSR/Nitro: `vite build` gera `dist/` puro.
export default defineConfig({
  tanstackStart: {
    router: {
      routesDirectory: "routes",
      generatedRouteTree: "routeTree.gen.ts",
    },
  },
  vite: {
    server: {
      host: "::",
      port: 8080,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  },
});
