import { useEffect, useRef, useState } from "react";
import { Lock, X } from "lucide-react";

type Props = {
  open: boolean;
  modo: "definir" | "informar";
  onClose: () => void;
  onConfirm: (pin: string) => void | Promise<void>;
};

export function PinModal({ open, modo, onClose, onConfirm }: Props) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setErr(null);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const submit = async () => {
    if (pin.length < 4) {
      setErr("Digite os 4 dígitos do PIN.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await onConfirm(pin);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao validar PIN.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-[20px] bg-[#141432] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "#1e1e3a", color: "#4f46e5" }}
            >
              <Lock size={18} />
            </div>
            <h3 className="text-[16px] font-bold" style={{ color: "#4f46e5" }}>
              {modo === "definir" ? "Definir PIN" : "Digite seu PIN"}
            </h3>
          </div>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-1 text-[#8b8db5] hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3 text-[13px]" style={{ color: "#8b8db5" }}>
          {modo === "definir"
            ? "Crie um PIN de 4 dígitos para proteger suas credenciais. Você precisará dele para abrir a intranet."
            : "Informe o PIN para desbloquear suas credenciais salvas."}
        </p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mt-4 w-full rounded-[12px] border-2 px-4 py-3 text-center text-[24px] font-bold tracking-[0.5em] outline-none"
          style={{ borderColor: "#4f46e5", color: "#e8eaf6" }}
          placeholder="••••"
        />

        {err && (
          <p className="mt-2 text-[13px] font-semibold text-red-600">{err}</p>
        )}

        <button
          onClick={submit}
          disabled={loading || pin.length < 4}
          className="mt-4 h-12 w-full rounded-[14px] font-bold text-white disabled:opacity-60"
          style={{ background: "#4f46e5" }}
        >
          {loading ? "Validando..." : modo === "definir" ? "Salvar PIN" : "Desbloquear"}
        </button>
      </div>
    </div>
  );
}
