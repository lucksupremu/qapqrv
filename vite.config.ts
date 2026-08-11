// Build WEB (SSR real por rota, usado no site miketools.top).
// O build estático para o APK Capacitor vive em `vite.config.apk.ts`.
//
// @lovable.dev/vite-tanstack-config já inclui: tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, nitro, componentTagger (dev), alias @, etc.
// Não adicione esses plugins manualmente.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // A saída SSR é limpa pelo script de build antes de o Nitro gerar `dist/`.
  // Isso impede que HTMLs da antiga SPA sobrevivam entre publicações e sejam
  // tratados como assets estáticos em vez de passarem pelas rotas do Worker.
  build: {
    emptyOutDir: true,
  },
  tanstackStart: {
    // Redireciona o server entry do Start para src/server.ts (wrapper de erro SSR).
    server: { entry: "server" },
  },
});
