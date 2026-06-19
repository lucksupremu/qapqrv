import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { POSTS } from "@/lib/blog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — QAP, QRV! | Dicas e guias operacionais" },
      {
        name: "description",
        content:
          "Artigos sobre escala Dejem e Delegada, organização de plantão, VPN AnyConnect e bem-estar do policial militar.",
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const sorted = [...POSTS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );
  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-3 px-4 py-4">
        <Link
          to="/"
          aria-label="Voltar"
          className="flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: "#2e6b8a" }}>
          Blog
        </h1>
      </header>

      <main className="mx-auto max-w-2xl px-5">
        <p className="text-[15px] leading-relaxed text-slate-700">
          Conteúdo prático para quem trabalha em escala: rotinas, tecnologia e
          bem-estar. Atualizado conforme novas demandas surgem.
        </p>

        <ul className="mt-6 space-y-3">
          {sorted.map((p) => (
            <li
              key={p.slug}
              className="rounded-[16px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.99]"
            >
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="block"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2e6b8a]">
                  {p.category}
                </span>
                <h2 className="mt-1 text-[17px] font-extrabold text-slate-800">
                  {p.title}
                </h2>
                <p className="mt-1 text-[14px] leading-[1.5] text-slate-600">
                  {p.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <time dateTime={p.publishedAt}>
                    {new Date(p.publishedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {p.readingMinutes} min
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
