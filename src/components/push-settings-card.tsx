// Card de configurações de notificação (apenas locais).

import { useEffect, useState } from "react";
import { Bell, BellOff, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

import {
  getPermission,
  requestNotificationPermission,
  fireTestNotification,
} from "@/lib/notifications-adapter";
import { isNativeApp } from "@/lib/in-app-browser";

export function PushSettingsCard() {
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const native = isNativeApp();

  useEffect(() => {
    setPerm(getPermission());
  }, []);

  const handleEnableLocal = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
    if (p === "granted") toast.success("Notificações ativadas");
    else toast.error("Permissão negada — ative nas configurações do dispositivo");
  };

  const handleTestLocal = async () => {
    const ok = await fireTestNotification();
    if (ok) toast.success("Notificação de teste enviada");
    else toast.error("Falha — verifique a permissão de notificações");
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
        <div className="flex items-start gap-3 rounded-[12px] p-3" style={{ background: "#f4f8fb" }}>
          {perm === "granted" ? (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" style={{ color: "#2e6b8a" }} />
          ) : (
            <BellOff size={20} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div className="flex-1">
            <p className="text-[13px] font-bold" style={{ color: "#0c2340" }}>
              Lembretes das escalas
            </p>
            <p className="mt-0.5 text-[11px]" style={{ color: "#5b7a8f" }}>
              {perm === "granted"
                ? native
                  ? "Ativo — você receberá os avisos no horário, mesmo com o app fechado."
                  : "Ativo — você receberá os avisos enquanto o app estiver aberto ou ao reabri-lo."
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

        {native && (
          <div className="rounded-[12px] p-3 text-[12px]" style={{ background: "#e8f4ea", color: "#1b4332" }}>
            App Android nativo detectado — notificações agendadas no sistema (funcionam com app fechado).
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "#e8f0f8" }}>
          <button
            onClick={handleTestLocal}
            className="inline-flex items-center gap-1.5 rounded-[8px] border-2 px-3 py-1.5 text-[12px] font-bold"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            <Send size={14} /> Testar notificação
          </button>
        </div>
      </div>
    </div>
  );
}
