import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    router: {
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
      experimental: {
        enableCodeSplitting: true,
      },
    },
  },
  vite: {
    build: {
      sourcemap: false,
    },
  },
});
