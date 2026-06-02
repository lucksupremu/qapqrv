// Card de configurações de notificação push.
// Inclui: status de permissão local, opt-in para Web Push remoto, botão de teste.

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import {
  getPermission,
  requestNotificationPermission,
  fireTestNotification,
} from "@/lib/notifications-adapter";
import {
  isSubscribedWebPush,
  isWebPushSupported,
  subscribeWebPush,
  unsubscribeWebPush,
} from "@/lib/web-push-client";
import { sendTestPush } from "@/lib/push.functions";
import { getDeviceId } from "@/lib/device-id";
import { isNativeApp } from "@/lib/in-app-browser";

export function PushSettingsCard() {
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [webPushSupported, setWebPushSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const native = isNativeApp();

  useEffect(() => {
    setPerm(getPermission());
    (async () => {
      setWebPushSupported(await isWebPushSupported());
      setSubscribed(await isSubscribedWebPush());
    })();
  }, []);

  const handleEnableLocal = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === "granted") toast.success("Notificações locais ativadas");
    else toast.error("Permissão negada — ative nas configurações do dispositivo");
  };

  const handleToggleWebPush = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeWebPush();
        setSubscribed(false);
        toast.success("Inscrição cancelada");
      } else {
        const r = await subscribeWebPush();
        if (r.ok) {
          setSubscribed(true);
          toast.success("Inscrito para avisos com app fechado");
        } else {
          toast.error(r.reason || "Falha ao inscrever");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTestLocal = async () => {
    const ok = await fireTestNotification();
    if (ok) toast.success("Notificação local disparada");
    else toast.error("Falha — verifique a permissão");
  };

  const handleTestRemote = async () => {
    setTesting(true);
    try {
      const res = await sendTestPush({ deviceId: getDeviceId() });
      if (res.ok) {
        toast.success(`Push remoto enviado para ${res.sent} dispositivo(s)`);
      } else {
        toast.error(res.error || "Falha ao enviar push");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="rounded-[16px] border-2 bg-white p-4"
      style={{ borderColor: "#2e6b8a" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Bell size={18} style={{ color: "#0c2340" }} />
        <h3 className="text-[15px] font-bold" style={{ color: "#0c2340" }}>
          Notificações de escalas
        </h3>
      </div>

      <div className="space-y-3">
        {/* Notificações locais */}
        <div className="flex items-start gap-3 rounded-[12px] p-3" style={{ background: "#f4f8fb" }}>
          {perm === "granted" ? (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color: "#2e6b8a" }} />
          ) : (
            <BellOff size={20} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: "#0c2340" }}>
              Avisos locais (app aberto / em segundo plano)
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#5b7a8f" }}>
              {perm === "granted"
                ? "Ativo — você receberá lembretes das escalas marcadas."
                : "Necessário para os lembretes funcionarem."}
            </p>
            {perm !== "granted" && (
              <button
                onClick={handleEnableLocal}
                className="mt-2 rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white"
                style={{ background: "#2e6b8a" }}
              >
                Ativar
              </button>
            )}
          </div>
        </div>

        {/* Web Push remoto */}
        {!native && webPushSupported && (
          <div className="flex items-start gap-3 rounded-[12px] p-3" style={{ background: "#f4f8fb" }}>
            {subscribed ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color: "#2e6b8a" }} />
            ) : (
              <BellOff size={20} className="mt-0.5 shrink-0 text-amber-600" />
            )}
            <div className="flex-1">
              <p className="text-[13px] font-bold" style={{ color: "#0c2340" }}>
                Push remoto (web — com aba fechada)
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: "#5b7a8f" }}>
                {subscribed
                  ? "Ativo — você receberá avisos mesmo com o navegador fechado."
                  : "Opcional. Use se quiser receber avisos com o navegador totalmente fechado."}
              </p>
              <button
                onClick={handleToggleWebPush}
                disabled={loading}
                className="mt-2 inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
                style={{ background: subscribed ? "#c81d1d" : "#2e6b8a" }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {subscribed ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        )}

        {native && (
          <div className="rounded-[12px] p-3 text-[12px]" style={{ background: "#e8f4ea", color: "#1b4332" }}>
            App Android nativo detectado — notificações usam o sistema do Android (funcionam com app fechado).
          </div>
        )}

        {/* Testes */}
        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "#e8f0f8" }}>
          <button
            onClick={handleTestLocal}
            className="inline-flex items-center gap-1.5 rounded-[8px] border-2 px-3 py-1.5 text-[12px] font-bold"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            <Send size={14} /> Testar local
          </button>
          {subscribed && !native && (
            <button
              onClick={handleTestRemote}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
              style={{ background: "#0c2340" }}
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Testar push remoto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
