
## Objetivo

Na versão web (não-APK), oferecer ao usuário a opção de instalar o app como PWA, tanto no Android quanto no iPhone. A opção aparece em dois lugares:

1. **Banner/modal de boas-vindas** ao entrar pela primeira vez.
2. **Item permanente no menu hambúrguer** (side drawer), sempre acessível.

No APK (Capacitor), nada disso aparece (já está instalado).

## Como funciona em cada plataforma

- **Android / Chrome / Edge**: o navegador dispara o evento `beforeinstallprompt`. Capturamos, e ao clicar em "Instalar" chamamos `prompt()` nativo do navegador. Instalação em 1 toque.
- **iOS / Safari**: não existe API de instalação. Mostramos um modal com instruções visuais: "Toque em Compartilhar (ícone quadrado com seta) → Adicionar à Tela de Início".
- **Desktop**: mesma lógica do Android (Chrome/Edge suportam `beforeinstallprompt`).
- **Já instalado** (`display-mode: standalone` ou `navigator.standalone`): esconde tudo.

## Arquivos a criar

- `src/hooks/use-pwa-install.ts` — hook que:
  - detecta plataforma (Android/iOS/desktop), se está em standalone, e se é APK (usa `isNativeApp()`).
  - captura `beforeinstallprompt` e expõe `canPrompt`, `promptInstall()`.
  - expõe `isIOS`, `isInstalled`, `isNative`, `shouldShow`.
  - persiste dispensa do banner em `localStorage` (`pwa_install_dismissed`).

- `src/components/pwa-install-banner.tsx` — banner discreto que aparece na home (`/`) na primeira visita web:
  - Android/desktop: botão "Instalar app" → chama `promptInstall()`.
  - iOS: botão "Como instalar" → abre o modal de instruções.
  - Botão "Agora não" persiste a dispensa.

- `src/components/pwa-install-modal.tsx` — modal com instruções específicas iOS (Compartilhar → Adicionar à Tela de Início) e Android (passo a passo via menu do navegador, como fallback se `beforeinstallprompt` não disparou).

## Arquivos a alterar

- `src/routes/index.tsx` — renderizar `<PwaInstallBanner />` no topo da home, condicionado a `shouldShow` (web, não-instalado, não-dispensado).
- `src/components/side-drawer.tsx` — adicionar item permanente "Instalar app" no Grupo 3 (acima de "Guia AnyConnect"), oculto quando `isNative` ou `isInstalled`. Ao clicar:
  - se `canPrompt` → `promptInstall()`.
  - senão → abre `PwaInstallModal` com instruções (iOS ou Android fallback).
- `public/manifest.webmanifest` — já existe e está adequado (`display: standalone`, ícones 192/512, theme/background color). Sem mudanças.

## Observações importantes

- **Sem service worker / sem `vite-plugin-pwa`**. O manifest já basta para "Adicionar à Tela de Início" / instalação básica, conforme orientação do projeto (evita problemas de cache no preview iframe).
- O banner é dispensável e não bloqueia a UI.
- Textos em PT-BR, usando os tokens de cor já existentes do design system.
