import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Shield, Trash2 } from "lucide-react";
import {
  clearCredenciais,
  hasCredenciais,
  loadCredenciais,
  saveCredenciais,
  setSessionPin,
} from "@/lib/credenciais";

export const Route = createFileRoute("/credenciais")({
  head: () => ({ meta: [{ title: "Credenciais PMESP — Atividade D" }] }),
  component: CredenciaisScreen,
});

function CredenciaisScreen() {
  const navigate = useNavigate();
  const [existe, setExiste] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [destravado, setDestravado] = useState(false);

  useEffect(() => {
    hasCredenciais().then((v) => {
      setExiste(v);
      setCarregado(true);
    });
  }, []);

  const destravar = async () => {
    if (pin.length < 4) return toast.error("PIN deve ter 4 dígitos.");
    const cred = await loadCredenciais(pin);
    if (!cred) return toast.error("PIN incorreto.");
    setUsuario(cred.usuario);
    setSenha(cred.senha);
    setDestravado(true);
    setSessionPin(pin);
    toast.success("Desbloqueado.");
  };

  const salvar = async () => {
    if (!usuario.trim() || !senha) return toast.error("Preencha usuário e senha.");
    const pinFinal = existe ? pin : pin;
    if (pinFinal.length < 4) return toast.error("PIN deve ter 4 dígitos.");
    if (!existe && pinFinal !== pin2)
      return toast.error("Os PINs não coincidem.");
    await saveCredenciais({ usuario: usuario.trim(), senha }, pinFinal);
    setSessionPin(pinFinal);
    setExiste(true);
    setDestravado(true);
    toast.success("Credenciais salvas neste aparelho.");
  };

  const apagar = async () => {
    if (!confirm("Apagar credenciais salvas?")) return;
    await clearCredenciais();
    setExiste(false);
    setDestravado(false);
    setUsuario("");
    setSenha("");
    setPin("");
    setPin2("");
    toast.success("Credenciais apagadas.");
  };

  if (!carregado) return null;

  const podeEditar = !existe || destravado;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--bg)" }}>
      <header className="flex items-center gap-2 px-3 py-3">
        <button
          aria-label="Voltar"
          onClick={() => navigate({ to: "/" })}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "#e8f0f8", color: "#2e6b8a" }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-bold" style={{ color: "#2e6b8a" }}>
          Credenciais PMESP
        </h1>
        <span className="h-10 w-10" />
      </header>

      <section
        className="mx-4 mt-2 flex items-start gap-3 rounded-[16px] p-4"
        style={{ background: "#e8f0f8", color: "#2e6b8a" }}
      >
        <Shield size={20} className="mt-0.5 shrink-0" />
        <p className="text-[13px] leading-relaxed">
          Seu usuário e senha ficam <b>somente neste aparelho</b>, criptografados
          com seu PIN. Nada é enviado para servidores externos. O preenchimento
          automático funciona dentro do app instalado (Android).
        </p>
      </section>

      <section className="mx-4 mt-4 rounded-[20px] bg-[#ffffff] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
        {existe && !destravado && (
          <>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
              PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-[12px] border-2 px-4 py-3 text-center text-[22px] font-bold tracking-[0.4em] outline-none"
              style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
              placeholder="••••"
            />
            <button
              onClick={destravar}
              className="mt-4 h-12 w-full rounded-[14px] font-bold text-white"
              style={{ background: "#2e6b8a" }}
            >
              Desbloquear
            </button>
            <button
              onClick={apagar}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border-2 font-bold"
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
            >
              <Trash2 size={16} /> Apagar credenciais
            </button>
          </>
        )}

        {podeEditar && (
          <>
            <label className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
              Usuário PMESP
            </label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-[12px] border-2 px-4 py-3 text-[16px] outline-none"
              style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
              placeholder="Ex.: 123456-7"
            />

            <label className="mt-4 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="off"
                className="mt-1 w-full rounded-[12px] border-2 px-4 py-3 pr-12 text-[16px] outline-none"
                style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
              />
              <button
                aria-label="Mostrar senha"
                onClick={() => setShowSenha((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5b7a8f]"
                type="button"
              >
                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!existe && (
              <>
                <label className="mt-4 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
                  Criar PIN (4 dígitos)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-[12px] border-2 px-4 py-3 text-center text-[22px] font-bold tracking-[0.4em] outline-none"
                  style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
                  placeholder="••••"
                />
                <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#2e6b8a" }}>
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-[12px] border-2 px-4 py-3 text-center text-[22px] font-bold tracking-[0.4em] outline-none"
                  style={{ borderColor: "#2e6b8a", color: "#0f2535" }}
                  placeholder="••••"
                />
              </>
            )}

            <button
              onClick={salvar}
              className="mt-5 h-12 w-full rounded-[14px] font-bold text-white"
              style={{ background: "#2e6b8a" }}
            >
              Salvar credenciais
            </button>

            {existe && (
              <button
                onClick={apagar}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border-2 font-bold"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
              >
                <Trash2 size={16} /> Apagar credenciais
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
