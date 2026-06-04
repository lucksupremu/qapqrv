Foco: apenas a versão APK (Android via Capacitor). O repositório não contém a pasta `android/` — ela é gerada localmente / no AI Studio com `npx cap add android`. Por isso a solução precisa funcionar **automaticamente** quando o build do APK for feito.

## 1. Ícone do app (robusto e infalível)

Hoje só existem PNGs em `public/` (web/PWA). O Android ignora isso — ele usa `android/app/src/main/res/mipmap-*/ic_launcher*.png`. Por isso o ícone "não funciona" no APK.

Solução: adicionar o gerador oficial do Capacitor para que **um único arquivo de origem** vire todos os tamanhos certos automaticamente.

- Adicionar dependência dev `@capacitor/assets`.
- Criar pasta `resources/` na raiz com:
  - `icon.png` — 1024×1024 (logo "QAP, QRV!" com fundo opaco, sem transparência, área de segurança ~10% nas bordas para o adaptive icon).
  - `icon-foreground.png` — 1024×1024 transparente (só a marca, centralizada, ocupando ~60% do canvas — exigência do adaptive icon do Android).
  - `icon-background.png` — 1024×1024 cor sólida `#0b1733` (combina com o theme/background do manifest).
  - `splash.png` — 2732×2732 com a logo centralizada sobre `#0b1733`.
  - `splash-dark.png` — igual ao splash (mantém o mesmo visual no modo escuro).
- Adicionar script em `package.json`: `"cap:assets": "capacitor-assets generate --android"`.
- Atualizar `android-plugin/README.md` (renomear para `APK-BUILD.md` ou adicionar seção) com o passo a passo definitivo para o AI Studio:
  1. `npm install`
  2. `npm run build`
  3. `npx cap add android` (se ainda não tiver)
  4. `npm run cap:assets` → gera mipmaps, adaptive icon e splash
  5. `npx cap sync android`
  6. Abrir no Android Studio e gerar APK
- O `capacitor.config.ts` ganha um bloco `SplashScreen` para garantir cor de fundo `#0b1733` enquanto a WebView carrega.

Resultado: o ícone do APK passa a ser sempre a logo do app (não mais o robozinho padrão do Capacitor), em todas as densidades e no formato adaptive icon do Android moderno.

## 2. Navegador interno robusto (sem Chrome)

Problema: o Chrome (e o Custom Tabs, que é o Chrome por baixo) está bloqueando o acesso à intranet PMESP. Hoje:
- `src/routes/intranet.tsx` no APK chama `openInAppBrowser(url, { modo: "system" })` → abre **Custom Tabs do Chrome**.
- `src/routes/index.tsx` linha 178 (Correio PMESP) também usa `modo: "system"`.
- `src/lib/in-app-browser.ts` tem um timeout de 22s que, se a página não carregar, **cai para o Custom Tabs (Chrome)** — fallback indesejado.

Solução: forçar sempre a WebView interna do Capacitor (que é um WebView Android puro, não o app Chrome) com User-Agent mobile próprio.

Mudanças em `src/lib/in-app-browser.ts`:
- Tornar `forceMobileUA: true` o **padrão** quando nenhum `modo` é informado.
- Remover o fallback automático para `openSystemBrowser` no timeout. Em vez disso, mostrar/fechar a WebView com um aviso ("Falha ao carregar — ligue a VPN AnyConnect") via evento `browserClosed` — o componente já trata isso.
- Manter `modo: "system"` e `modo: "external"` disponíveis mas só se chamados explicitamente (não vamos mais usar).
- UA continua `Mozilla/5.0 (Linux; Android 13; Mobile) ... Chrome/120 Mobile Safari/537.36` (a string identifica como "Chrome" para o servidor aceitar, mas a engine que renderiza é a WebView do app — não o app Chrome do usuário, então não sofre os bloqueios do Chrome).

Mudanças nas chamadas:
- `src/routes/intranet.tsx`: remover o `useEffect` que redireciona para `system` e volta para `/`. No APK, abrir `openInAppBrowser(url, { titulo, modo: "webview", forceMobileUA: true })` e voltar para `/` (a WebView fica por cima como uma janela nativa). Adicionar `try/catch` com toast de erro.
- `src/routes/index.tsx` linha 178 (Correio PMESP): trocar `modo: "system"` por `modo: "webview", forceMobileUA: true`.
- As outras chamadas sem `modo` continuam funcionando (vão herdar o novo padrão webview+forceMobileUA).

## 3. Popup de aviso do Chrome

Manter como está no web. No APK ele já não aparece (guard `useIsNative()`).

## Resumo dos arquivos alterados

- `package.json` — adicionar `@capacitor/assets` (dev) + script `cap:assets`.
- `capacitor.config.ts` — adicionar plugin `SplashScreen` com `backgroundColor: "#0b1733"`.
- `resources/icon.png`, `resources/icon-foreground.png`, `resources/icon-background.png`, `resources/splash.png`, `resources/splash-dark.png` — novos (gerados via imagegen com a logo).
- `src/lib/in-app-browser.ts` — padrão `forceMobileUA: true`, remover fallback para Custom Tabs.
- `src/routes/intranet.tsx` — abrir intranet sempre na WebView interna no APK.
- `src/routes/index.tsx` linha 178 — trocar Correio PMESP para WebView interna.
- `android-plugin/README.md` — adicionar seção "Build do APK no AI Studio" com passo a passo completo (assets, sync, build).

Nenhuma mudança no web/PWA. Nenhuma mudança em business logic (escalas, notificações, auth).
