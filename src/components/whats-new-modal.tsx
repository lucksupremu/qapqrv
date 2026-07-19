// Tela "Novidades" — aparece uma vez após cada atualização.
import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { APP_VERSION, CHANGELOG, type ChangelogEntry } from "@/lib/changelog";
import { isFirstSession } from "@/lib/push-client";

const STORAGE_KEY = "whats_new_seen_version";

function getCurrentEntry(): ChangelogEntry | null {
  return CHANGELOG.find((c) => c.version === APP_VERSION) ?? CHANGELOG[0] ?? null;
}

export function WhatsNewModal() {
  const [open, setOpen] = useState(false);
  const entry = getCurrentEntry();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!entry) return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      // Não mostra na primeira instalação (onboarding cobre).
      if (!seen) {
        window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
        return;
      }
      if (seen !== APP_VERSION) {
        // Aguarda 1.5s pra não competir com outros prompts (push, etc.)
        const t = window.setTimeout(() => setOpen(true), 1500);
        return () => window.clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [entry]);

  const close = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="max-w-[420px] gap-0 rounded-[20px] p-0">
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <DialogTitle className="text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
                Novidades
              </DialogTitle>
              <p className="text-[11px] font-semibold" style={{ color: "#5b7a8f" }}>
                Versão {entry.version} · {entry.date}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#5b7a8f] hover:bg-[#e8f0f8]"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="space-y-2 px-5 py-4">
          {entry.highlights.map((h, i) => (
            <li
              key={i}
              className="rounded-[12px] p-3 text-[13px] leading-relaxed"
              style={{ background: "#f3f7fb", color: "#0f2535" }}
            >
              {h}
            </li>
          ))}
        </ul>
        <div className="border-t border-[#e8f0f8] px-5 py-4">
          <button
            onClick={close}
            className="h-[44px] w-full rounded-[12px] font-bold text-white"
            style={{ background: "#2e6b8a" }}
          >
            Entendi
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
