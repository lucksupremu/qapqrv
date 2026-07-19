// Banner mensal: convida o usuário a compartilhar o app com colegas.
// - Aparece 1x por mês (controlado por localStorage "YYYY-MM").
// - Só aparece para quem já usou o app por pelo menos 3 dias distintos.
// - Botão direto para WhatsApp com mensagem pronta + link.
// - Botão "Outras opções" usa Web Share API (fallback: copia o link).

import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { toast } from "sonner";
import { getAccessDays, isFirstSession } from "@/lib/push-client";

const STORAGE_KEY = "share_banner_last_shown_yyyymm";
const MIN_ACCESS_DAYS = 3;
const APP_URL = "https://www.miketools.top";

const SHARE_TEXT = `🚔 *QAP, QRV!* — o app do PM

Calendário de escalas (dejem/delegada), lembretes automáticos, acesso fácil à intranet PMESP e escalas offline. Tudo num só lugar, de graça.

Baixa aí: ${APP_URL}`;

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shouldShowThisMonth(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    return last !== currentMonthKey();
  } catch {
    return false;
  }
}

function markShownThisMonth() {
  try {
    localStorage.setItem(STORAGE_KEY, currentMonthKey());
  } catch {
    /* ignore */
  }
}

export function ShareAppBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isFirstSession()) return; // não exibir no primeiro boot
    if (!shouldShowThisMonth()) return;
    if (getAccessDays() < MIN_ACCESS_DAYS) return;
    setShow(true);
  }, []);

  if (!show) return null;

  const close = () => {
    markShownThisMonth();
    setShow(false);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    close();
  };

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
      // usuário cancelou — não fecha
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
      className="mx-5 mt-3 rounded-2xl border p-3 shadow-sm"
      style={{ borderColor: "#16a34a40", background: "#dcfce7" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "#16a34a" }}
        >
          <Share2 size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold" style={{ color: "#0c2340" }}>
            Tem colega de farda que ainda não conhece?
          </p>
          <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "#166534" }}>
            Compartilhe o QAP, QRV! e ajude a tropa a controlar escalas,
            lembretes e intranet num só app.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold text-white active:scale-95"
              style={{ background: "#25D366" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 text-[12px] font-bold active:scale-95"
              style={{ borderColor: "#16a34a", color: "#166534" }}
            >
              <Share2 size={14} />
              Outras opções
            </button>
          </div>
        </div>
        <button
          aria-label="Dispensar"
          onClick={close}
          className="rounded-full p-1 text-slate-500 hover:bg-white/60"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
