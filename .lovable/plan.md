## Diagnóstico

O Chrome/Edge/Brave/Samsung só disparam o evento `beforeinstallprompt` (o que permite o botão "Instalar agora" funcionar com 1 toque) quando, ao carregar a página, encontram:

1. Um `manifest.webmanifest` válido com ícone ≥192 e `display: standalone`. ✅ Já existe.
2. Servido em HTTPS. ✅ OK em produção.
3. Um **service worker com handler de `fetch` já ativo** no escopo `/`. ❌ Falta.

Hoje o `public/sw.js` existe e tem `fetch`, mas ele só é **registrado** dentro de `src/lib/notifications-adapter.ts`, e apenas quando o usuário aceita notificações. Resultado: na maioria dos acessos, o SW nunca registra, o Chrome não considera o app instalável, `beforeinstallprompt` nunca dispara, `canPrompt` fica `false` e o botão cai no toast "Seu navegador não permite instalação automática".

Além disso, o `chrome-install-hint-banner.tsx` ainda diz "Chrome bloqueia a instalação" — informação falsa, herdada da tentativa anterior. Precisa sair.

## Objetivo

Após este plano, abrir o app publicado (`qapqrv.lovable.app` ou domínio) no Chrome/Edge Android/desktop deve resultar em:
- `beforeinstallprompt` capturado automaticamente.
- Card "Instalar app" em Configurações com botão habilitado.
- Toque no botão abre o diálogo nativo "Instalar QAP, QRV!" do próprio sistema.
- Após instalar, card e item de menu somem; ícone vai para a tela inicial.

Firefox Android continua usando o menu nativo "Instalar" (o navegador não expõe API). Safari iOS continua com Compartilhar → Adicionar à Tela de Início. Esses são limites do navegador, não do app — mas não vão aparecer tutoriais inúteis: o card simplesmente não exibirá nada que confunda.

## Mudanças

### 1. Registrar o service worker em produção (essencial)

Criar `src/lib/sw-register.ts`:

- Função `registerAppServiceWorker()` que faz `navigator.serviceWorker.register("/sw.js", { scope: "/" })`.
- Guarda contra ambientes onde o SW quebra ou não deve registrar:
  - `import.meta.env.PROD === false` → sair (dev/Vite).
  - Dentro de iframe (`window.top !== window.self`) → sair.
  - Hostname começa com `id-preview--` / `preview--`, ou termina em `.lovableproject.com`, `.lovableproject-dev.com`, `.beta.lovable.dev` → sair (o próprio `sw.js` já tem kill-switch para esses domínios; não registrar de novo).
  - `?sw=off` na URL → desregistrar SW existente e sair.
  - APK nativo Capacitor (`isNativeApp()`) → sair.
- Em qualquer ambiente "bloqueado", além de não registrar, faz `getRegistration("/")` + `unregister()` para limpar SWs antigos.

Chamar `registerAppServiceWorker()` uma única vez em `src/main.tsx`, logo após `initTheme()`, dentro de um `requestIdleCallback`/`setTimeout(..., 0)` para não atrasar o primeiro paint.

Remover o registro on-demand de `src/lib/notifications-adapter.ts` (linhas 93-95): o SW já vai estar registrado; o adapter só precisa de `navigator.serviceWorker.ready`.

### 2. Limpar o discurso falso sobre Chrome

- `src/components/chrome-install-hint-banner.tsx`: deletar o arquivo e remover qualquer import (verificar `src/routes/index.tsx` e similares). O banner inteiro era baseado na premissa errada.
- `src/hooks/use-pwa-install.ts`:
  - Remover `detectChromeFamily`, `isChromeFamily`, `browserAllowsInstall`.
  - `isInstallable = !isNative && !isInstalled && canPrompt`.
  - `shouldShowBanner` idem.
  - Exportar continua sem `isChromeFamily`.

### 3. Card "Instalar app" — versão final, sem tutorial

`src/components/pwa-install-card.tsx`:
- Mantém o estado atual (chama `promptInstall()` direto no toque).
- Quando `canPrompt === false` e não é iOS, **não renderiza nada** (esconde o card por completo) — assim Firefox/Safari não veem botão inútil e nenhum tutorial passo a passo aparece.
- Exceção iOS: mostra apenas uma linha curta "No iPhone, use Compartilhar → Adicionar à Tela de Início" porque é literalmente o único caminho que existe nesse SO (sem isso o usuário iOS nunca instala). Sem ilustrações nem passo a passo longo.

### 4. Item "Instalar app" no menu lateral

`src/components/side-drawer.tsx`:
- Hoje `grupo3Visible` mostra "Instalar app" sempre que `!isNative && !isInstalled`. Trocar a condição para também exigir `canPrompt || isIOS`, usando o mesmo hook. Em Firefox o item simplesmente não aparece (e o usuário usa o menu do próprio Firefox).

### 5. Banner de instalação no topo da home

`src/components/pwa-install-banner.tsx` já depende de `shouldShowBanner` (que passa a depender só de `canPrompt`). Sem mudança de código, mas o comportamento agora fica correto: aparece exatamente quando o navegador permite 1-toque.

### 6. Sanidade do manifest

Conferir que `public/icon-192.png` e `public/icon-512.png` existem e abrem (HEAD 200). Se algum estiver faltando, o Chrome silenciosamente rejeita instalabilidade. Se faltar, gerar substituto a partir do `apple-touch-icon.png` ou de um asset existente.

## Como o usuário valida

1. Após deploy, abrir `https://qapqrv.lovable.app` no Chrome Android.
2. Aguardar ~2 segundos (tempo do SW ativar).
3. Abrir o menu lateral → "Instalar app" → toca no botão → diálogo nativo do Android aparece imediatamente, sem tutorial.
4. Em Configurações, o card "Instalar app" mostra o mesmo comportamento.
5. Em Firefox Android: card e item de menu não aparecem (usar menu ⋮ do Firefox → "Instalar").
6. Em Safari iOS: card mostra a única linha de instrução do iOS.

## Não-objetivos

- Não alterar comportamento do APK Capacitor.
- Não mexer em push notifications nem em `register-push` / `send-push-tick`.
- Não tentar burlar Firefox/Safari com hacks — esses navegadores não expõem API e nenhuma reescrita resolve isso.
- Não reintroduzir o banner amarelo "Chrome bloqueia".
