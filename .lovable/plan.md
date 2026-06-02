## Mudanças

### 1. Desativar opção de instalar PWA
- `src/routes/index.tsx`: remover `<PwaInstallBanner />` e o import.
- `src/components/side-drawer.tsx`: remover o botão "Instalar app", o estado/uso de `usePwaInstall`, o `PwaInstallModal` e os imports relacionados.

Os arquivos `pwa-install-banner.tsx`, `pwa-install-modal.tsx` e `use-pwa-install.ts` ficam no projeto (sem uso) para não quebrar nada — podem ser apagados depois se desejar.

### 2. Popup ao entrar avisando sobre o Chrome
- Criar `src/components/browser-warning-modal.tsx`: modal informativo (não-bloqueante) com texto:
  > "O navegador Chrome pode bloquear alguns acessos a recursos da intranet PMESP. Caso encontre erros, tente abrir em outro navegador (ex.: Firefox ou Edge)."
  - Botão "Entendi" fecha o modal.
  - Aparece automaticamente uma vez por usuário (salva flag em `localStorage` chave `browser_warning_dismissed_v1`).
  - Não aparece no APK nativo (usa `useIsNative()` para suprimir).
- Montar o componente em `src/routes/__root.tsx` para garantir que apareça em qualquer rota inicial.