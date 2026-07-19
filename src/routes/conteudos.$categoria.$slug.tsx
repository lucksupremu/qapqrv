import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleBody, slugify } from "@/components/article-body";
import { getCategoria, getArtigo, ARTIGOS } from "@/content";
import { Clock, Share2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/conteudos/$categoria/$slug")({
  loader: ({ params }) => {
    const cat = getCategoria(params.categoria);
    const art = getArtigo(params.slug);
    if (!cat || !art || art.category !== cat.slug) throw notFound();
    return { categoria: cat, artigo: art };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const { artigo, categoria } = loaderData;
    const url = `https://miketools.top/conteudos/${categoria.slug}/${artigo.slug}`;
    return {
      meta: [
        { title: `${artigo.title} — QAP, QRV!` },
        { name: "description", content: artigo.subtitle },
        { property: "og:title", content: artigo.title },
        { property: "og:description", content: artigo.subtitle },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: artigo.title,
            description: artigo.subtitle,
            datePublished: artigo.date,
            author: { "@type": "Organization", name: artigo.author },
            publisher: { "@type": "Organization", name: "QAP, QRV!" },
            mainEntityOfPage: url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://miketools.top/" },
              { "@type": "ListItem", position: 2, name: "Conteúdos", item: "https://miketools.top/conteudos" },
              { "@type": "ListItem", position: 3, name: categoria.title, item: `https://miketools.top/conteudos/${categoria.slug}` },
              { "@type": "ListItem", position: 4, name: artigo.title, item: url },
            ],
          }),
        },
        ...(artigo.faq && artigo.faq.length
          ? [{
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: artigo.faq.map((f: {q:string;a:string}) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }]
          : []),
      ],
    };
  },
  component: ArtigoScreen,
});

function ArtigoScreen() {
  const { categoria, artigo } = Route.useLoaderData();
  const related = (artigo.related || [])
    .map((s: string) => ARTIGOS.find((a) => a.slug === s))
    .filter(Boolean)
    .slice(0, 3);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: artigo.title, url });
      } catch {
        /* cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado");
      } catch {
        toast.error("Não foi possível copiar o link");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title={categoria.title} subtitle="Artigo" />
      <Breadcrumbs
        items={[
          { label: "Início", to: "/" },
          { label: "Conteúdos", to: "/conteudos" },
          { label: categoria.title },
          { label: artigo.title },
        ]}
      />
      <main className="mx-auto max-w-3xl px-5 py-5">
        <h1 className="text-2xl font-bold leading-tight text-foreground">{artigo.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{artigo.subtitle}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><User size={12} /> {artigo.author}</span>
          <span>·</span>
          <span>{new Date(artigo.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock size={12} /> {artigo.readingMinutes} min de leitura</span>
        </div>

        {artigo.toc.length > 1 && (
          <nav aria-label="Índice" className="mt-5 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Neste artigo</p>
            <ol className="space-y-1 pl-4 text-[13px] text-foreground/85 [counter-reset:sec]">
              {artigo.toc.map((h: string) => (
                <li key={h} className="list-decimal">
                  <a href={`#${slugify(h)}`} className="hover:text-primary hover:underline">{h}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="mt-6">
          <ArticleBody blocks={artigo.body} />
        </div>

        {artigo.faq && artigo.faq.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-foreground">Perguntas frequentes</h2>
            <dl className="mt-3 space-y-3">
              {artigo.faq.map((f: {q:string;a:string}) => (
                <div key={f.q} className="rounded-xl border border-border bg-card p-3">
                  <dt className="text-sm font-semibold text-foreground">{f.q}</dt>
                  <dd className="mt-1 text-[13.5px] text-foreground/80">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="mt-8 flex items-center gap-2">
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Share2 size={14} /> Compartilhar
          </button>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-foreground">Artigos relacionados</h2>
            <div className="mt-3 space-y-2">
              {related.map((r: any) => r && (
                <Link
                  key={r.slug}
                  to="/conteudos/$categoria/$slug"
                  params={{ categoria: r.category, slug: r.slug }}
                  className="block rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary/60"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
