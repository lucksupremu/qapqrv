import { Link } from "@tanstack/react-router";
import { ArrowRight, Star } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { useFavorites } from "@/hooks/use-local-list";

export function ToolCard({ tool }: { tool: Tool }) {
  const { isFav, toggle } = useFavorites();
  const fav = isFav(tool.slug);
  const Icon = tool.icon;

  return (
    <Link
      to="/ferramenta/$slug"
      params={{ slug: tool.slug }}
      className="group relative flex flex-col gap-3 rounded-2xl bg-card p-4 transition active:scale-[0.98]"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <button
        aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        onClick={(e) => {
          e.preventDefault();
          toggle(tool.slug);
        }}
        className="absolute top-2.5 right-2.5 z-10 rounded-full p-1.5 text-muted-foreground hover:text-amber-500"
      >
        <Star className={`size-4 ${fav ? "fill-amber-400 text-amber-500" : ""}`} />
      </button>

      <div
        className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-md`}
      >
        <Icon className="size-7 text-white" strokeWidth={2.2} />
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-card-foreground leading-tight">{tool.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{tool.description}</p>
      </div>

      <ArrowRight className="size-4 self-end text-muted-foreground group-hover:text-brand-blue transition" />
    </Link>
  );
}
