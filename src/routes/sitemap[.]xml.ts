import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://miketools.top";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
          { path: "/inicio", changefreq: "weekly", priority: "0.9" },
          { path: "/manual", changefreq: "monthly", priority: "0.8" },
          { path: "/sobre", changefreq: "monthly", priority: "0.6" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.5" },
          { path: "/anyconnect", changefreq: "monthly", priority: "0.6" },
          { path: "/intranet", changefreq: "monthly", priority: "0.6" },
          { path: "/calendario", changefreq: "weekly", priority: "0.7" },
          { path: "/favoritos", changefreq: "monthly", priority: "0.5" },
          { path: "/historico", changefreq: "monthly", priority: "0.5" },
          { path: "/ferramenta/consulta-escala", changefreq: "monthly", priority: "0.7" },
          { path: "/ferramenta/minha-localizacao", changefreq: "monthly", priority: "0.7" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
