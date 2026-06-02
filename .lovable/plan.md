## Diagnóstico

1. **"Notificação genérica PQRV sem informação"**: o Chrome Android mostra um aviso fallback ("este site foi atualizado em segundo plano") com o nome do site (`qapqrv...`) sempre que recebe um push remoto cujo Service Worker **não consegue chamar `showNotification` com payload visível**. Isso acontece quando o SW não tem o payload decodificado corretamente ou quando a versão do SW em cache no celular ainda é a antiga. Como você não quer push remoto, a forma mais limpa de eliminar isso de vez é desligar a inscrição remota e remover toda a infraestrutura.

2. **"Testar local não funciona"**: a função usa `new Notification(...)` diretamente. No **Chrome Android** esse construtor é bloqueado — só funciona via `ServiceWorkerRegistration.showNotification`. Por isso o teste local não aparece no celular (só no desktop). Vai ser corrigido usando o SW para disparar a notificação no web, e o plugin Capacitor no APK.

## Escopo da mudança

Manter apenas **notificações locais** (1 dia antes às 09:00 + 2 h antes da escala), agendadas no próprio dispositivo:
- **APK Android (Capacitor)**: `@capacitor/local-notifications` — já persiste com app fechado.
- **Web/PWA**: `setTimeout` + `registration.showNotification` (via Service Worker), com fila em `localStorage` que é re-armada no boot.

Remover por completo o caminho de push remoto (Edge Function `send-push`, tabela `scheduled_pushes`, tabela `push_subscriptions`, cliente Web Push e secrets VAPID).

## Mudanças

### Frontend
1. **`src/lib/notifications-adapter.ts`**
   - Trocar `fireNow()` e `fireTestNotification()` para usar `navigator.serviceWorker.ready` → `registration.showNotification(title, opts)` no caminho web (com fallback para `new Notification` apenas no desktop quando o SW não está disponível).
   - Garantir que o SW seja registrado uma vez no boot do app web (chamada centralizada em `main.tsx`/`__root.tsx`), fora do preview/iframe.

2. **`public/sw.js`**
   - Remover o handler `push` (não há mais push remoto).
   - Manter `install`/`activate` mínimos e o `notificationclick` (para abrir `/calendario`).
   - Adicionar `message` handler para a página pedir ao SW que dispare uma notificação imediata (usado pelo "Testar local" no Android web).

3. **`src/components/push-settings-card.tsx`**
   - Remover seção "Push remoto (web)" e o botão "Testar push remoto".
   - Manter apenas:
     - Status da permissão local + botão "Ativar".
     - Botão "Testar local" (agora funcional no Android web).
   - Tirar imports de `web-push-client` e `push.functions`.

4. **`src/components/push-permission-prompt.tsx`**
   - Trocar `subscribeWebPush()` por `requestNotificationPermission()` do adapter.
   - Sem chamada a tabelas remotas; apenas pede a permissão do navegador.

5. **`src/components/marcar-modal.tsx`** e **`src/routes/calendario.tsx`**
   - Remover chamadas a `schedulePushesForMarca` / `cancelScheduledPushesForMarca`.
   - Manter apenas `scheduleRemindersForMarca` / `cancelForMarca` (já usados, são locais).

6. **Arquivos a deletar (sem mais uso)**
   - `src/lib/web-push-client.ts`
   - `src/lib/push.functions.ts`
   - `src/lib/push-config.ts` (apenas constante VAPID; ícones movidos para `notifications-adapter` ou um novo `notif-assets.ts`)
   - `supabase/functions/send-push/index.ts`

### Backend
7. **Migração SQL**
   - `DROP TABLE public.push_subscriptions`
   - `DROP TABLE public.scheduled_pushes`
   - Desagendar o cron job `send-push-tick` no `pg_cron`.

8. **Secrets**
   - Pedir para você remover (opcional, ficam ociosos): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Limitações importantes (web, sem APK)

- **App totalmente fechado no navegador**: sem push remoto, o `setTimeout` é perdido quando o navegador é encerrado. A fila em `localStorage` é re-armada **quando o usuário reabre o app**. Se ele reabrir depois do horário-alvo, a notificação dispara nesse momento (catch-up).
- **APK Android**: 100% confiável com app fechado, porque o plugin nativo agenda no AlarmManager do Android.
- Resumindo: **no APK funciona com app fechado; no navegador web só funciona com o site aberto em alguma aba ou reaberto a tempo**. Confirme se isso atende seu requisito antes de eu remover o remoto.

## Como o "Testar local" vai funcionar depois

- **APK**: agenda via Capacitor para daqui a 1 segundo → notificação real do Android.
- **Web (mobile/desktop)**: envia `postMessage` para o Service Worker, que chama `showNotification("Teste de notificação", {body, icon, tag})`. Funciona inclusive no Chrome Android (que bloqueia o construtor direto).
