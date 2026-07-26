
# Rebrand para MIKE TOOLS

Trocar todo o nome visível do app de "QAP, QRV!" para "MIKE TOOLS" e regenerar o ícone/logo com a **mesma arte atual**, apenas substituindo o texto "QAP, QRV!" por "MIKE TOOLS".

## Importante — o que NÃO vai mudar
- **`appId` do Android** (`app.lovable.c4ba12aede4d4739b500bee9ca5bb9e9`) permanece igual. Trocar o `appId` na Play Store cria um app novo do zero (perde usuários, avaliações e histórico de versões). O nome exibido é controlado por `appName`/label, não pelo `appId`.
- Domínios (`miketools.top`, `qapqrv.lovable.app`) e Supabase project ref ficam iguais.
- Versionamento (`versionCode`/`versionName`) continua como está — só sobe o PATCH normalmente na próxima build.

## O que muda

### 1. Ícones e logo (mesma arte, novo texto)
Regenerar com IA, mantendo layout/cores/estilo do ícone atual, apenas trocando o texto central por **MIKE TOOLS**:
- `public/app-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/favicon.ico`
- `public/notif-icon-192.png`, `public/notif-icon-512.png`, `public/notif-badge-72.png`
- `resources/icon.png`, `resources/icon-foreground.png` (a `icon-background.png` fica igual — é só o fundo)
- `resources/splash.png`, `resources/splash-dark.png` (splash com nova wordmark)
- `src/assets/app-logo.png` (logo usada dentro do app)

O workflow de build (`capacitor-assets generate --android`) regenera automaticamente todos os tamanhos Android a partir de `resources/`.

### 2. Configuração do app
- **`capacitor.config.ts`**: `appName: "MIKE TOOLS"` (era `qapqrv`).
- **`public/manifest.webmanifest`**: `name` e `short_name` = `"MIKE TOOLS"`; atualizar `description` e labels dos `shortcuts`/`screenshots`.
- **`index.html`**: `<title>`, meta description, `og:title`, `og:description`, `apple-mobile-web-app-title`.
- **`.github/workflows/build-apk.yml`**: nome dos artefatos/release e comentários (`qapqrv-release.jks` continua com o mesmo nome de arquivo — trocar o nome da keystore quebra a assinatura).

### 3. Componentes e textos visíveis
Substituir a string "QAP, QRV!" (e "QAP,QRV") em todos os locais de UI:
- `src/components/app-header.tsx` (título grande do topo — vira `MIKE TOOLS` sem split de cor, ou mantém `MIKE` + `TOOLS` colorido; ver "Detalhe visual" abaixo)
- `src/components/side-drawer.tsx`, `pwa-install-banner.tsx`, `pwa-install-card.tsx`, `install-confirm-modal.tsx`, `share-app-banner.tsx`, `share-app-nudge.tsx`, `whats-new-modal.tsx`, `browser-warning-modal.tsx`, `privacy-consent.tsx`, `site-footer.tsx`, `bottom-nav.tsx` (se aplicável)
- Rotas: `sobre.tsx`, `contato.tsx`, `privacidade.tsx`, `termos.tsx`, `aviso-legal.tsx`, `cookies.tsx`, `manual.tsx`, `ajuda.tsx`, `faq.tsx`, `blog.tsx`, `anyconnect.tsx`, `splash.tsx`, `onboarding.tsx`, `ferramenta.minha-localizacao.tsx`, `index.tsx`, `inicio.tsx`
- `src/routes/__root.tsx` (head padrão)
- `src/content/artigos.ts`, `src/content/ajuda.ts`, `src/content/faq.ts`, `src/content/ferramentas-info.ts` (menções ao nome do app)
- `src/lib/*`: `push-client.ts`, `review-prompt.ts`, `in-app-browser.ts`, `report-marca.ts`, `escala-ics.ts`, `escala-storage.ts` (títulos, `ORGANIZER`/`PRODID` do .ics, nome exibido em notificações)
- `src/hooks/use-live-location.ts`, `use-local-list.ts` (labels/textos)
- `public/sw.js` (título default de push)
- `public/privacidade.html` (nome nas políticas)

### 4. Backend / Edge Functions
- `supabase/functions/send-broadcast/index.ts` e `supabase/functions/send-push-tick/index.ts`: trocar o `title` default e ORIGIN de exibição para "MIKE TOOLS" (o project ref do Supabase e nomes de funções ficam iguais).

### 5. Plugins Android nativos
Nos arquivos em `android-plugin/` (`AppOpenAdPlugin.kt`, `NativeAdPlugin.kt`, `VpnStatusPlugin.kt`, `InAppWebViewPlugin.kt`, `InAppWebViewActivity.kt`, `WidgetDataPlugin.kt`, `ProximaEscalaWidget.kt`, `install.sh`, `README.md`): trocar apenas **strings visíveis ao usuário** (título do widget, título da activity do WebView, textos de log user-facing). Nomes de classes, packages Kotlin e IDs internos ficam iguais para não quebrar o build.

### 6. Documentação
- `APK-BUILD.md`: substituir "QAP, QRV!" por "MIKE TOOLS" nos textos explicativos (mantendo nomes de arquivos/keystore).

## Detalhe visual do cabeçalho
Hoje `AppHeader` renderiza `QAP, <span text-brand-blue>QRV!</span>` (split de cor). Proposta: `MIKE <span text-brand-blue>TOOLS</span>` — mantém a identidade visual (duas palavras, segunda em azul). Se preferir "MIKE TOOLS" tudo na mesma cor, é só remover o `<span>`.

## Ordem de execução
1. Gerar novo ícone (1024×1024) e nova splash com IA a partir da arte atual, salvando em `resources/` e derivando as versões de `public/`.
2. Atualizar `capacitor.config.ts`, `manifest.webmanifest`, `index.html`.
3. Substituição textual em componentes, rotas, libs, content, sw.js e edge functions.
4. Atualizar textos user-facing dos plugins Kotlin e do `APK-BUILD.md`.
5. Fazer redeploy das edge functions afetadas.

Próxima build no GitHub Actions gera o APK/AAB já com o novo nome e ícone (Play Store atualiza por cima da versão anterior porque o `appId` não mudou).
