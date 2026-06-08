// Pill de status da VPN no header.
// - APK Android: usa plugin nativo (VpnStatusPlugin) — polling 5s.
// - Web: oculto (não dá pra detectar VPN no navegador).
// Toque → leva pra /anyconnect.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { isNativeVpnAvailable, isVpnActive } from "@/lib/vpn-status";

export function VpnIndicator() {
  const [available] = useState<boolean>(() => isNativeVpnAvailable());
  const [active, setActive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!available) return;
    let mounted = true;
    const tick = async () => {
      const v = await isVpnActive();
      if (mounted) setActive(v);
    };
    void tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [available]);

  if (!available) return null;

  const on = active === true;
  const label = on ? "VPN" : "VPN OFF";
  const bg = on ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)";
  const fg = on ? "#22c55e" : "#ef4444";

  return (
    <Link
      to="/anyconnect"
      aria-label={on ? "VPN ativa — toque para ver guia" : "VPN inativa — toque para configurar"}
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-[0.96]"
      style={{ background: bg, color: fg }}
    >
      {on ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
      {label}
    </Link>
  );
}
