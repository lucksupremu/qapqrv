## Plano: Deep Link direto para AnyConnect

### Contexto
Hoje o botão "Abrir AnyConnect" na tela inicial navega para a rota `/anyconnect`, que contém um guia de configuração e um botão que tenta `window.location.href = "anyconnect://"`. O usuário quer pular essa etapa intermediária e abrir o app diretamente (ou redirecionar para a loja se não estiver instalado).

### O que será feito

1. **Criar utilitário de deep link** (`src/lib/open-anyconnect.ts`):
   - Detecta a plataforma via `navigator.userAgent` (Android / iOS / desktop)
   - **Android**: usa Intent URL `intent://#Intent;scheme=anyconnect;package=com.cisco.anyconnect.vpn.android.avf;S.browser_fallback_url=...;end` que abre o app se instalado ou cai na Play Store automaticamente
   - **iOS**: tenta `anyconnect://` e, após um timeout curto (1.5s), redireciona para a App Store como fallback
   - **Desktop**: exibe um toast informativo orientando a instalar o app no celular

2. **Alterar o botão na Home** (`src/routes/index.tsx`):
   - O botão principal "Abrir AnyConnect" chamará a função do utilitário em vez de `navigate({ to: "/anyconnect" })`
   - O botão de info (?) continua navegando para `/anyconnect` para quem quer ver o guia de configuração
   - O link no aviso de VPN também será atualizado para usar o utilitário

3. **Atualizar a página de guia** (`src/routes/anyconnect.tsx`):
   - Substituir o `abrirAnyConnect` local pela função do utilitário compartilhado

### Detalhes técnicos

- Package Android: `com.cisco.anyconnect.vpn.android.avf`
- Play Store: `https://play.google.com/store/apps/details?id=com.cisco.anyconnect.vpn.android.avf`
- App Store: `https://apps.apple.com/us/app/cisco-secure-client/id1135064690`
- URL scheme: `anyconnect://`
- A função será envolvida em `if (typeof window !== 'undefined')` para não quebrar SSR

### Resultado esperado
Ao tocar em "Abrir AnyConnect" na tela inicial, o usuário será levado diretamente ao app (se instalado) ou à loja de apps do seu sistema. A página de guia continua acessível via botão de informações.