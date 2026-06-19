## Objetivo

Criar uma "mini-notificação" interna sutil que aparece de vez em quando dentro do app pedindo para o usuário compartilhar o QAP, QRV! com outros policiais.

Hoje já existe o `ShareAppBanner` (card verde grande, 1x por mês, só no `/inicio`). A ideia agora é algo mais discreto, em formato de **toast/snackbar flutuante**, que possa aparecer em qualquer tela do app, simulando uma notificação interna.

## Como vai funcionar

**Formato visual (sutil):**
- Pequeno card flutuante ancorado acima da `BottomNav` (canto inferior, com margem), largura quase total mas baixinho (~64px de altura).
- Ícone 🚔/Share + título curto + 1 linha de descrição + botão "Compartilhar" + X para dispensar.
- Entra deslizando de baixo com leve fade, fica visível ~12s e se esconde sozinho se ignorado (sem marcar como "visto definitivo" — só registra a exibição).
- Usa o verde do app (mesma paleta do banner atual) mas em escala menor, sem ocupar conteúdo.

**Quando aparece (regras de frequência):**
- Só para usuários com pelo menos 5 dias de acesso (`getAccessDays() >= 5`) — evita incomodar novatos.
- No máximo 1 vez a cada 7 dias (controlado por `localStorage`).
- Só dispara depois de 20s navegando no app na sessão atual (não no primeiro segundo).
- Não aparece em rotas de modal/onboarding: `/onboarding`, `/splash`, `/anyconnect`, `/escala-viewer/*`.
- Não aparece se o `ShareAppBanner` (banner mensal grande) estiver visível na mesma sessão — evita duplicidade.
- Dispensar (X) ou compartilhar → respeita o cooldown de 7 dias.

**Ação de compartilhar:**
- Mesma lógica do banner existente: tenta `navigator.share` com texto pronto; fallback copia o link e mostra toast "Link copiado!".
- Texto reaproveitado (mais curto): "🚔 QAP, QRV! — app do PM com escalas, lembretes e intranet. Baixa aí: https://www.miketools.top".

## Onde montar

Adicionar o componente **uma única vez** no layout raiz `src/routes/__root.tsx` para que apareça em qualquer página (com as exclusões de rota acima feitas internamente via `useLocation`).

## Arquivos

**Novo:**
- `src/components/share-app-nudge.tsx` — componente da mini-notificação flutuante com toda a lógica de frequência, timer de exibição e ação de compartilhar.

**Editado:**
- `src/routes/__root.tsx` — importar e renderizar `<ShareAppNudge />` junto dos outros widgets globais.

## Detalhes técnicos

- Chaves de `localStorage`:
  - `share_nudge_last_shown_at` — timestamp ISO da última exibição (cooldown 7 dias).
- Posicionamento: `fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] left-3 right-3 z-40` para ficar acima da `BottomNav` (que tem ~64px).
- Animação: classes Tailwind `animate-in slide-in-from-bottom-4 fade-in duration-300`.
- Acessibilidade: `role="status"`, `aria-live="polite"`, botão X com `aria-label="Dispensar"`.
- Sem dependências novas.
- Não altera o `ShareAppBanner` existente (continua funcionando como está, mensal, na home).