import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Você está em"
      className="flex flex-wrap items-center gap-1 px-4 pt-3 text-xs text-muted-foreground"
    >
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {c.to && !last ? (
              <Link to={c.to} className="hover:text-foreground hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-foreground" : ""}>{c.label}</span>
            )}
            {!last && <ChevronRight size={12} className="opacity-50" />}
          </span>
        );
      })}
    </nav>
  );
}
