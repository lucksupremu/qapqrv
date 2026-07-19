# Alerta de "outros usuários estão se inscrevendo"

Hoje as marcas de Dejem/Delegada ficam **só no `localStorage`** de cada dispositivo — o backend não sabe quem se inscreveu em nada. Sem esse sinal no servidor é impossível detectar "picos". O plano abaixo cria esse sinal (anônimo, por device) e usa o cron já existente para disparar o push.

## O que o usuário vai ver

Push com título/corpo:
- **"Escalas abrindo agora?"**
- **"Outros policiais estão marcando Dejem/Delegada. Já conferiu se há escalas abertas para inscrição?"**
- Ao tocar, abre `/calendario`.

Regras para não virar spam:
- Só é enviado quando **≥ 5 dispositivos distintos** registram uma marca (do mesmo tipo — dejem OU delegada) em uma **janela de 30 min**.
- Cada dispositivo recebe **no máximo 1 alerta desse tipo por dia** (cooldown 24h).
- Não recebe o alerta quem **já marcou** uma escala do mesmo tipo nos últimos 3 dias (afinal, já se inscreveu).
- Nunca expõe identidade — só contagem agregada.

## Como funciona

```text
[App] usuário salva marca no MarcarModal
        │
        ▼
POST /functions/v1/report-marca  { device_id, tipo, data_alvo }
        │
        ▼
INSERT em public.marca_events (anônimo, com TTL de 7 dias)
        │
        ▼
[cron push-tick, de hora em hora]  →  runBurstAlerts()
   ├─ conta marcas por tipo nos últimos 30 min
   ├─ se ≥ threshold, seleciona push_subscriptions elegíveis
   │    (não recebeu esse alerta nas últimas 24h,
   │     não registrou marca desse tipo nos últimos 3d)
   └─ envia webpush → grava em push_burst_sends (dedupe)
```

## Detalhes técnicos

**Nova tabela `public.marca_events`** (append-only, anônima):
- `id uuid pk`, `device_id text`, `tipo text` ('dejem' | 'delegada'), `data_alvo date`, `created_at timestamptz default now()`.
- Índice `(tipo, created_at desc)` para as janelas.
- Grants: `INSERT` para `anon` e `authenticated` (é anônimo, só device_id); `ALL` para `service_role`.
- RLS: policy de `INSERT` liberada (nenhum `SELECT`/`UPDATE`/`DELETE` público — só o service_role lê pelo edge function).
- Job de limpeza (dentro do `send-push-tick`): apaga rows com `created_at < now() - interval '7 days'`.

**Nova tabela `public.push_burst_sends`** (cooldown por dispositivo):
- `device_id text`, `tipo text`, `sent_at timestamptz default now()`, `pk (device_id, tipo, date_trunc('day', sent_at))`.
- Só o service_role acessa.

**Nova edge function `report-marca`** (verify_jwt = false, CORS aberto):
- Body validado com Zod: `{ device_id: string, tipo: 'dejem'|'delegada', data_alvo: string(YYYY-MM-DD) }`.
- Insere em `marca_events` com service_role.
- Silenciosa em caso de erro (não bloqueia UX do modal).

**Alteração no `send-push-tick`**:
- Adiciona `runBurstAlerts()`, chamado antes de `runInactivity()`.
- Para cada `tipo` em `['dejem','delegada']`:
  1. `SELECT count(distinct device_id)` de `marca_events` nos últimos 30 min → se `< 5`, pula.
  2. Seleciona `push_subscriptions` ativas onde o `device_id` **não** aparece em `marca_events` (mesmo tipo, últimos 3 dias) e **não** aparece em `push_burst_sends` (mesmo tipo, últimas 24h).
  3. Envia webpush; grava em `push_burst_sends`.
- Limpa `marca_events` antigos (>7 dias) ao final.

**Alteração no cliente**:
- `src/components/marcar-modal.tsx`: no `handleSubmit`, após `onSave`, chamar `reportMarcaEvent(marca.tipo, marca.data)` em fire-and-forget.
- Novo helper `src/lib/report-marca.ts`: normaliza `dejem`/`delegada` (colapsa `delegada_capital`/`delegada_outras` em `delegada`), pega `device_id` do `qapqrv_device_id`, envia via `supabase.functions.invoke("report-marca", ...)`. Erros são silenciosos.

## Privacidade / AdSense / lojas

- Nada de identidade pessoal — só `device_id` UUID gerado no primeiro uso (mesmo que já usamos para push).
- Retenção curta (7 dias) e finalidade única (agregar contagem).
- Vou acrescentar 1 linha em `src/routes/privacidade.tsx`: "Registramos, de forma anônima, quando você marca Dejem/Delegada, apenas para avisar outros usuários sobre picos de inscrição. Nenhum dado pessoal é enviado."

## Pontos que quero confirmar antes de implementar

1. **Threshold**: 5 dispositivos em 30 min é o gatilho padrão. Como a base ainda é pequena, posso começar com **3 em 30 min** e ajustar depois. Prefere 3 ou 5?
2. **Escopo do "quem recebe"**: enviar para **todos com push ativo** (que não marcaram nos últimos 3d) ou **restringir só a quem marcou alguma vez nos últimos 30 dias** (perfil "interessado em escalas")? A segunda evita incomodar quem baixou o app só pelas ferramentas.

Se você não responder essas 2 perguntas, vou seguir com **threshold = 3 em 30 min** e **público = quem marcou pelo menos 1 vez nos últimos 30 dias** (mais conservador e alinhado ao propósito).
