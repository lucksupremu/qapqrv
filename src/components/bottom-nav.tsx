import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, FolderDown, Menu } from "lucide-react";
import { useDrawer } from "@/components/side-drawer";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/calendario", label: "Agenda", icon: Calendar },
  { to: "/escalas-baixadas", label: "Escalas", icon: FolderDown },
] as const;

export function BottomNav() {
  const { setOpen } = useDrawer();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 w-full max-w-[430px] bg-[#141432] pb-[env(safe-area-inset-bottom)]"
      style={{ borderTop: "1px solid #23234a", height: 64 }}
    >
      <ul className="flex h-full items-stretch">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="relative flex h-full flex-col items-center justify-center gap-1 transition active:scale-95"
                style={{ color: active ? "#a5b4fc" : "#8b8db5" }}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-[3px] w-10 rounded-b-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                )}
                <Icon size={22} />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            onClick={() => setOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-1 transition active:scale-95"
            style={{ color: "#8b8db5" }}
          >
            <Menu size={24} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
