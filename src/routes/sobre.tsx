import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { AdSlot } from "@/components/ad-slot";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — QAP, QRV!" },
      { name: "description", content: "Sobre o app QAP, QRV! e política de privacidade." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader showBrand={false} title="Sobre" subtitle="QAP, QRV!" />

      <main className="px-5 mt-6 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold text-base mb-2">O aplicativo</h2>
          <p className="text-muted-foreground">
            O <strong>QAP, QRV!</strong> reúne ferramentas operacionais úteis para o
            policial militar no dia a dia. Sem cadastro, sem login — basta abrir e usar.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Versão</h2>
          <p className="text-muted-foreground">1.0.0 — MVP</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Política de privacidade</h2>
          <p className="text-muted-foreground">
            O app não coleta dados pessoais. Favoritos e histórico ficam salvos
            apenas no seu dispositivo. Anúncios são exibidos pela rede Google AdMob
            e podem coletar dados conforme a política do Google.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2">Contato</h2>
          <p className="text-muted-foreground">
            Sugestões, ferramentas e parcerias: envie um e-mail para contato@qapqrv.app
          </p>
        </section>
      </main>

      <div className="mt-8 px-4 flex flex-col items-center" aria-label="Publicidade">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Publicidade</p>
        <AdSlot type="banner" />
      </div>

      <BottomNav />
    </div>
  );
}
