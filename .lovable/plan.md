# Conformidade Google AdSense

O Google reprovou por duas violações:
1. **Anúncios em telas sem conteúdo** (splash, onboarding, "em construção", redirecionamentos, telas de navegação/alerta).
2. **Conteúdo de baixo valor** em algumas rotas.

A causa raiz: hoje o script global do AdSense (`adsbygoogle.js`) é injetado em **todas** as rotas quando ligado, e o `<AdSlot>` pode aparecer em telas predominantemente interativas (ferramentas, anyconnect). Mesmo sem `auto-ads`, o robô do AdSense visita o site e vê o script carregando em páginas vazias — e isso é o suficiente para reprovar.

## O que vou fazer

### 1. Allowlist rígida de rotas com anúncio
Criar `src/lib/ads-allowlist.ts` com APENAS rotas ricas em conteúdo editorial:
- `/blog`, `/blog/$slug`
- `/sobre`, `/manual`, `/termos`, `/privacidade`, `/contato`

Tudo o resto (splash, onboarding, inicio, calendario, historico, favoritos, intranet, anyconnect, em-construcao, ferramenta.*, escala-viewer, escalas-baixadas, configuracoes) **nunca** carrega o script do AdSense nem renderiza `<AdSlot>`.

### 2. Script AdSense condicional por rota
No `__root.tsx`, o `loadAds()` passa a checar a rota atual contra a allowlist antes de injetar o `<script>`. Se a rota não estiver na lista, o script não é adicionado — e se já estava adicionado de uma rota anterior, ele permanece mas nenhum `<ins>` será criado nas novas telas.

### 3. Guarda no `<AdSlot>`
O componente vira no-op se:
- A rota atual não está na allowlist; **ou**
- `VITE_ADSENSE_ENABLED !== "true"`; **ou**
- Estiver em APK (mantém comportamento atual de native ad — não muda).

### 4. Remover `<AdSlot>` das telas reprovadas
- `src/routes/anyconnect.tsx` → remove `<AdSlot>` (tela de tutorial/ação, pouco texto).
- `src/routes/ferramenta.consulta-escala.tsx` → remove `<AdSlot>` (tela de busca/ferramenta).
- `src/routes/manual.tsx` → **mantém** (página densa de conteúdo).

### 5. Reforçar conteúdo das páginas com ads
- `/sobre`, `/contato`, `/termos`, `/privacidade`: revisar e garantir ≥ 600 palavras de conteúdo original, com headings semânticos.
- `/blog` index: garantir descrição introdutória + lista visível com resumo de cada post.
- Posts do blog: validar que cada um tem ≥ 800 palavras úteis (já existem 4 posts; ajusto os que estiverem curtos).

### 6. Bloquear crawler em telas de baixo valor
Adicionar `<meta name="robots" content="noindex">` dinamicamente (via `__root.tsx`) nas rotas fora da allowlist de conteúdo, exceto `/` que tem landing. Isso impede que o robô do AdSense classifique splash/onboarding/em-construcao como "página do editor".

### 7. Atualizar `public/robots.txt`
Desautorizar explicitamente: `/splash`, `/onboarding`, `/em-construcao`, `/intranet`, `/anyconnect`, `/ferramenta/*`, `/escala-viewer/*`, `/escalas-baixadas`, `/configuracoes`, `/favoritos`, `/historico`, `/calendario`, `/inicio`.

### 8. Não atrapalhar o usuário
- Onde o `<AdSlot>` for removido/no-op, ele simplesmente não renderiza (sem placeholder, sem reserva de espaço) — UX fica mais limpa.
- Flag `VITE_ADSENSE_ENABLED` continua `false` no `.env` até a aprovação. Quando virar `true`, só as rotas da allowlist exibirão anúncios.

## Resultado esperado
Quando você pedir revisão ao AdSense, o crawler só vai encontrar `adsbygoogle.js` em páginas com conteúdo editorial denso (blog + páginas institucionais), eliminando ambas as violações.
