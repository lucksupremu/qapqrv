# Plano: Nova marcação simplificada + Lembretes push

## 1. Simplificar o modal `MarcarModal`

Reduzir os campos a apenas o essencial:

- **Tipo**: Dejem / Delegada (apenas 2 opções no select — unifica `delegada_capital` e `delegada_outras` em "delegada")
- **Dia e hora** (datetime-local)
- **Valor** (R$)

Remover do modal:
- Área/Nome da delegada
- Horário de início
- Valor base por hora

Esses campos saem do formulário, mas o tipo `Marca` em `src/lib/marcas.ts` mantém os campos antigos como opcionais (para não quebrar marcas já salvas no localStorage). Novas marcas salvam apenas tipo/data/valor.

## 2. Lembretes múltiplos

Substituir o campo único `reminderAt` por um array `reminders: string[]` (ISO):

- Ao abrir o modal para uma **nova marcação**, já vem pré-preenchido **1 lembrete automático = 1 dia antes às 09:00** da data da escala.
- Botão "Adicionar lembrete" cria mais slots (datetime-local).
- Cada lembrete tem um "X" para remover.
- Migração leve: ao carregar marcas antigas com `reminderAt`, converter para `reminders: [reminderAt]`.

## 3. Sistema de Push Notifications (web first)

Criar `src/lib/push-notifications.ts` com:

- `requestPermission()` — pede permissão via `Notification.requestPermission()`.
- `scheduleReminder(marca, whenISO)` — agenda via `setTimeout` se o horário estiver dentro de ~24h (limite prático do timer); persiste todos os lembretes no localStorage (`reminders_queue`).
- `rehydrateReminders()` — chamado no boot do app (em `__root.tsx` ou `index.tsx`): varre todas as marcas, e para cada lembrete futuro:
  - se já passou → descarta
  - se nas próximas 24h → agenda `setTimeout` que dispara `new Notification(...)`
  - se mais distante → será re-checado no próximo boot (e a cada 1h via `setInterval`)
- `cancelReminders(marcaId)` — limpa timers ao excluir/editar marca.

Notificação:
- Título: "Escala amanhã — Dejem" (ou Delegada)
- Corpo: data/hora formatada + valor
- Ícone: `/favicon.ico`

Banner discreto no topo (apenas 1ª vez) pedindo permissão de notificações se `Notification.permission === 'default'`.

## 4. Preparar caminho para Capacitor (sem instalar agora)

Criar um wrapper `src/lib/notifications-adapter.ts` que detecta o ambiente:

```ts
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
```

- **Web** (agora): usa Notification API + setTimeout.
- **Nativo** (futuro): chamará `@capacitor/local-notifications` — código já estruturado com TODO comentado mostrando exatamente onde plugar `LocalNotifications.schedule(...)` quando o usuário instalar o plugin (`bun add @capacitor/local-notifications` + `npx cap sync`).

Não vou instalar o plugin Capacitor agora — só deixo o adapter pronto e documentado. Quando o usuário pedir "ativar no app nativo", basta instalar o plugin e descomentar o bloco.

## 5. Atualizações nos arquivos

- `src/lib/marcas.ts` — adicionar `reminders?: string[]`, manter `reminderAt` opcional para retrocompatibilidade.
- `src/components/marcar-modal.tsx` — formulário simplificado + UI de lembretes múltiplos + chamada ao scheduler ao salvar.
- `src/lib/push-notifications.ts` — novo arquivo (lógica web).
- `src/lib/notifications-adapter.ts` — novo arquivo (wrapper web/native).
- `src/routes/__root.tsx` — chamar `rehydrateReminders()` no `useEffect` de montagem + setInterval 1h.
- `src/routes/calendario.tsx` — exibir badge/contagem de lembretes na lista; cancelar lembretes ao excluir marca.

## Detalhes técnicos

- O `setTimeout` máximo confiável do browser é ~24.8 dias; lembretes mais distantes ficam pendentes no localStorage e são re-agendados a cada 1h.
- Notifications API funciona somente em HTTPS (preview e produção do Lovable são HTTPS, ok).
- Em iOS Safari web, notificações exigem PWA instalado — por isso o caminho Capacitor é importante para produção mobile.
- Não usar Service Worker push (requer backend VAPID) — para um app local-first com lembretes pessoais, `setTimeout` + rehydrate é suficiente e zero-infra.
