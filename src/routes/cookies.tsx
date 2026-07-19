import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies — QAP, QRV!" },
      { name: "description", content: "Como o QAP, QRV! usa cookies e tecnologias similares, quais tipos utilizamos e como você controla." },
      { property: "og:url", content: "https://miketools.top/cookies" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/cookies" }],
  }),
  component: CookiesScreen,
});

function CookiesScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Política de Cookies" subtitle="Transparência" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Cookies" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5 space-y-4 text-[15px] leading-relaxed text-foreground/85">
        <p>
          Esta política explica como o QAP, QRV! utiliza cookies e tecnologias
          similares no site <strong>miketools.top</strong>. Ao continuar
          navegando, você concorda com este uso, sem prejuízo dos controles
          descritos abaixo.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">O que são cookies</h2>
        <p>
          Cookies são pequenos arquivos armazenados no seu navegador que ajudam
          sites a lembrar preferências e a funcionar corretamente.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Tipos que usamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Essenciais</strong> — necessários para o funcionamento do app (tema, plantões, aviso de privacidade dispensado).</li>
          <li><strong>Preferências</strong> — memorizam ajustes de exibição.</li>
          <li><strong>Publicidade (opcional)</strong> — em páginas editoriais públicas, o Google AdSense pode utilizar cookies próprios para veicular anúncios relevantes.</li>
        </ul>
        <h2 className="pt-2 text-lg font-bold text-foreground">Anúncios (Google AdSense)</h2>
        <p>
          O QAP, QRV! participa do programa Google AdSense em páginas editoriais.
          O Google, como provedor terceirizado, utiliza cookies para veicular
          anúncios no nosso site. O uso do cookie DoubleClick DART permite ao
          Google veicular anúncios com base em visitas anteriores. Os usuários
          podem desativar essa opção em{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            adssettings.google.com
          </a>.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Como controlar</h2>
        <p>
          Você pode bloquear ou excluir cookies nas configurações do seu
          navegador. Alguns recursos do app podem parar de funcionar corretamente
          se você desativar os cookies essenciais.
        </p>
        <h2 className="pt-2 text-lg font-bold text-foreground">Contato</h2>
        <p>Dúvidas sobre esta política? Fale conosco em <a href="mailto:suporte@miketools.top" className="text-primary underline">suporte@miketools.top</a>.</p>
      </main>
    </div>
  );
}
