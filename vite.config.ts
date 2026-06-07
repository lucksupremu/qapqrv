import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    router: {
      autoCodeSplitting: true,
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
