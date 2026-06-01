import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { ToolCard } from "@/components/tool-card";
import { EscalaCalendarCard } from "@/components/escala-calendar-card";
import { tools } from "@/lib/tools";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Início — QAP, QRV!" },
      { name: "description", content: "Acesse todas as ferramentas operacionais." },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return tools;
    return tools.filter(
      (x) =>
        x.name.toLowerCase().includes(t) ||
        x.description.toLowerCase().includes(t),
    );
  }, [q]);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader subtitle="Acesse todas as ferramentas." />

      <div className="px-4 -mt-7">
        <div
          className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <Search className="size-5 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ferramenta..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <main className="px-4 mt-5 grid grid-cols-2 gap-3">
        {filtered.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
        {filtered.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-muted-foreground py-12">
            Nenhuma ferramenta encontrada.
          </p>
        ) : null}
      </main>

      {q.trim() === "" && <EscalaCalendarCard />}

      <BottomNav />
    </div>
  );
}
