## Plano — Fase 1: "QAP,QRV! "

Reestruturação do app atual para um novo conceito: **"QAP, QRV! "**, voltado para policiais da PMESP acompanharem escalas Dejem e Delegada.

## Observação importante sobre stack

O projeto atual usa **TanStack Router** (não React Router DOM) sobre TanStack Start. Vou manter TanStack Router (trocar agora quebraria todo o template SSR). As rotas funcionarão igualmente (`/`, `/calendario`, etc.). Tailwind + shadcn já estão prontos. Se preferir, posso forçar React Router DOM depois — mas recomendo manter.

## O que será feito nesta fase

### 1. Design tokens e fonte

- Adicionar import da fonte **Nunito** (Google Fonts) em `src/routes/__root.tsx` (head).
- Em `src/styles.css`, adicionar as variáveis solicitadas (`--bg`, `--primary`, `--primary-dark`, `--card-field`, `--success`, `--danger`) como tokens oklch/hex sob `:root`, e aplicar `font-family: 'Nunito', sans-serif` no body. Fundo global = `var(--bg)`.

### 2. Nova tela inicial (`src/routes/index.tsx`)

Substituir totalmente a splash atual pela **HomeScreen "QAP, WRV! "** com o layout especificado:

- **Header**: título "QAP, QRV! " (32px bold, azul PMESP) + botão hamburguer circular (48px, #D5DCE8) à direita.
- **Card azul "Valores a receber"** (`#1B3A6B`, radius 20, padding 20, margin 16):
  - Linha 1: título branco + botão calendário circular branco (40px) → navega para `/calendario`.
  - Linha 2: 2 campos `valoresMensais` (mês atual + próximo).
  - Linha 3: seção **Dejem** com 3 campos (3 meses mais recentes).
  - Linha 4: seção **Delegada** com 3 campos.
- **Card branco de ações** (radius 20, shadow):
  - Botão "🌐 Marcar/Desmarcar" (primary) → navega para `/escalas-baixadas` (placeholder).
  - Botão "🔑 Abrir AnyConnect" (outline) + botão circular "!" → `/anyconnect`.
  - Campo "ID da escala" + botão "Consultar" → reutiliza fluxo existente (`/ferramenta/consulta-escala`) passando o ID.
- **Footer**: link "Política de Privacidade" → `/privacidade`.

### 3. Estado e cálculo automático

- `idEscala` (string) + `marcas` (array) persistidos em `localStorage` na chave `marcas_atividade_d`.
- `useEffect` recalcula `dejemContagens`, `delegadaContagens` e `valoresMensais` a partir de `marcas` sempre que muda.
- Os 3 meses exibidos são os **3 mais recentes** terminando no mês atual (ex.: hoje MAI/2026 → MAR, ABR, MAI). Valores a receber = mês atual + próximo.
- Como `marcas` começa vazio, todos os contadores e valores aparecem como `0` / `R$ 0,00` (estado inicial conforme solicitado).

Tipo das marcas (definido agora para suportar Fase 2):

```ts
type Marca = { id: string; tipo: 'dejem' | 'delegada'; data: string /* ISO */; valor: number };
```

### 4. Rotas placeholder "Em construção"

Criar arquivos com header (botão voltar + título "Em construção"):

- `src/routes/calendario.tsx`
- `src/routes/escalas-baixadas.tsx`
- `src/routes/intranet.tsx`
- `src/routes/anyconnect.tsx`
- `src/routes/privacidade.tsx`

Componente compartilhado `src/components/em-construcao.tsx` para o conteúdo.

### 5. Limpeza

- Remover/ocultar componentes da home antiga que não fazem mais sentido nesta tela (bottom-nav, splash, ad-slot na home). **Manter** os arquivos existentes (`ferramenta.consulta-escala.tsx`, `inicio.tsx`, `favoritos.tsx`, `historico.tsx`, `sobre.tsx`) por enquanto — serão revisitados nas próximas fases.
- Atualizar `src/routes/__root.tsx` para fundo `var(--bg)` e fonte Nunito.

### 6. Itens explicitamente fora desta fase

- Lógica de marcar/desmarcar escalas no calendário.
- Integração real com AnyConnect/Intranet.
- Conteúdo das telas placeholder.
- Mudança de stack para React Router DOM (mantemos TanStack Router).

## Critérios de aceite

- Home renderiza exatamente o layout descrito com fonte Nunito e paleta correta.
- Todos os campos numéricos mostram `0` e valores `R$ 0,00` no estado inicial.
- Os 3 meses exibidos correspondem aos 3 mais recentes (terminando no mês atual).
- `marcas` persiste em `localStorage` (chave `marcas_atividade_d`).
- Navegação para `/calendario`, `/anyconnect`, `/privacidade`, etc. mostra "Em construção".
- Sem erros no console, build passa.