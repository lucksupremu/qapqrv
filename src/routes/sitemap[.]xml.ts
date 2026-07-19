import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { ARTIGOS, CATEGORIAS } from "@/content";

const BASE_URL = "https://miketools.top";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().split("T")[0];

        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0", lastmod: today },
          { path: "/sobre", changefreq: "monthly", priority: "0.8" },
          { path: "/manual", changefreq: "monthly", priority: "0.7" },
          { path: "/ajuda", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.7" },
          { path: "/conteudos", changefreq: "weekly", priority: "0.9", lastmod: today },
          { path: "/contato", changefreq: "yearly", priority: "0.5" },
          { path: "/mapa-do-site", changefreq: "monthly", priority: "0.4" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.5" },
          { path: "/termos", changefreq: "yearly", priority: "0.4" },
          { path: "/cookies", changefreq: "yearly", priority: "0.3" },
          { path: "/aviso-legal", changefreq: "yearly", priority: "0.3" },
        ];

        const categoriaEntries: SitemapEntry[] = CATEGORIAS.map((c) => ({
          path: `/conteudos/${c.slug}`,
          changefreq: "monthly",
          priority: "0.7",
        }));

        const artigoEntries: SitemapEntry[] = ARTIGOS.map((a) => ({
          path: `/conteudos/${a.category}/${a.slug}`,
          changefreq: "monthly",
          priority: "0.7",
          lastmod: a.date,
        }));

        const entries = [
          ...staticEntries,
          ...categoriaEntries,
          ...artigoEntries,
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
