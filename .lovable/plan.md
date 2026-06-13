# Instalação do app — liberar para todos, exceto Chrome

## Situação atual

- `src/hooks/use-pwa-install.ts` já bloqueia a família Chromium (Chrome, Edge, Brave, Opera, Samsung Internet, CriOS) de receber o banner de instalação. Firefox e Safari já são tratados como instaláveis.
- `src/components/pwa-install-banner.tsx` existe, mas **não está montado em lugar nenhum** — por isso ninguém vê o convite de instalar hoje.
- Não há nenhuma orientação visível para quem está no Chrome.

## O que vou fazer

### 1. Mostrar o banner de instalação para navegadores permitidos

Montar `<PwaInstallBanner />` na Home (`src/routes/index.tsx`), logo abaixo do header — mesma posição onde já existe espaço para faixas informativas. O banner só aparece para Firefox/Safari/etc. (lógica já existente).

### 2. Criar um novo banner para usuários do Chrome

Novo componente `src/components/chrome-install-hint-banner.tsx`:

- Aparece somente quando: navegador é Chromium, não está no app nativo, e ainda não está instalado.
- Visual claro tipo "dica" (ícone `Info`, cor âmbar, igual ao padrão do projeto), com:
  - Texto curto: *"O Chrome bloqueia a instalação do QAP, QRV!. Para instalar como app, abra este endereço no Firefox ou Edge."*
  - Botão **"Copiar link"** → copia `window.location.origin` para a área de transferência (com toast de confirmação via `sonner`).
  - Botão **"Abrir no Firefox"** → tenta deep link `firefox://open-url?url=...` (Android/iOS). Em desktop, mostra instrução de colar no navegador.
  - Botão **X** para dispensar, persistido em `localStorage` (`chrome_install_hint_dismissed_at`, expira em 7 dias como o outro banner).
- Não aparece no APK nativo (`useIsNative`).

### 3. Pequeno ajuste no hook

Em `use-pwa-install.ts`, expor `isChromeFamily` no retorno para o novo banner poder consumi-lo sem duplicar a detecção.

### 4. Montagem

Em `src/routes/index.tsx`, abaixo do header:

```tsx
<PwaInstallBanner />
<ChromeInstallHintBanner />
```

Só um dos dois aparece por vez (mutuamente exclusivos pela detecção de navegador).

## Arquivos afetados

- `src/hooks/use-pwa-install.ts` — expor `isChromeFamily`.
- `src/components/chrome-install-hint-banner.tsx` — **novo**.
- `src/components/pwa-install-banner.tsx` — sem mudança de lógica.
- `src/routes/index.tsx` — montar os dois banners.

## Fora do escopo

- Não vou mexer em service worker, manifest ou ícones — a parte de PWA instalável já está configurada (`public/manifest.webmanifest`, ícones em `public/`).
- Não vou tocar no APK Capacitor nem no `BrowserWarningModal` existente (esse continua avisando sobre acesso à intranet, que é assunto diferente).
