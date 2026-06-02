import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/googlef2edc9e3a6b2e4a9.html")({
  server: {
    handlers: {
      GET: async () => {
        return new Response("google-site-verification: googlef2edc9e3a6b2e4a9.html", {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
