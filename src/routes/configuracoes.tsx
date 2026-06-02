import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PushSettingsCard } from "@/components/push-settings-card";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — QAP, QRV!" },
      {
        name: "description",
        content:
          "Configure notificações push e lembretes para suas escalas dejem e delegada.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center gap-3 px-4 pt-5 pb-4"
        style={{ color: "#0c2340" }}
      >
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white"
          style={{ borderColor: "#2e6b8a", color: "#2e6b8a" }}
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-[20px] font-bold">Configurações</h1>
      </header>

      <main className="space-y-4 px-4 pb-8">
        <PushSettingsCard />

        <div
          className="rounded-[16px] border-2 bg-white p-4 text-[12px]"
          style={{ borderColor: "#e8f0f8", color: "#5b7a8f" }}
        >
          <p className="font-bold" style={{ color: "#0c2340" }}>
            Como funcionam os avisos
          </p>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li>
              Ao marcar uma escala (dejem/delegada) o app agenda automaticamente
              dois lembretes: <strong>1 dia antes às 09:00</strong> e{" "}
              <strong>2 horas antes do início</strong>. Você pode adicionar,
              remover ou editar lembretes no formulário.
            </li>
            <li>
              No app Android, os avisos disparam mesmo com o app fechado (sistema
              nativo).
            </li>
            <li>
              No navegador, ative o push remoto acima para receber avisos com a
              aba fechada.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
