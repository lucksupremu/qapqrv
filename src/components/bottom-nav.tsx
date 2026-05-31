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
      className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 w-full max-w-[430px] bg-white pb-[env(safe-area-inset-bottom)]"
      style={{ borderTop: "1px solid #E0E8F0", height: 64 }}
    >
      <ul className="flex h-full items-stretch">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="flex h-full flex-col items-center justify-center gap-1 transition active:scale-95"
                style={{ color: active ? "#1B3A6B" : "#8A9BB5" }}
              >
                <Icon size={24} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            onClick={() => setOpen(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-1 transition active:scale-95"
            style={{ color: "#8A9BB5" }}
          >
            <Menu size={24} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
