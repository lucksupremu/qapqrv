# Sistema de notificações para escalas dejem/delegada

## O que será construído

Sistema em duas camadas que cobre todos os cenários:

| Cenário | Tecnologia | Funciona com app fechado? |
|---|---|---|
| Android APK (Capacitor) | `@capacitor/local-notifications` | Sim, nativo, garantido |
| Web/PWA — aba aberta | Notification API + setTimeout (já existe) | Sim |
| Web/PWA — aba fechada | Service Worker + Web Push (VAPID) | Sim |
| Push remoto (avisos não programados, ex: aviso administrativo) | Backend TanStack + FCM + Web Push | Sim, em todos |

## Etapa 1 — Notificações locais (funciona imediatamente, sem credenciais)

### 1.1 Capacitor LocalNotifications (Android APK)
- `bun add @capacitor/local-notifications`
- Estender `src/lib/notifications-adapter.ts`:
  - Detectar `Capacitor.isNativePlatform()` e usar `LocalNotifications.schedule()` quando nativo, com fallback web atual
  - `cancelForMarca` → `LocalNotifications.cancel()` quando nativo
  - Hash determinístico `marcaId:index` → `number` (id do plugin é numérico)
  - Pedir permissão nativa via `LocalNotifications.requestPermissions()`

### 1.2 Disparos automáticos padrão
Ao salvar uma marca em `marcar-modal.tsx`, gerar automaticamente DOIS lembretes (substituindo o atual default único):
- **1 dia antes às 09:00** (já existe)
- **2 horas antes do início da escala** (novo)

Usuário ainda pode adicionar/remover/editar manualmente. A função `buildAutoReminders(dataISO)` centralizará a regra.

### 1.3 Reagendamento global
- `rehydrateReminders()` já é chamado no boot — reforçar em `__root.tsx` para rearmar timers ao abrir a aba e ao voltar do background (`visibilitychange`)
- No nativo, o próprio plugin persiste — não precisa de rehydrate

## Etapa 2 — Service Worker + Web Push (web em background)

### 2.1 Service Worker manual (sem `vite-plugin-pwa`)
Conforme orientação Lovable, NÃO usar `vite-plugin-pwa` (interfere no preview). Em vez disso:
- Criar `public/sw.js` manual minimalista, registrado apenas em produção e fora de iframe (`window.self === window.top` e hostname ≠ preview Lovable)
- Handlers: `push` (mostra notificação) e `notificationclick` (abre a rota da escala)
- Estratégia: SW só lida com push, não cacheia HTML (evita conteúdo stale)
- Kill-switch já documentado caso seja preciso remover

### 2.2 Web Push (VAPID)
- `bun add web-push` (server-side)
- Server functions em `src/lib/push.functions.ts`:
  - `subscribeWebPush({ subscription })` — salva inscrição em tabela `push_subscriptions`
  - `unsubscribeWebPush({ endpoint })`
- Cliente: `src/lib/web-push-client.ts` — pede permissão, gera `PushSubscription` com `applicationServerKey = VAPID_PUBLIC_KEY`, envia para servidor

### 2.3 FCM para Android
- `bun add @capacitor/push-notifications`
- `src/lib/fcm-client.ts` — registra token FCM e envia para servidor (`registerFcmToken`)
- Requer `google-services.json` no projeto Android (usuário fornece após criar projeto Firebase)

## Etapa 3 — Backend (Lovable Cloud)

### 3.1 Banco
Tabela `push_subscriptions`:
- `id uuid`, `user_id uuid` (nullable — app é local-first), `device_id text`, `platform text` (`web|android`), `endpoint text`, `p256dh text`, `auth text`, `fcm_token text`, `created_at`
- RLS: por enquanto inserção pública (app local-first); leitura só `service_role`
- GRANTs explícitos (`anon insert`, `service_role all`)

Tabela `scheduled_pushes` (para avisos programados pelo servidor — backup do local):
- `id`, `device_id`, `marca_id`, `title`, `body`, `send_at`, `sent_at`, `payload jsonb`

### 3.2 Server functions / routes
- `src/routes/api/public/push/send.ts` — endpoint chamado por `pg_cron` a cada minuto, busca `scheduled_pushes` com `send_at <= now() AND sent_at IS NULL`, dispara via `web-push` (web) ou HTTP v1 do FCM (Android), marca enviado
- `src/lib/push.functions.ts` — `schedulePushForMarca({ marcaId, deviceId, reminders[] })` (espelha agendamento local no servidor; opcional/redundância)
- `pg_cron` rodando o endpoint a cada minuto

### 3.3 Segredos necessários (pedirei via `add_secret` no build)
- `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (gero via `web-push generate-vapid-keys`)
- `VAPID_SUBJECT` (e-mail mailto)
- `FCM_SERVICE_ACCOUNT_JSON` (JSON do service account Firebase para HTTP v1)
- `VITE_VAPID_PUBLIC_KEY` (pública, no client — exposta em build)

## Etapa 4 — Ícone M para notificações

Gerar 3 PNGs (`imagegen` premium, fundo transparente):
- `public/notif-icon-192.png` — círculo `#0c2340`, gradient sutil para `#2e6b8a`, letra "M" branca bold serif, 192×192 (Android FCM `notification.icon`)
- `public/notif-icon-512.png` — versão 512 (web push `icon`)
- `public/notif-badge-72.png` — versão monocromática branca sem fundo (Android `badge`)

Atualizar `notifications-adapter.ts` para usar `/notif-icon-192.png` no lugar do atual `/favicon.ico`. SW e payload remoto também referenciam estes caminhos.

## Etapa 5 — UI

- Em `marcar-modal.tsx`: trocar o botão único "Ativar notificações push" por status detalhado (Local OK, Push remoto OK, etc.) — só pede permissão remota se o usuário ativar opt-in
- Tela de configurações em `/configuracoes` (ou dentro de `/favoritos`/menu) com switch "Receber avisos quando o app estiver fechado" — dispara o fluxo de subscription (Web Push ou FCM)
- Botão "Testar notificação" para validar fim-a-fim

## Detalhes técnicos

- **Idempotência de IDs nativos**: hash `marcaId:index` → `parseInt(sha1.slice(0,8),16) % 2_000_000_000`. Mantém mapa reverso em `localStorage` para cancelamento.
- **Capacitor sync**: após `bun add` dos plugins, rodar `npx cap sync` (documentar no README — usuário precisa rebuildar o APK)
- **SSR safety**: todo código de notificação roda só no client (`typeof window !== "undefined"`); `web-push` só em `*.server.ts`
- **Build:dev**: o registro do SW é guardado por `import.meta.env.PROD` para não quebrar preview
- **Preview Lovable**: notificações locais funcionam; web push remoto também (Lovable serve em HTTPS), mas SW só registra fora de iframe — testar em aba dedicada

## O que precisarei do usuário

1. **Para Web Push funcionar (Etapa 2.2 + 3)**: vou gerar as VAPID keys e pedir para adicionar como segredos
2. **Para FCM/Android remoto (Etapa 2.3)**: usuário precisa criar projeto no [Firebase Console](https://console.firebase.google.com/), baixar `google-services.json` e o JSON do service account. Sem isso, **as notificações locais Android continuam funcionando 100%** — só o "push remoto não programado" no Android fica indisponível.

## Ordem de execução

1. Etapa 4 (ícone) + Etapa 1 (locais + auto-reminders) — entrega valor imediato sem credenciais
2. Etapa 3.1 (tabelas) + Etapa 2.1 (service worker) + VAPID setup → Web Push funcional
3. Solicitar credenciais Firebase ao usuário → ativar FCM Android
4. Etapa 3.2 (cron + endpoint de envio) → push remoto programado completo
