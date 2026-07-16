import { Link } from "@tanstack/react-router";
import { Bell, BookOpenCheck, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VpnIndicator } from "@/components/vpn-indicator";
import { GlobalSearchButton } from "@/components/global-search";

type Props = {
  subtitle?: string;
  showBrand?: boolean;
  title?: string;
};

export function AppHeader({ subtitle, showBrand = true, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="relative px-5 pt-6 pb-12 text-brand-navy-foreground"
      style={{ background: "var(--gradient-header)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Abrir menu"
            className="rounded-lg p-1.5 -ml-1.5 hover:bg-white/10 active:bg-white/15 transition"
          >
            <Menu className="size-7" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>QAP, QRV!</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1 text-sm">
              {[
                { to: "/inicio", label: "Início" },
                { to: "/favoritos", label: "Favoritos" },
                { to: "/historico", label: "Histórico" },
                { to: "/manual", label: "Manual", icon: BookOpenCheck },
                { to: "/sobre", label: "Sobre" },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 hover:bg-accent"
                >
                  {"icon" in l && l.icon && <l.icon className="size-4" />}
                  {l.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1">
          <VpnIndicator />
          <GlobalSearchButton />
          <button
            aria-label="Notificações"
            className="relative rounded-lg p-1.5 -mr-1.5 hover:bg-white/10 active:bg-white/15 transition"
          >
            <Bell className="size-6" />
            <span className="absolute top-1 right-1 size-2 rounded-full bg-brand-blue ring-2 ring-[oklch(0.18_0.06_270)]" />
          </button>
        </div>
      </div>

      <div className="mt-3 text-center">
        {showBrand ? (
          <h1 className="text-4xl font-black tracking-tight">
            QAP, <span className="text-brand-blue">QRV!</span>
          </h1>
        ) : (
          <h1 className="text-2xl font-bold">{title}</h1>
        )}
        {subtitle ? (
          <p className="mt-1 text-sm text-white/75">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
