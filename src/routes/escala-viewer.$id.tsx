import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertTriangle, Loader2, Share2 } from "lucide-react";
import { lerLista, lerPdfBlob, type EscalaSalva } from "@/lib/escalas-baixadas";
import { OfflineBadge } from "@/components/offline-badge";
import { ShareEscalaModal } from "@/components/share-escala-modal";


type PdfComponents = {
  Document: ComponentType<any>;
  Page: ComponentType<any>;
};

export const Route = createFileRoute("/escala-viewer/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Escala ${params.id} — MIKE TOOLS` },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EscalaViewer,
});

async function carregarBlob(escala: EscalaSalva | undefined): Promise<Blob | null> {
  if (!escala) return null;
  // Tenta IndexedDB (web e também usado em alguns fluxos do APK).
  try {
    const b = await lerPdfBlob(escala.id);
    if (b && b.size > 0) return b;
  } catch {
    /* ignore */
  }
  // PDFs baixados pelo plugin Android ficam em context.filesDir privado e devem
  // ser abertos pelo FileProvider nativo, não pelo Capacitor Filesystem/react-pdf.
  if (escala.localPath) {
    return null;
  }
  return null;
}

function EscalaViewer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [escala, setEscala] = useState<EscalaSalva | undefined>(undefined);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [width, setWidth] = useState(360);
  const [scale, setScale] = useState(1);
  const [pdfComponents, setPdfComponents] = useState<PdfComponents | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ Document, Page, pdfjs }, worker] = await Promise.all([
          import("react-pdf"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
          import("react-pdf/dist/Page/AnnotationLayer.css"),
          import("react-pdf/dist/Page/TextLayer.css"),
        ]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        if (!cancelled) setPdfComponents({ Document, Page });
      } catch (err) {
        console.error("Falha ao carregar leitor de PDF", err);
        if (!cancelled) setErro("Não foi possível carregar o leitor de PDF neste ambiente.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const all = lerLista();
    const e = all.find((x) => x.id === id);
    setEscala(e);
    (async () => {
      if (e?.localPath) {
        try {
          const { Capacitor } = await import("@capacitor/core");
          if (Capacitor.isNativePlatform()) {
            const { InAppWebView } = await import("@/lib/in-app-webview");
            await InAppWebView.openPdf({ path: e.localPath });
            navigate({ to: "/escalas-baixadas" });
            return;
          }
        } catch (err) {
          console.warn("Falha ao abrir PDF nativo", err);
          setErro("PDF baixado, mas não há leitor de PDF disponível no aparelho.");
          setLoading(false);
          return;
        }
      }
      const b = await carregarBlob(e);
      if (!b) {
        setErro(
          "Não foi possível abrir o PDF offline. Volte para a lista e baixe novamente com a VPN ativa.",
        );
      } else {
        setBlob(b);
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  // Largura responsiva
  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth ?? window.innerWidth;
      setWidth(Math.max(280, Math.min(w - 16, 900)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const fileObj = useMemo(() => (blob ? { url: URL.createObjectURL(blob) } : null), [blob]);
  useEffect(() => {
    return () => {
      if (fileObj?.url) URL.revokeObjectURL(fileObj.url);
    };
  }, [fileObj]);

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-10 flex items-center gap-2 px-3 py-3" style={{ background: "var(--bg)" }}>
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/escalas-baixadas" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 truncate text-center text-[16px] font-bold" style={{ color: "#2e6b8a" }}>
          Escala {id}
        </h1>
        <button
          aria-label="Compartilhar"
          onClick={() => setShareOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <Share2 size={18} />
        </button>
        <div className="flex h-10 w-10 items-center justify-end">
          <OfflineBadge />
        </div>
      </header>

      <ShareEscalaModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        id={id}
        url={escala?.url ?? window.location.href}
        titulo={escala?.titulo}
      />


      <div ref={containerRef} className="mx-auto flex w-full max-w-[920px] flex-col items-center px-2">
        {loading && (
          <div className="mt-20 flex flex-col items-center gap-2 text-[14px]" style={{ color: "#5b7a8f" }}>
            <Loader2 className="animate-spin" size={28} />
            Carregando PDF…
          </div>
        )}

        {!loading && erro && (
          <div
            className="mx-2 mt-8 w-full max-w-[520px] rounded-2xl border bg-white p-6 text-center"
            style={{ borderColor: "var(--border-soft)", boxShadow: "var(--shadow-card)" }}
          >
            <AlertTriangle size={48} className="mx-auto" style={{ color: "#E74C3C" }} />
            <p className="mt-3 text-[15px] font-bold" style={{ color: "#0f2535" }}>
              PDF não disponível offline
            </p>
            <p className="mt-2 text-[13px]" style={{ color: "#5b7a8f" }}>{erro}</p>
            <button
              onClick={() => navigate({ to: "/escalas-baixadas" })}
              className="mt-5 rounded-xl px-5 py-3 font-bold text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              Voltar
            </button>
          </div>
        )}

        {!loading && fileObj && !pdfComponents && (
          <div className="mt-20 flex items-center gap-2 text-[14px]" style={{ color: "#5b7a8f" }}>
            <Loader2 className="animate-spin" size={20} /> Preparando leitor…
          </div>
        )}

        {!loading && fileObj && pdfComponents && (
          <pdfComponents.Document
            file={fileObj}
            onLoadSuccess={({ numPages }: { numPages: number }) => {
              setNumPages(numPages);
              setPageNum(1);
            }}
            onLoadError={(err: Error) => {
              console.error("Erro ao renderizar PDF", err);
              setErro("Arquivo PDF corrompido. Baixe a escala novamente.");
            }}
            loading={
              <div className="mt-20 flex items-center gap-2 text-[14px]" style={{ color: "#5b7a8f" }}>
                <Loader2 className="animate-spin" size={20} /> Processando PDF…
              </div>
            }
          >
            <div className="overflow-auto rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
              <pdfComponents.Page
                pageNumber={pageNum}
                width={width * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          </pdfComponents.Document>
        )}
      </div>

      {!loading && fileObj && numPages > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 border-t bg-white px-3 py-2"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <div className="flex items-center gap-1">
            <button
              aria-label="Diminuir zoom"
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <ZoomOut size={18} />
            </button>
            <span className="min-w-[44px] text-center text-[12px] font-bold" style={{ color: "#2e6b8a" }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              aria-label="Aumentar zoom"
              onClick={() => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(2)))}
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <ZoomIn size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Página anterior"
              disabled={pageNum <= 1}
              onClick={() => setPageNum((n) => Math.max(1, n - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[13px] font-bold" style={{ color: "#0f2535" }}>
              {pageNum} / {numPages}
            </span>
            <button
              aria-label="Próxima página"
              disabled={pageNum >= numPages}
              onClick={() => setPageNum((n) => Math.min(numPages, n + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
