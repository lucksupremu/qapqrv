import { Link } from "@tanstack/react-router";
import { ShieldAlert, WifiOff, ServerCrash, AlertCircle, RefreshCw } from "lucide-react";
import { describeNetworkError, type NetworkErrorKind } from "@/lib/network-error";

type Props = {
  kind: NetworkErrorKind;
  onRetry?: () => void;
  showVpnAction?: boolean;
};

const ICONS: Record<NetworkErrorKind, typeof ShieldAlert> = {
  "vpn-off": ShieldAlert,
  offline: WifiOff,
  "server-down": ServerCrash,
  unknown: AlertCircle,
};

export function NetworkErrorState({ kind, onRetry, showVpnAction = true }: Props) {
  const info = describeNetworkError(kind);
  const Icon = ICONS[kind];

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ background: "var(--surface)" }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: "var(--surface-2)", color: "var(--primary)" }}
      >
        <Icon size={36} aria-hidden />
      </div>
      <p className="text-[18px] font-bold" style={{ color: "var(--primary)" }}>
        {info.title}
      </p>
      <p className="max-w-xs text-[14px]" style={{ color: "var(--muted-fg)" }}>
        {info.message}
      </p>

      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        {kind === "vpn-off" && showVpnAction && (
          <Link
            to="/anyconnect"
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] font-bold text-white active:scale-[0.99]"
            style={{ background: "var(--primary)" }}
          >
            Abrir guia AnyConnect
          </Link>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] border-2 font-bold active:scale-[0.99]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--primary)",
              color: "var(--primary)",
            }}
          >
            <RefreshCw size={16} />
            Tentar de novo
          </button>
        )}
      </div>
    </div>
  );
}
