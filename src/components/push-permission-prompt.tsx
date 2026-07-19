import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isNativeApp } from "@/lib/in-app-browser";
import { isFirstSession } from "@/lib/push-client";
import { requestNotificationPermission } from "@/lib/notifications-adapter";

const STORAGE_KEY = "push-prompt-dismissed-v1";

function isPreviewOrIframe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  return host.includes("id-preview--") || host.includes("lovableproject.com");
}

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isFirstSession()) return; // não pedir nada no primeiro boot
    if (isNativeApp()) return; // no APK a permissão é pedida pelo plugin no agendamento
    if (isPreviewOrIframe()) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const enable = async () => {
    setLoading(true);
    try {
      const p = await requestNotificationPermission();
      if (p === "granted") {
        toast.success("Notificações ativadas");
      } else {
        toast.error("Permissão negada — ative nas configurações do navegador");
      }
      localStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-[80px] z-50 mx-auto max-w-[420px] rounded-xl border border-border bg-card p-4 shadow-lg animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Ativar notificações?
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Receba lembretes das suas escalas no horário marcado.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={enable} disabled={loading}>
              {loading ? "Ativando..." : "Ativar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss} disabled={loading}>
              Agora não
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
