## Objetivo

Na tela `/inicio`, logo abaixo do grid de ferramentas, adicionar um **card de Calendário de Escala** inspirado no app "Plantão Fácil": mini calendário do mês com bolinhas coloridas marcando os plantões, navegação entre meses e um botão para o policial cadastrar sua escala de trabalho recorrente (12x24, 12x48, alternada etc.), com data inicial, data final e horário de início.

A partir das regras cadastradas, o app gera automaticamente as datas e pinta os dias correspondentes no mini calendário, facilitando enxergar os dias livres para agendar Dejem ou Delegada.

## Modelo de dados (novo: `src/lib/escala-trabalho.ts`)

```ts
type EscalaRegra = {
  id: string;
  local: string;          // "Polícia Militar", "Clínica", etc.
  cor: string;            // hex da bolinha
  trabalho: number;       // horas trabalhadas (ex: 12)
  folga: number;          // horas de folga (ex: 24 / 48)
  horaInicio: number;     // 0..23
  dataInicial: string;    // ISO yyyy-mm-dd
  dataFinal: string;      // ISO yyyy-mm-dd
  alternada?: {           // segundo turno opcional (caso "Escala Alternada")
    trabalho: number;
    folga: number;
    horaInicio: number;
  };
};

loadEscalas(): EscalaRegra[]      // localStorage chave "qap-escalas-trabalho"
saveEscalas(list: EscalaRegra[])
removeEscala(id: string)

// gerador puro: dado um mês, devolve { date: Date, plantoes: EscalaRegra[] }
gerarPlantoesDoMes(regras: EscalaRegra[], year: number, month: number)
```

Algoritmo: a partir de `dataInicial + horaInicio`, soma sucessivamente `(trabalho + folga)` horas até passar de `dataFinal`. Cada início que caia em dia do mês exibido marca esse dia com a cor da regra. Para escala alternada, intercala turno A e turno B.

## Novo componente: `src/components/escala-calendar-card.tsx`

Estrutura visual (segue a foto de referência, adaptada ao tema do app):

- Card branco arredondado com sombra suave
- Header: `‹  Mês AAAA  ›` (navegação por mês) + botão "Hoje"
- Linha de dias da semana (DOM SEG TER QUA QUI SEX SAB)
- Grid 7×6 de dias:
  - Dia sem plantão → número simples
  - Dia com 1 plantão → número dentro de círculo na cor do `local`
  - Dia com 2+ plantões → círculo com gradiente cônico segmentado nas cores dos locais (visual de "donut multi-color" da imagem)
  - Dia de hoje → realce com fundo suave + número em negrito
- Legenda compacta abaixo do grid: bolinha + `Local · Trabalho×Folga · Hora` para cada regra cadastrada (com botão lixeira para remover)
- Botão CTA: **"Configurar escala"** (abre o modal)
- Estado vazio (sem regras): mostra o calendário limpo do mês atual + ilustração leve "Nenhuma escala cadastrada" + mesmo botão "Configurar escala"

## Novo modal: `src/components/escala-config-modal.tsx`

Reproduz a tela "Adicionar Plantão" da referência, mas integrada ao design system do projeto (shadcn `Dialog` + inputs estilizados):

Campos:
- **Local de trabalho** — input texto (placeholder "Ex: Polícia Militar")
- **Cor** — seletor com 8 swatches pré-definidos (vermelho, azul, verde, magenta, laranja, ciano, roxo, amarelo)
- **Escala (turno 1)** — dois inputs numéricos `trabalho` X `folga` + select `Hora de início` (0–23)
- Checkbox **"Escala alternada"** — quando marcado, mostra um segundo bloco igual ao de cima para o turno alternado
- **Data inicial** — DatePicker shadcn (`pointer-events-auto`)
- **Data final** — DatePicker shadcn
- Botões: **Cancelar** / **Salvar escala**

Validação com zod (campos obrigatórios, datas coerentes, números 1..168).

## Integração em `src/routes/inicio.tsx`

Renderizar `<EscalaCalendarCard />` logo abaixo do `<main>` com o grid de ferramentas (`px-4 mt-6`). O card só some quando o usuário está filtrando ferramentas (campo de busca preenchido), para não poluir o resultado da busca.

## Detalhes técnicos

- Apenas frontend, sem backend nem novas dependências
- Persistência em `localStorage` (mesmo padrão de `src/lib/marcas.ts`)
- Reaproveitar tokens de cor existentes (`#2e6b8a`, `#e8f0f8`, `--surface`, etc.) — sem cores fora do design system
- shadcn `Dialog`, `Popover`, `Calendar`, `Checkbox`, `Input`, `Select`, `Button` já instalados
- `date-fns` já no projeto para formatação
- Acessibilidade: `aria-label` no botão de cada dia ("12 de abril — 2 plantões"), foco visível, modal com `aria-describedby`
- Bolinhas multi-color: gerar `background: conic-gradient(...)` dinâmico em função das cores das regras do dia
- Tema escuro: card usa `var(--surface)` e texto `var(--text-dark)` para manter legibilidade já corrigida em iterações anteriores

## Fora do escopo

- Não mexe em `/calendario` (continua sendo a tela detalhada de Dejem/Delegada com cálculo de valores)
- Não sincroniza com backend
- Não gera notificações para os plantões cadastrados (pode ser próximo passo)
