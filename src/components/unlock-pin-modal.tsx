import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  vaultGet,
  vaultLockState,
  vaultRegisterAttempt,
  type VaultCredentials,
} from "@/lib/credential-vault";

export type UnlockPinModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlock: (creds: VaultCredentials) => void;
};

export function UnlockPinModal({ open, onOpenChange, onUnlock }: UnlockPinModalProps) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setErr(null);
    const s = vaultLockState();
    setLockSeconds(s.secondsLeft);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setInterval(() => {
      setLockSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [lockSeconds]);

  const handleSubmit = async () => {
    if (lockSeconds > 0) return;
    if (!/^\d{4}$/.test(pin)) {
      setErr("Digite os 4 dígitos do PIN.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const creds = await vaultGet(pin);
      if (!creds) {
        vaultRegisterAttempt(false);
        const s = vaultLockState();
        setLockSeconds(s.secondsLeft);
        setErr(s.secondsLeft > 0 ? `Muitas tentativas. Aguarde ${s.secondsLeft}s.` : "PIN incorreto.");
        setPin("");
        return;
      }
      vaultRegisterAttempt(true);
      onUnlock(creds);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] gap-0 rounded-[20px] p-0">
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div className="flex items-center gap-2">
            <Lock size={18} style={{ color: "var(--primary, #2e6b8a)" }} />
            <DialogTitle className="text-[18px] font-bold" style={{ color: "var(--primary, #2e6b8a)" }}>
              Desbloquear cofre
            </DialogTitle>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "#e8f0f8", color: "#2e6b8a" }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-[13px]" style={{ color: "var(--muted-fg, #5b7a8f)" }}>
            Digite seu PIN de 4 dígitos para preencher CPF e senha automaticamente na intranet.
          </p>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••"
            disabled={lockSeconds > 0 || busy}
            className="w-full rounded-[12px] border-2 bg-white px-3 py-3 text-center text-[24px] font-bold tracking-[0.5em] outline-none"
            style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
          />
          {err && <p className="text-[12px] font-semibold text-red-600">{err}</p>}
        </div>

        <div className="flex gap-2 border-t px-5 py-4" style={{ borderColor: "#e8f0f8" }}>
          <button
            onClick={() => onOpenChange(false)}
            className="h-[44px] flex-1 rounded-[12px] border-2 bg-white font-bold"
            style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || lockSeconds > 0 || pin.length !== 4}
            className="h-[44px] flex-1 rounded-[12px] font-bold text-white disabled:opacity-50"
            style={{ background: "#2e6b8a" }}
          >
            {lockSeconds > 0 ? `Aguarde ${lockSeconds}s` : busy ? "Verificando…" : "Desbloquear"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
