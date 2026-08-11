import { createFileRoute, redirect } from "@tanstack/react-router";

// Posts antigos do /blog redirecionam para o hub /conteudos.
// Mapa 1:1 para os slugs migrados; demais caem no índice.
const REDIRECT_MAP: Record<string, { categoria: string; slug: string }> = {
  "escala-dejem-pmesp": { categoria: "dejem", slug: "guia-dejem-completo" },
  "diferenca-dejem-delegada": {
    categoria: "delegada",
    slug: "diferenca-dejem-delegada-2026",
  },
};

export const Route = createFileRoute("/blog/$slug")({
  beforeLoad: ({ params }) => {
    const mapped = REDIRECT_MAP[params.slug];
    if (mapped) {
      throw redirect({
        to: "/conteudos/$categoria/$slug",
        params: mapped,
        replace: true,
        statusCode: 301,
      });
    }
    throw redirect({ to: "/conteudos", replace: true, statusCode: 301 });
  },
});
