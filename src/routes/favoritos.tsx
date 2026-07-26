import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ToolCard } from "@/components/tool-card";
import { tools } from "@/lib/tools";
import { useFavorites } from "@/hooks/use-local-list";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — MIKE TOOLS" },
      { name: "description", content: "Suas ferramentas favoritas." },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { favorites } = useFavorites();
  const list = tools.filter((t) => favorites.includes(t.slug));

  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader showBrand={false} title="Favoritos" subtitle="Suas ferramentas marcadas" />

      <main className="px-4 mt-5 grid grid-cols-2 gap-3">
        {list.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground py-16">
            Toque na estrela em uma ferramenta para favoritar.
          </p>
        ) : (
          list.map((t) => <ToolCard key={t.slug} tool={t} />)
        )}
      </main>

      <BottomNav />
    </div>
  );
}
