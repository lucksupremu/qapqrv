# Push de reengajamento + plano regular de notificações

## Situação atual

- Existe `notifications-adapter.ts` que faz **notificações locais** (web `setTimeout` + `LocalNotifications` no APK). Não envia push remoto e não sabe se o usuário está inativo.
- `PushSettingsCard` só pede permissão e dispara teste local.
- VAPID keys já estão nos secrets do backend (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Migrações anteriores criaram `push_subscriptions` e `scheduled_pushes`, mas a última migração **apagou as duas tabelas** e o cron. Hoje não há nada rodando no servidor.

Para notificar usuários inativos eu preciso de push **remoto** (Web Push API + service worker `push` listener), porque local notifications dependem do app estar aberto/instalado e ativo. APK Android atualmente não tem FCM configurado — então o reengajamento via push remoto vai cobrir **só PWA/web** nessa primeira versão. Os usuários do APK continuam recebendo lembretes locais.

## O que vou construir

### 1. Banco (`supabase/migrations/...`)

Recriar e ampliar:

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,           -- id estável no localStorage do cliente
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  locale text,
  tz text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),  -- atualizado a cada abertura
  last_notified_at timestamptz,                      -- evita spam
  inactivity_stage smallint not null default 0,     -- 0 nenhum, 1 enviado 3d, 2 enviado 14d, 3 enviado 30d
  unsubscribed_at timestamptz
);

create table public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,        -- ex: "weekly-tip", "monthly-news"
  title text not null,
  body text not null,
  url text default '/',
  schedule_cron text not null,      -- ex: "0 12 * * 1" (toda segunda 12h UTC)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.push_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.push_campaigns(id) on delete cascade,
  device_id text not null,
  sent_at timestamptz not null default now(),
  success boolean not null,
  error text,
  unique (campaign_id, device_id, sent_at)
);
```

GRANTs + RLS:
- `push_subscriptions`: insert/update permitido a `anon` (precisa funcionar sem login), select bloqueado. Edge functions usam `service_role`.
- `push_campaigns` e `push_campaign_sends`: somente `service_role`. Sem acesso para `anon`/`authenticated`.

Seed inicial de duas campanhas regulares (podem ser editadas direto no DB):
- `weekly-escala-check` — "Confira sua escala da semana", segunda-feira 09h (horário Brasília → cron em UTC).
- `monthly-news` — "Novidades do mês no QAP, QRV!", dia 1 às 10h.

### 2. Edge function `register-push` (`supabase/functions/register-push/index.ts`)

POST que recebe `{ device_id, subscription, user_agent, locale, tz }` e faz upsert na tabela. Também serve para **heartbeat**: aceita `{ device_id, heartbeat: true }` sem subscription, e nesse caso só atualiza `last_seen_at`. Reseta `inactivity_stage = 0` e limpa `unsubscribed_at`.

### 3. Edge function `send-push-tick` (`supabase/functions/send-push-tick/index.ts`)

Chamada pelo cron a cada hora. Em uma execução:

a) **Reengajamento por inatividade** — busca subscriptions onde `unsubscribed_at IS NULL` e (`last_notified_at IS NULL OR last_notified_at < now() - 3 days`):
   - `last_seen_at < now() - 30 days` E `inactivity_stage < 3` → mensagem "Faz tempo! Quer voltar a acompanhar suas escalas?" → `stage = 3`.
   - `last_seen_at < now() - 14 days` E `stage < 2` → "Sentimos sua falta. Tem novidade no QAP, QRV!" → `stage = 2`.
   - `last_seen_at < now() - 3 days` E `stage < 1` → "Já conferiu sua escala hoje?" → `stage = 1`.

b) **Campanhas regulares** — para cada `push_campaigns.active = true`, calcula próxima execução do `schedule_cron` (lib `npm:cron-parser`); se a última execução é >= 1h atrás e ainda não foi enviada (`push_campaign_sends` não tem registro pra essa janela), envia pra todos os assinantes ativos.

Envia via Web Push padrão (`npm:web-push@3`) usando os secrets VAPID. Resposta 404/410 marca `unsubscribed_at`.

### 4. Cron (uma migração separada com SQL "user-data")

`pg_cron` + `pg_net`, executa `send-push-tick` a cada hora:

```sql
select cron.schedule(
  'push-tick',
  '0 * * * *',
  $$ select net.http_post(...send-push-tick...) $$
);
```

### 5. Cliente

- **`src/lib/push-client.ts` (novo)** — gera/lê `device_id` no localStorage, pede permissão, faz `pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC })`, chama `register-push`. Chave VAPID pública vai pro front via `import.meta.env.VITE_VAPID_PUBLIC_KEY` (precisa ser adicionada ao `.env` — é pública, ok).
- **`src/lib/push-heartbeat.ts` (novo)** — no `__root.tsx`, em `useEffect`, chama `register-push` com `{ heartbeat: true }` a cada abertura (debounce: no máximo 1x por hora via timestamp no localStorage).
- **`public/sw.js`** — adicionar listeners `push` e `notificationclick`. Hoje o SW tem só lógica anti-cache em preview; vou estender mantendo o kill-switch atual.
- **`PushSettingsCard`** — adicionar botão "Receber novidades e lembretes" que chama o novo fluxo de inscrição remota (além do toggle local já existente).

### 6. Anti-spam / opt-out

- Botão "Não receber mais" no SettingsCard → marca `unsubscribed_at` via edge function `unsubscribe-push`.
- `notificationclick` no SW → abre `/` e dispara heartbeat (zera `inactivity_stage`).

## Arquivos novos / alterados

Novos:
- `supabase/migrations/<ts>_push_reengagement.sql` — tabelas + RLS + grants + seed.
- `supabase/migrations/<ts>_push_cron.sql` — cron (criada via insert tool, contém URL+anon key).
- `supabase/functions/register-push/index.ts`
- `supabase/functions/send-push-tick/index.ts`
- `supabase/functions/unsubscribe-push/index.ts`
- `src/lib/push-client.ts`
- `src/lib/push-heartbeat.ts`

Alterados:
- `public/sw.js` — adicionar handlers de push.
- `src/routes/__root.tsx` — chamar heartbeat.
- `src/components/push-settings-card.tsx` — toggle de push remoto.
- `.env` — `VITE_VAPID_PUBLIC_KEY` (valor copiado do secret).

## Pontos a confirmar antes de implementar

1. **APK Android** — ele não tem FCM configurado. Nessa fase os pushes de reengajamento atingem só os usuários PWA/web. Configurar FCM para o APK é outro projeto (precisa de `google-services.json`, plugin Capacitor, conta Firebase). Tudo bem deixar de fora agora?

2. **Cadência de inatividade** — proposta: lembrete em 3d, 14d e 30d sem usar. Algum desses dias você quer ajustar (ex.: 7/30/60)?

3. **Campanhas regulares iniciais** — vou seedar duas: "Confira a escala da semana" toda segunda 09h, e "Novidades do mês" no dia 1 às 10h (horário Brasília). Quer ajustar dias/horários/textos, ou prefere começar só com a de reengajamento e criar campanhas depois?
