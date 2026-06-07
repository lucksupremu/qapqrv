import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    router: {
      autoCodeSplitting: true,
    },
  },
  vite: {
    build: {
      sourcemap: false,
    },
  },
});
