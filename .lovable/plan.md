## Objetivo

Quando o usuário toca num dia do calendário e clica em "Adicionar plantão neste dia", abrir um modal **simples**, no estilo do antigo "Adicionar evento" — só os campos essenciais — em vez do modal completo de escala recorrente.

## Como vai funcionar

**Novo modal simplificado** — "Adicionar plantão neste dia":

Campos:
- **Local** (texto, obrigatório) — ex: "Polícia Militar", "Dejem", "Delegada".
- **Cor** (paleta de cores reutilizando `ESCALA_CORES`).
- **Horário de início** (input `time`, default 07:00).
- **Duração em horas** (number, default 12, range 1–24). Mantido porque o calendário precisa saber se é diurno/noturno (emoji 🌞/🌙) e quando começa/termina — mas com default sensato para o usuário só confirmar.

Sem: data inicial/final, preset, turno alternado, folga, modelo de escala. Como é só um dia, a data já vem fixada pelo dia clicado.

Ao salvar:
- Cria uma `EscalaRegra` com `dataInicial = dataFinal = dia clicado`, `trabalho = duração`, `folga = 24 - duração` (irrelevante porque não vai repetir), sem `alternada`. Reaproveita o storage e o motor de cálculo existentes — o calendário e a lista de escalas cadastradas continuam mostrando normalmente.
- Mostra toast "Plantão adicionado." e fecha.

## Arquivos

**Novo:**
- `src/components/escala-dia-modal.tsx` — modal enxuto com os 4 campos acima, usando `Dialog` shadcn, paleta `ESCALA_CORES`, e gerando `EscalaRegra` via `newEscalaId()`.

**Editado:**
- `src/components/escala-calendar-card.tsx`:
  - Substitui o uso do `EscalaConfigModal` no fluxo "clicou num dia" pelo novo `EscalaDiaModal`.
  - Mantém o `EscalaConfigModal` para os fluxos "Configurar" (topo) e "Editar" (lápis na lista de regras) — escalas recorrentes continuam usando o modal completo.

**Editado (reversão parcial):**
- `src/components/escala-config-modal.tsx`: remover a prop `initialBaseDate` adicionada antes (não é mais necessária) e voltar título/descrição ao original.

## Detalhes técnicos

- `EscalaDiaModal` props: `open`, `onOpenChange`, `baseDate: Date`, `onSave: (regra: EscalaRegra) => void`.
- Reutiliza `loadEscalas` / `saveEscalas` / `handleSave` já existentes no card — basta passar a regra montada.
- Default de duração = 12h, hora = 07:00. Valida: local não-vazio, duração 1–24.
- Nenhuma migração de dados: a estrutura `EscalaRegra` é a mesma, só com `dataInicial == dataFinal` e sem `alternada`.