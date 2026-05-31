import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Share2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Save,
  Lock,
  Loader2,
} from "lucide-react";

const searchSchema = z.object({
  url: z.string().max(2048).default("http://ms.policiamilitar.sp.gov.br/login.aspx"),
  titulo: z.string().min(1).max(120).default("Intranet PMESP"),
});

export const Route = createFileRoute("/intranet")({
  head: () => ({ meta: [{ title: "Intranet — QAP, QRV!" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: IntranetWebviewScreen,
});

function IntranetWebviewScreen() {
  const navigate = useNavigate();
  const { url, titulo } = Route.useSearch();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, url: currentUrl });
      } else {
        await navigator.clipboard.writeText(currentUrl);
        toast.success("Link copiado!");
      }
    } catch {
      /* ignore */
    }
  };

  const reload = () => {
    setLoading(true);
    setError(false);
    if (iframeRef.current) {
      // força recarregar
      iframeRef.current.src = currentUrl;
    }
  };

  const goBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      /* cross-origin */
    }
  };

  const goForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch {
      /* cross-origin */
    }
  };

  const salvarEscala = () => {
    try {
      const m = currentUrl.match(/nuesc=(\d+)/i);
      const id = m?.[1] ?? Date.now().toString();
      const raw = window.localStorage.getItem("escalas_baixadas");
      const list = raw ? (JSON.parse(raw) as Array<{ id: string; url: string; titulo?: string; dataSalva?: string }>) : [];
      const novo = { id, url: currentUrl, titulo, dataSalva: new Date().toISOString() };
      const dedup = [novo, ...list.filter((x) => x.id !== id)].slice(0, 100);
      window.localStorage.setItem("escalas_baixadas", JSON.stringify(dedup));
      toast.success("Escala salva!");
    } catch {
      toast.error("Não foi possível salvar a escala.");
    }
  };

  const openAnyConnect = () => {
    if (typeof window === "undefined") return;
    window.location.href =
      "intent://com.cisco.anyconnect.vpn.android.avf#Intent;scheme=android-app;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.cisco.anyconnect.vpn.android.avf;end";
  };

  return (
    <div className="flex h-screen flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="flex items-center gap-2 px-3 py-3"
        style={{ background: "#2e6b8a", color: "#fff" }}
      >
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 truncate text-center text-[16px] font-bold">
          {titulo}
        </h1>
        <button
          aria-label="Compartilhar"
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden bg-[#ffffff]">
        {!error && (
          <iframe
            ref={iframeRef}
            src={url}
            title={titulo}
            className="absolute inset-0 h-full w-full border-0"
            onLoad={(e) => {
              setLoading(false);
              try {
                const href = (e.currentTarget.contentWindow as Window).location.href;
                if (href && href !== "about:blank") setCurrentUrl(href);
              } catch {
                /* cross-origin: ok */
              }
            }}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}

        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#ffffff]">
            <Loader2 size={32} className="animate-spin" style={{ color: "#2e6b8a" }} />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#ffffff] px-6 text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <Lock size={36} />
            </div>
            <p className="text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
              Sem acesso à intranet
            </p>
            <p className="max-w-xs text-[14px]" style={{ color: "#5b7a8f" }}>
              Ligue a VPN AnyConnect para acessar este sistema.
            </p>
            <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
              <button
                onClick={openAnyConnect}
                className="h-12 rounded-[14px] font-bold text-white"
                style={{ background: "#2e6b8a" }}
              >
                Abrir AnyConnect
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="h-12 rounded-[14px] border-2 bg-[#ffffff] font-bold"
                style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <nav
        className="grid grid-cols-4 border-t bg-[#ffffff]"
        style={{ borderColor: "#e8f0f8" }}
      >
        <button
          onClick={goBack}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold"
          style={{ color: "#2e6b8a" }}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
        <button
          onClick={goForward}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold"
          style={{ color: "#2e6b8a" }}
        >
          <ChevronRight size={20} />
          Avançar
        </button>
        <button
          onClick={reload}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold"
          style={{ color: "#2e6b8a" }}
        >
          <RotateCw size={18} />
          Recarregar
        </button>
        <button
          onClick={salvarEscala}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold"
          style={{ color: "#2e6b8a" }}
        >
          <Save size={18} />
          Salvar escala
        </button>
      </nav>
    </div>
  );
}
