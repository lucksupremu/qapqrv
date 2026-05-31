# Splash com anúncio na abertura do app

## Objetivo

Mostrar um anúncio em tela cheia toda vez que o app abrir, com countdown e botão "Pular", funcionando tanto no app nativo (Capacitor iOS/Android) quanto na versão web/PWA.

## Comportamento

1. Ao abrir o app (cold start ou retomar do background após >30min), aparece uma tela cheia com:
   - Logo PMESP no topo
   - Espaço do anúncio no centro (banner/imagem ou AdMob)
   - Countdown de 5 segundos no canto superior direito
   - Botão "Pular" que aparece após 5s
2. Após o tempo OU clique em "Pular", redireciona para a home (`/`).
3. Frequência: 1x por sessão (não aparece em navegação interna entre telas).

## Estrutura técnica

### Camada web (funciona já, sem plugin)
- **Nova rota** `src/routes/splash.tsx` — tela cheia com:
  - Estado de countdown (5s → 0)
  - `<div>` placeholder para o anúncio (substituível por AdSense depois)
  - Botão "Pular" habilitado quando countdown chega a 0
  - `navigate({ to: "/" })` ao fim
- **Lógica de exibição** em `src/routes/__root.tsx` (ou novo hook `useSplashGate`):
  - Verifica `sessionStorage.getItem("splash_shown")` 
  - Se não mostrado E rota atual é `/`, redireciona para `/splash`
  - Após splash, marca `sessionStorage.setItem("splash_shown", "1")`
- Funciona em web/PWA sem dependências extras.

### Camada nativa (Capacitor — preparação)
- Adicionar comentário/TODO no `splash.tsx` indicando onde plugar `@capacitor-community/admob` no futuro:
  ```ts
  // TODO nativo: if (Capacitor.isNativePlatform()) { AdMob.showAppOpenAd(...) }
  ```
- **Não instalar AdMob agora** — requer conta AdMob, App ID, configuração em `capacitor.config.ts` e build nativo. Fica como passo separado quando o usuário tiver as credenciais.
- A tela de splash web serve como fallback no nativo até o AdMob ser configurado.

## Arquivos a criar/editar

- **Criar** `src/routes/splash.tsx` — tela de splash com countdown, placeholder de anúncio e botão pular
- **Criar** `src/hooks/use-splash-gate.ts` — hook que decide se mostra splash
- **Editar** `src/routes/__root.tsx` — chamar o gate na montagem
- **Editar** `src/components/ad-slot.tsx` — reaproveitar componente existente para o slot de anúncio do splash (se compatível)

## Fora do escopo (próximos passos quando o usuário quiser)

- Conta Google AdMob + App ID/Ad Unit IDs
- Instalação de `@capacitor-community/admob` e configuração nativa
- Conta Google AdSense + script no `__root.tsx` para a versão web

## Resultado

Ao abrir o app (web ou nativo), o usuário vê uma tela com anúncio por 5s, pode pular e entra na home. Estrutura pronta para plugar AdMob/AdSense reais depois.
