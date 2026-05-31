import { Link } from "@tanstack/react-router";
import { Home, Star, Clock, Info } from "lucide-react";

const items = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/historico", label: "Histórico", icon: Clock },
  { to: "/sobre", label: "Sobre", icon: Info },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeProps={{ className: "text-brand-blue" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="group flex flex-col items-center gap-1 py-2.5"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`h-0.5 w-8 rounded-full transition ${
                      isActive ? "bg-brand-blue" : "bg-transparent"
                    }`}
                  />
                  <Icon className="size-5" />
                  <span className="text-[11px] font-medium">{label}</span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
