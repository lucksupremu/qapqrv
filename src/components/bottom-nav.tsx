import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Calendar, FolderDown, Menu } from "lucide-react";
import { useDrawer } from "@/components/side-drawer";
import { useIsNative } from "@/hooks/use-is-native";

const baseItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/calendario", label: "Agenda", icon: Calendar },
] as const;

const nativeOnlyItems = [
  { to: "/escalas-baixadas", label: "Escalas", icon: FolderDown },
] as const;

export function BottomNav() {
  const { setOpen } = useDrawer();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const native = useIsNative();
  const items = native ? [...baseItems, ...nativeOnlyItems] : baseItems;

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 -translate-x-1/2 w-full max-w-[430px] sm:max-w-2xl lg:max-w-5xl bg-[#ffffff] pb-[env(safe-area-inset-bottom)]"
      style={{ borderTop: "1px solid #d5e3ee", height: 64 }}
    >
      <ul className="flex h-full items-stretch">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className="relative flex h-full flex-col items-center justify-center gap-1 transition active:scale-95"
                style={{ color: active ? "#6ba3c8" : "#5b7a8f" }}
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
            style={{ color: "#5b7a8f" }}
          >
            <Menu size={24} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
