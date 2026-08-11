// Build WEB (SSR real por rota, usado no site miketools.top).
// O build estático para o APK Capacitor vive em `vite.config.apk.ts`.
//
// @lovable.dev/vite-tanstack-config já inclui: tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro, componentTagger (dev), alias @, etc.
// Não adicione esses plugins manualmente.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redireciona o server entry do Start para src/server.ts (wrapper de erro SSR).
    server: { entry: "server" },
  },
});
