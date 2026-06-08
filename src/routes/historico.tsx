import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ToolCard } from "@/components/tool-card";
import { AdSlot } from "@/components/ad-slot";
import { tools } from "@/lib/tools";
import { useHistory } from "@/hooks/use-local-list";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — QAP, QRV!" },
      { name: "description", content: "Ferramentas acessadas recentemente." },
    ],
  }),
  component: Historico,
});

// Anúncio nativo intercalado a cada N itens do histórico.
const AD_EVERY = 4;

function Historico() {
  const { history, clear } = useHistory();
  const list = history
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Quebra em "linhas" do grid (2 colunas) e injeta um ad como linha cheia a cada AD_EVERY itens.
  const rows: Array<{ kind: "items"; items: typeof list } | { kind: "ad"; key: string }> = [];
  for (let i = 0; i < list.length; i += 2) {
    rows.push({ kind: "items", items: list.slice(i, i + 2) });
    if ((i + 2) % AD_EVERY === 0 && i + 2 < list.length) {
      rows.push({ kind: "ad", key: `ad-${i}` });
    }
  }

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
            <div className="space-y-3">
              {rows.map((row, i) =>
                row.kind === "items" ? (
                  <div key={`row-${i}`} className="grid grid-cols-2 gap-3">
                    {row.items.map((t) => (
                      <ToolCard key={t.slug} tool={t} />
                    ))}
                  </div>
                ) : (
                  <Fragment key={row.key}>
                    <div className="flex justify-center">
                      <AdSlot type="banner" />
                    </div>
                  </Fragment>
                ),
              )}
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
