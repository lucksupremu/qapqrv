import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CATEGORIAS, ARTIGOS } from "@/content";

export const Route = createFileRoute("/mapa-do-site")({
  head: () => ({
    meta: [
      { title: "Mapa do site — MIKE TOOLS" },
      { name: "description", content: "Todas as páginas públicas do MIKE TOOLS: conteúdos, ajuda, ferramentas, institucional e legal." },
      { property: "og:url", content: "https://miketools.top/mapa-do-site" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/mapa-do-site" }],
  }),
  component: MapaScreen,
});

function MapaScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Mapa do site" subtitle="Navegação" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Mapa do site" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5 text-sm">
        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-foreground">Institucional</h2>
          <ul className="space-y-1 pl-1">
            <li><Link to="/" className="text-primary hover:underline">Início</Link></li>
            <li><Link to="/sobre" className="text-primary hover:underline">Sobre</Link></li>
            <li><Link to="/contato" className="text-primary hover:underline">Contato</Link></li>
            <li><Link to="/privacidade" className="text-primary hover:underline">Política de privacidade</Link></li>
            <li><Link to="/cookies" className="text-primary hover:underline">Política de cookies</Link></li>
            <li><Link to="/termos" className="text-primary hover:underline">Termos de uso</Link></li>
            <li><Link to="/aviso-legal" className="text-primary hover:underline">Aviso legal</Link></li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-foreground">Suporte</h2>
          <ul className="space-y-1 pl-1">
            <li><Link to="/ajuda" className="text-primary hover:underline">Central de ajuda</Link></li>
            <li><Link to="/faq" className="text-primary hover:underline">Perguntas frequentes</Link></li>
            <li><Link to="/manual" className="text-primary hover:underline">Manual</Link></li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="mb-2 text-base font-bold text-foreground">Central de Conteúdo</h2>
          <ul className="space-y-1 pl-1">
            <li><Link to="/conteudos" className="text-primary hover:underline">Todas as categorias</Link></li>
            {CATEGORIAS.map((c) => (
              <li key={c.slug}>
                <Link to="/conteudos/$categoria" params={{ categoria: c.slug }} className="text-primary hover:underline">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">Artigos</h2>
          <ul className="space-y-1 pl-1">
            {ARTIGOS.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/conteudos/$categoria/$slug"
                  params={{ categoria: a.category, slug: a.slug }}
                  className="text-primary hover:underline"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
