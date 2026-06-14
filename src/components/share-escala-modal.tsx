// Modal de compartilhar escala — gera QR code do link da escala (intranet/app)
// e oferece botão "Compartilhar" via Web Share API quando disponível.

import { useEffect, useState } from "react";
import { Share2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

export function ShareEscalaModal({
  open,
  onClose,
  id,
  url,
  titulo,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  url: string;
  titulo?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: "#0c2340", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [open, url]);

  if (!open) return null;

  const text = `${titulo ?? `Escala ${id}`} — PMESP\n${url}`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo ?? `Escala ${id}`, text, url });
        return;
      }
    } catch {
      /* user cancelou */
      return;
    }
    await navigator.clipboard?.writeText(text);
    toast.success("Link copiado!");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] rounded-[20px] bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold" style={{ color: "#0c2340" }}>
            Compartilhar escala {id}
          </h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code da escala ${id}`}
              width={240}
              height={240}
              className="rounded-lg"
            />
          ) : (
            <div className="h-[240px] w-[240px] animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>

        <p className="mt-3 text-center text-[12px]" style={{ color: "#5b7a8f" }}>
          Aponte a câmera de outro celular para abrir o link da escala.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] border-2 bg-white py-3 text-[13px] font-bold"
            style={{ borderColor: "#e8f0f8", color: "#2e6b8a" }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-3 text-[13px] font-bold text-white"
            style={{ background: "#2e6b8a" }}
          >
            <Share2 size={16} /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
