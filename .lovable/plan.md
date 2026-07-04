## Objetivo
Ao clicar diretamente em uma data e adicionar um plantão, ele deve aparecer como um **sticker** (selo redondo com ícone) na célula — **não** como o contorno quadrado laranja/azul usado pelas escalas recorrentes. Assim o usuário distingue à primeira vista o que é escala fixa (contorno) do que é plantão avulso adicionado manualmente (selo).

## Lógica proposta (visão do usuário)

- **Contorno quadrado laranja/azul-marinho** = plantões gerados pela escala recorrente cadastrada em "Configurar".
- **Selo redondo 🌞/🌙 no canto do dia** = plantão avulso adicionado clicando direto na data.
- Cores do selo seguem o mesmo código dia/noite (laranja/azul-marinho), mas em formato circular com emoji — visualmente diferente do contorno, então não há confusão.
- Se o dia tem escala recorrente **E** um avulso, aparecem os dois: contorno + selo, sem sobrepor.

## O que muda no código

### 1. Modelo — `src/lib/escala-trabalho.ts`
- Adicionar campo opcional `avulso?: boolean` em `EscalaRegra`.
- `PlantaoEntry` passa a expor `avulso: boolean` (derivado de `regra.avulso === true`).
- Migração retrocompatível: registros antigos com `dataInicial === dataFinal` e sem `alternada` são marcados como `avulso: true` no `loadEscalas()` (best-effort, para escalas passadas criadas pelo modal de dia).

### 2. Modal de adicionar num dia — `src/components/escala-dia-modal.tsx`
- Ao montar a `EscalaRegra`, incluir `avulso: true`.
- Trocar o preview "Cor no calendário" por um preview do **selo** (círculo com 🌞/🌙 na cor dia/noite) com legenda: "Aparecerá como selo no dia — não pinta a borda".

### 3. Calendário — `src/components/escala-calendar-card.tsx`
- Ao calcular `temDia` / `temNoite` para o **contorno**, ignorar entries com `avulso === true`. Assim o contorno só reflete a escala recorrente.
- Novo cálculo: `avulsoDia` / `avulsoNoite` a partir das entries avulsas do dia.
- Renderizar um novo elemento **sticker** (canto inferior-direito da célula, `z-index: 4`, ~14px, círculo, fundo `COR_DIURNO`/`COR_NOTURNO`, texto branco com emoji, `box-shadow` fino contra o card). Se tiver os dois períodos avulsos no mesmo dia, mostra um único selo dividido (metade laranja/metade azul, mesmo truque de gradient da borda) ou dois selos empilhados — usar **um único selo dividido** para não poluir.
- Reorganizar cantos para evitar colisão:
  - Canto superior-direito: marca (dejem/delegada) — inalterado.
  - Canto inferior-esquerdo: evento — inalterado.
  - Canto inferior-direito: **novo selo de plantão avulso**.
- Popover do dia: para cada entry avulsa, mostrar uma pílula "Avulso" ao lado do local, para reforçar a origem.

### 4. Legenda — `src/components/escala-calendar-card.tsx`
Adicionar duas entradas na legenda:
- Selo 🌞 laranja → "Plantão avulso (dia)"
- Selo 🌙 azul → "Plantão avulso (noite)"

E atualizar a frase de rodapé:
> Contorno = escala recorrente · Selo 🌞/🌙 = plantão avulso.

## Arquivos afetados
- `src/lib/escala-trabalho.ts` — campo `avulso`, migração, tipos.
- `src/components/escala-dia-modal.tsx` — marca `avulso: true`, novo preview.
- `src/components/escala-calendar-card.tsx` — separa contorno vs selo, novo sticker, legenda, popover.

Sem mudanças em backend, storage schema permanece compatível (campo opcional).
