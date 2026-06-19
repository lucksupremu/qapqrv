// Mini-notificação flutuante e sutil que aparece de vez em quando
// pedindo para o usuário compartilhar o app com outros policiais.
// Diferente do ShareAppBanner (card mensal grande no /inicio), este
// componente vive no layout raiz e pode aparecer em qualquer tela.

import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { getAccessDays } from "@/lib/push-client";

const STORAGE_KEY = "share_nudge_last_shown_at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MIN_ACCESS_DAYS = 5;
const SHOW_AFTER_MS = 20_000; // espera 20s na sessão antes de mostrar
const AUTO_HIDE_MS = 12_000; // some sozinho após 12s

const APP_URL = "https://www.miketools.top";
const SHARE_TEXT = `🚔 QAP, QRV! — app do PM com escalas, lembretes e intranet. Baixa aí: ${APP_URL}`;

const EXCLUDED_PREFIXES = [
  "/onboarding",
  "/splash",
  "/anyconnect",
  "/escala-viewer",
];

function isExcludedRoute(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isWithinCooldown(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return false;
    const ts = Date.parse(last);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markShown() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function ShareAppNudge() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);

  // Agenda exibição uma vez por sessão.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isWithinCooldown()) return;
    if (getAccessDays() < MIN_ACCESS_DAYS) return;

    const t = window.setTimeout(() => {
      setShow(true);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Auto-hide depois de AUTO_HIDE_MS — sem marcar como dispensado,
  // mas registra a exibição para respeitar o cooldown.
  useEffect(() => {
    if (!show) return;
    markShown();
    const t = window.setTimeout(() => setShow(false), AUTO_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [show]);

  if (!show) return null;
  if (isExcludedRoute(pathname)) return null;

  const close = () => setShow(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "QAP, QRV!",
          text: SHARE_TEXT,
          url: APP_URL,
        });
        close();
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      toast.success("Link copiado!");
      close();
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-3 right-3 z-40 mx-auto max-w-[420px] animate-fade-in"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
      }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl border bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur"
        style={{ borderColor: "#16a34a55" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "#16a34a" }}
        >
          <Share2 size={16} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[12.5px] font-bold"
            style={{ color: "#0c2340" }}
          >
            Indique pra um colega de farda 🚔
          </p>
          <p
            className="truncate text-[11.5px] leading-snug"
            style={{ color: "#475569" }}
          >
            Ajude a tropa a conhecer o QAP, QRV!
          </p>
        </div>
        <button
          onClick={handleShare}
          className="shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold text-white active:scale-95"
          style={{ background: "#16a34a" }}
        >
          Compartilhar
        </button>
        <button
          aria-label="Dispensar"
          onClick={close}
          className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
