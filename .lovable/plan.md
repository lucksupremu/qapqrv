## O que muda

### 1. Banner de instalação — só quando for prompt real
Hoje o banner aparece em qualquer navegador "permitido" e, quando não há prompt nativo, abre um modal com passo a passo (o "pop-up falso"). Vamos remover esse caminho.

- `usePwaInstall`: voltar `isInstallable` a exigir `canPrompt === true` (ou seja, só quando o navegador disparou `beforeinstallprompt`). Firefox e Safari ficam sem banner.
- `PwaInstallBanner`: remover totalmente o uso de `PwaInstallModal`. O botão "Instalar" só chama `promptInstall()` (prompt nativo real do Chrome/Edge/Brave/Samsung/Opera).
- `PwaInstallModal`: deletar o arquivo (não será mais usado em nenhum lugar).
- Banner do Chrome (`ChromeInstallHintBanner`) continua igual, redirecionando para Firefox/Edge.

### 2. Opção "Instalar app" em Configurações
Novo bloco dentro do `PushSettingsCard` (ou um card novo `PwaInstallCard` ao lado dele em `src/routes/configuracoes.tsx` — prefiro card próprio para não misturar com notificações).

Comportamento:
- Esconde se: rodando no APK nativo, já instalado (`display-mode: standalone`), ou Chrome (que bloqueamos por política).
- Mostra botão "Instalar app":
  - Se `canPrompt` → dispara `promptInstall()`.
  - Caso contrário (Firefox/Safari) → texto curto: "Abra o menu do navegador e toque em *Instalar app* / *Adicionar à tela inicial*." Sem modal.

### 3. Push único pedindo instalação após o 2º acesso

Heurística no cliente (sem nova tabela):
- `src/lib/push-client.ts`: contar acessos em `localStorage` (`app_access_count`, incrementado 1x por dia).
- Quando contagem ≥ 2 **e** `!isInstalled` **e** `!isNative` **e** `!isChromeFamily` **e** ainda não pediu push → mostrar um prompt suave (toast/modal pequeno) sugerindo ativar notificações para "lembrar de instalar". Se aceitar, `subscribeToPush()` registra a inscrição já marcando uma flag `wants_install_push=true` enviada ao backend.

Backend:
- Migração: adicionar coluna `wants_install_push BOOLEAN DEFAULT false` e `install_push_sent_at TIMESTAMPTZ` em `push_subscriptions`. Coluna `platform TEXT` (web/ios/android) para filtrar.
- `register-push` aceita esses campos no payload.
- `send-push-tick` (cron já roda de hora em hora): para cada subscription onde `wants_install_push = true`, `install_push_sent_at IS NULL`, `unsubscribed_at IS NULL` e idade ≥ 1h → envia 1 push:
  - Título: "Instale o QAP, QRV! na tela inicial"
  - Corpo: "Acesso rápido, sem abrir o navegador. Toque para instalar."
  - URL: `/?install=1` (a home detecta o param e dispara `promptInstall()` se disponível, senão mostra instruções curtas).
- Marca `install_push_sent_at = now()` para não repetir nunca mais.

APK e iOS não recebem (filtrado por `platform`).

## Resumo dos arquivos

Editar:
- `src/hooks/use-pwa-install.ts` — voltar regra `canPrompt || isIOS` removendo o `isIOS`.
- `src/components/pwa-install-banner.tsx` — remover modal.
- `src/routes/configuracoes.tsx` — incluir novo card.
- `src/lib/push-client.ts` — contagem de acessos + flag `wants_install_push` + `platform`.
- `src/routes/index.tsx` (ou `__root.tsx`) — prompt suave após 2º acesso; tratar `?install=1`.
- `supabase/functions/register-push/index.ts` — aceitar novos campos.
- `supabase/functions/send-push-tick/index.ts` — enviar push de instalação 1x.

Criar:
- `src/components/pwa-install-card.tsx`
- `src/components/install-push-opt-in.tsx` (prompt suave após 2º acesso)
- Migração: colunas `wants_install_push`, `install_push_sent_at`, `platform` em `push_subscriptions`.

Deletar:
- `src/components/pwa-install-modal.tsx`

## Pontos abertos (assumidos, avise se quiser diferente)
- O "2º acesso" conta dias distintos de abertura, não sessões.
- O prompt suave aparece no máximo 1 vez; se o usuário fechar, não volta.
- Push de instalação só vai para web PWA não instalado, conforme escolhido.