import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
  ],
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
