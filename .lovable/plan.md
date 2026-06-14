
## O que vai aparecer

Banner discreto no topo da Home (`/`), exibido **1x por mês** por usuário, convidando-o a compartilhar o app com colegas da tropa. Dois botões:

- **WhatsApp** (verde #25D366) — abre o WhatsApp já com mensagem pronta + link
- **Outras opções** — usa Web Share API nativa quando disponível; fallback copia o texto

E um "X" para dispensar (também conta como "visto" no mês).

## Texto

Título:
> "Tem colega de farda que ainda não conhece?"

Subtítulo:
> "Compartilhe o QAP, QRV! e ajude a tropa a controlar escalas, lembretes e intranet num só app."

Mensagem enviada no WhatsApp / Share:
> 🚔 *QAP, QRV!* — o app do PM
>
> Calendário de escalas (dejem/delegada), lembretes automáticos, acesso fácil à intranet PMESP e escalas offline. Tudo num só lugar, de graça.
>
> Baixa aí: https://www.miketools.top

## Regra de exibição (1x por mês)

- Chave `localStorage`: `share_banner_last_shown_yyyymm`
- Valor: `"YYYY-MM"` do mês em que foi exibido/dispensado
- Mostra apenas se o valor salvo não for o mês atual
- Reforço: só aparece para quem já usou 3+ dias distintos (`getAccessDays()` já existente em `push-client.ts`) — evita pedir compartilhar para quem acabou de chegar
- Clicar em qualquer ação (WhatsApp, Compartilhar, X) grava o mês atual

## Arquivos

**Novo:** `src/components/share-app-banner.tsx`
- Card verde-claro (#dcfce7) com ícone WhatsApp (SVG inline)
- Botão WhatsApp: `https://wa.me/?text=<msg encoded>`
- Botão Share: `navigator.share({...})` com fallback `navigator.clipboard.writeText` + toast
- Link usado: `https://www.miketools.top`

**Editar:** `src/routes/index.tsx`
- Importar `ShareAppBanner`
- Montar logo após `<InstallPushOptIn />` (linha ~347)

Sem novas dependências (já existe `sonner` + `lucide-react`).
