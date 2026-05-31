import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { getTool } from "@/lib/tools";
import { BottomNav } from "@/components/bottom-nav";
import { useFavorites, useHistory } from "@/hooks/use-local-list";

export const Route = createFileRoute("/ferramenta/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return {
      tool: {
        slug: tool.slug,
        name: tool.name,
        description: tool.description,
        gradient: tool.gradient,
      },
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tool.name} — QAP, QRV!` },
          { name: "description", content: loaderData.tool.description },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Ferramenta não encontrada</h1>
        <Link to="/inicio" className="mt-4 inline-block text-brand-blue underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="text-xl font-bold">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    </div>
  ),
  component: ToolPage,
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const fullTool = getTool(tool.slug);
  const Icon = fullTool?.icon ?? FileSearch;
  const { push } = useHistory();
  const { isFav, toggle } = useFavorites();

  useEffect(() => {
    push(tool.slug);
  }, [tool.slug, push]);

  const fav = isFav(tool.slug);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header
        className="relative px-5 pt-6 pb-10 text-brand-navy-foreground"
        style={{ background: "var(--gradient-header)" }}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/inicio"
            className="rounded-lg p-1.5 -ml-1.5 hover:bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-6" />
          </Link>
          <button
            onClick={() => toggle(tool.slug)}
            aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
            className="rounded-lg p-1.5 -mr-1.5 hover:bg-white/10"
          >
            <Star className={`size-6 ${fav ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div
            className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-lg`}
          >
            <Icon className="size-8 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{tool.name}</h1>
            <p className="text-sm text-white/75 mt-0.5">{tool.description}</p>
          </div>
        </div>
      </header>

      <main className="px-5 mt-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Em construção</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
            Esta ferramenta ainda será implementada. A estrutura e a rota já estão
            prontas — o conteúdo específico vem em uma próxima atualização.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
