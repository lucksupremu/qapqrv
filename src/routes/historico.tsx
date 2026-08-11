import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/lib/tools";
import { useHistory } from "@/hooks/use-local-list";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Histórico — MIKE TOOLS" },
      { name: "description", content: "Ferramentas acessadas recentemente." },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { history, clear } = useHistory();
  const list = history
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader showBrand={false} title="Histórico" subtitle="Acessadas recentemente" />

      <main className="px-4 mt-5">
        {list.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-16">
            Nenhuma ferramenta acessada ainda.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {list.map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
            <button
              onClick={clear}
              className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Limpar histórico
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
