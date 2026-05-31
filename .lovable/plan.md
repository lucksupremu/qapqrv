## Objetivo

Redesenhar a tela inicial (`src/routes/index.tsx`) trocando o card azul de estatísticas e o bloco vertical de ações por uma **grid de blocos quadrados com ícone grande + título**, no estilo "menu de app", mantendo a identidade azul PMESP.

## Nova estrutura da home

1. **Header** (mantém) — "QAP, QRV!" + botão de menu.
2. **Bloco de consulta de escala** (mantém, no topo) — campo "ID da escala" + botão "Consultar". É a função mais usada e precisa do input, então fica destacado fora da grid.
3. **Passo a passo rápido** (mantém) — os 3 passinhos com ícones (Acesse → Conecte → Pesquise).
4. **Grid de blocos de ação** (novo) — 2 colunas, blocos quadrados com ícone grande centralizado e título embaixo:
   - **Marcar / Desmarcar** (ícone `CalendarPlus`) — abre o modal de marcar.
   - **Calendário** (ícone `Calendar`) — vai para `/calendario`.
   - **Escalas baixadas** (ícone `FolderDown`) — vai para `/escalas-baixadas`.
   - **Abrir AnyConnect** (ícone `KeyRound`) — chama `openAnyConnect()`.
   - **Guia AnyConnect** (ícone `BookOpen`) — vai para `/anyconnect`.
   - **Intranet PMESP** (ícone `Globe`) — vai para `/intranet`.
5. **Footer** (mantém) — link Política de Privacidade.

O card azul de "Valores a receber / Dejem / Delegada" sai da home conforme escolhido. Os dados continuam acessíveis via Calendário, que já lista marcas.

## Estilo dos blocos

- Grid `grid-cols-2 gap-3`.
- Cada bloco: `aspect-square`, cantos arredondados (`rounded-[20px]`), fundo branco com borda sutil, sombra `var(--shadow-card)`.
- Ícone grande (28–32px) dentro de um círculo com gradiente azul PMESP (`var(--gradient-primary)`), centralizado.
- Título em negrito abaixo do ícone, cor `#0f2535`.
- Pressed state: `active:scale-[0.98]` para feedback tátil.
- Paleta mantida (azul PMESP): `#0c2340`, `#1a4a6e`, `#2e6b8a`, `#6ba3c8`.

## Limpeza de código

- Remover do `index.tsx` os cálculos de `mesesRecentes`, `mesesValores`, `contarTipo`, `somar`, `dejemContagens`, `delegadaContagens`, `valoresMensais`, `formatBRL` e o `useMemo` correspondente (não são mais usados na home).
- `marcas`/`setMarcas` permanecem só para alimentar o `MarcarModal` (onSave).
- Imports não usados (`Calendar` permanece, mas `formatBRL` e helpers de mês saem).

## Arquivos alterados

- `src/routes/index.tsx` — reescrita do `HomeScreen` com a nova grid de blocos e remoção das estatísticas.

Nenhum outro arquivo precisa mudar: rotas, drawer, modal e libs já existem.