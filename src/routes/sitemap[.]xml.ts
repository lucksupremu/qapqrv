import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://miketools.top";

interface SitemapEntry {
  path: string;
  lastmod?: string;
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
          { path: "/sobre", changefreq: "monthly", priority: "0.8" },
          { path: "/manual", changefreq: "monthly", priority: "0.8" },
          { path: "/blog", changefreq: "weekly", priority: "0.9" },
          { path: "/blog/escala-dejem-pmesp", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/diferenca-dejem-delegada", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/consultar-escala-passo-a-passo", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/direitos-operacao-delegada", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/escala-12x36-higidez-fisica", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/organizacao-plantao", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/vpn-anyconnect-seguranca", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/configurar-anyconnect-android", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/erros-comuns-intranet-pmesp", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/usar-app-offline", changefreq: "monthly", priority: "0.7" },
          { path: "/blog/compartilhar-escala-com-seguranca", changefreq: "monthly", priority: "0.7" },
          { path: "/contato", changefreq: "yearly", priority: "0.5" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.4" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
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
