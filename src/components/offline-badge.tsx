import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Pílula "📴 Offline" exibida quando `navigator.onLine === false`. */
export function OfflineBadge({ className = "" }: { className?: string }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
      style={{ background: "#fef3c7", color: "#92400e" }}
      aria-label="Sem conexão"
    >
      <WifiOff size={12} />
      Offline
    </span>
  );
}
