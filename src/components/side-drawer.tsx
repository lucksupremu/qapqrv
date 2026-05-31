import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Calendar,
  FolderDown,
  Globe,
  Mail,
  Wallet,
  BookOpen,
  Lock,
  KeyRound,
  X,
} from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const DrawerCtx = createContext<Ctx | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DrawerCtx.Provider value={{ open, setOpen }}>
      {children}
      <SideDrawer />
    </DrawerCtx.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerCtx);
  if (!ctx) throw new Error("useDrawer must be used inside DrawerProvider");
  return ctx;
}

type Item =
  | { type: "route"; to: string; label: string; icon: typeof Home }
  | { type: "external"; href: string; label: string; icon: typeof Home };

const grupo1: Item[] = [
  { type: "route", to: "/", label: "Início", icon: Home },
  { type: "route", to: "/calendario", label: "Calendário", icon: Calendar },
  { type: "route", to: "/escalas-baixadas", label: "Escalas Baixadas", icon: FolderDown },
];
const grupo2: Item[] = [
  { type: "route", to: "/intranet", label: "Intranet PMESP", icon: Globe },
  {
    type: "external",
    href: "https://correio.policiamilitar.sp.gov.br",
    label: "Correio PMESP",
    icon: Mail,
  },
  {
    type: "external",
    href: "https://www.ciaf.policiamilitar.sp.gov.br/folhadepagamento/autenticacaosegura.aspx",
    label: "Folha de Pagamento",
    icon: Wallet,
  },
];
const grupo3: Item[] = [
  { type: "route", to: "/anyconnect", label: "Guia AnyConnect", icon: BookOpen },
  { type: "route", to: "/privacidade", label: "Política de Privacidade", icon: Lock },
];

function SideDrawer() {
  const { open, setOpen } = useDrawer();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const renderItem = (it: Item) => {
    const Icon = it.icon;
    const isActive = it.type === "route" && it.to === path;
    const base =
      "flex items-center gap-3 px-6 py-4 text-[15px] transition-all duration-200 relative";
    const activeCls = isActive
      ? "font-bold"
      : "hover:bg-[#e8f0f8]";
    const style = isActive
      ? { background: "#e8f0f8", color: "#2e6b8a" }
      : { color: "#0f2535" };

    const content = (
      <>
        {isActive && (
          <span
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: "#2e6b8a" }}
          />
        )}
        <Icon size={20} style={{ color: isActive ? "#2e6b8a" : "#5b7a8f" }} />
        <span>{it.label}</span>
      </>
    );

    if (it.type === "external") {
      return (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className={`${base} ${activeCls}`}
          style={style}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        key={it.label}
        to={it.to}
        onClick={() => setOpen(false)}
        className={`${base} ${activeCls}`}
        style={style}
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      {/* overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[280px] bg-[#ffffff] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ borderRadius: "20px 0 0 20px" }}
      >
        <div className="flex items-start justify-between p-6" style={{ background: "var(--gradient-primary)", borderRadius: "20px 0 0 0", boxShadow: "var(--shadow-glow)" }}>
          <div>
            <h2 className="text-[22px] font-bold text-white">Atividade D</h2>
            <p className="text-[14px] text-white/70">PMESP</p>
          </div>
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-white/80 transition hover:bg-white/10 active:scale-95"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex flex-col overflow-y-auto" style={{ maxHeight: "calc(100% - 110px)" }}>
          {grupo1.map(renderItem)}
          <div className="my-2 mx-6 border-t" style={{ borderColor: "#d5e3ee" }} />
          {grupo2.map(renderItem)}
          <div className="my-2 mx-6 border-t" style={{ borderColor: "#d5e3ee" }} />
          {grupo3.map(renderItem)}
        </nav>
      </aside>
    </>
  );
}
