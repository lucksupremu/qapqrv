import { useEffect, useState } from "react";
import { KeyRound, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import {
  vaultHas,
  vaultEnabled,
  setVaultEnabled,
  vaultSet,
  vaultClear,
} from "@/lib/credential-vault";

export function CredentialVaultCard() {
  const [has, setHas] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setHas(vaultHas());
    setEnabled(vaultEnabled());
  }, []);

  const refresh = () => {
    setHas(vaultHas());
    setEnabled(vaultEnabled());
  };

  const handleSave = async () => {
    setErr(null);
    if (!/^\d{11}$/.test(cpf.replace(/\D/g, ""))) {
      setErr("CPF deve ter 11 dígitos.");
      return;
    }
    if (senha.length < 4) {
      setErr("Informe a senha da intranet.");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErr("PIN deve ter 4 dígitos.");
      return;
    }
    if (pin !== pin2) {
      setErr("Os PINs não coincidem.");
      return;
    }
    setBusy(true);
    try {
      await vaultSet({ cpf: cpf.replace(/\D/g, ""), senha }, pin);
      setEditing(false);
      setCpf("");
      setSenha("");
      setPin("");
      setPin2("");
      refresh();
      toast.success("Credenciais salvas com segurança no aparelho.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    if (!confirm("Apagar credenciais salvas?")) return;
    vaultClear();
    refresh();
    toast.success("Credenciais apagadas.");
  };

  const toggleEnabled = (v: boolean) => {
    setVaultEnabled(v);
    setEnabled(v);
  };

  return (
    <div
      className="rounded-[16px] border-2 p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border-soft)",
      }}
    >
      <div className="flex items-start gap-2">
        <KeyRound size={20} style={{ color: "var(--primary, #2e6b8a)" }} className="mt-0.5" />
        <div className="flex-1">
          <p className="text-[15px] font-bold" style={{ color: "var(--text-dark)" }}>
            Login automático intranet
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted-fg, #5b7a8f)" }}>
            CPF + senha criptografados no aparelho (AES-GCM). Desbloqueio com PIN
            de 4 dígitos. Nada é enviado para servidor.
          </p>
        </div>
      </div>

      {has && !editing && (
        <div className="mt-3 space-y-2">
          <label className="flex items-center justify-between rounded-[10px] bg-white px-3 py-2">
            <span className="flex items-center gap-2 text-[13px] font-bold" style={{ color: "#0f2535" }}>
              {enabled ? (
                <ShieldCheck size={16} style={{ color: "#166534" }} />
              ) : (
                <ShieldOff size={16} style={{ color: "#5b7a8f" }} />
              )}
              Usar autofill ao abrir intranet
            </span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => toggleEnabled(e.target.checked)}
              className="h-5 w-5 accent-[#2e6b8a]"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 rounded-[10px] py-2 text-[13px] font-bold text-white"
              style={{ background: "#2e6b8a" }}
            >
              Trocar credenciais
            </button>
            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-1 rounded-[10px] border-2 px-3 py-2 text-[13px] font-bold"
              style={{ borderColor: "#fee2e2", color: "#c81d1d", background: "#fff" }}
            >
              <Trash2 size={14} /> Apagar
            </button>
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted-fg, #5b7a8f)" }}>
            ⚠️ Autofill efetivo na intranet requer o app instalado (APK). No
            navegador as credenciais ficam salvas mas não são injetadas no iframe.
          </p>
        </div>
      )}

      {(!has || editing) && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF (só números)"
            className="w-full rounded-[10px] border-2 bg-white px-3 py-2 text-[14px] font-semibold"
            style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
          />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha da intranet"
            className="w-full rounded-[10px] border-2 bg-white px-3 py-2 text-[14px] font-semibold"
            style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="PIN (4 dígitos)"
              className="rounded-[10px] border-2 bg-white px-3 py-2 text-center text-[14px] font-bold tracking-[0.4em]"
              style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="Confirme o PIN"
              className="rounded-[10px] border-2 bg-white px-3 py-2 text-center text-[14px] font-bold tracking-[0.4em]"
              style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
            />
          </div>
          {err && <p className="text-[12px] font-semibold text-red-600">{err}</p>}
          <div className="flex gap-2">
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setErr(null);
                }}
                className="flex-1 rounded-[10px] border-2 bg-white py-2 text-[13px] font-bold"
                style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 rounded-[10px] py-2 text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: "#2e6b8a" }}
            >
              {busy ? "Salvando…" : "Salvar com segurança"}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted-fg, #5b7a8f)" }}>
            Se esquecer o PIN, será necessário cadastrar tudo de novo — não há
            recuperação.
          </p>
        </div>
      )}
    </div>
  );
}
