## Objetivo

Tornar o cadastro da escala mais simples adicionando **presets prontos** (12x24/12x48, 12x36, 24x72…). O usuário escolhe o modelo e o sistema já preenche tudo — inclusive a alternância dia/noite quando for o caso. A opção de cadastrar uma segunda escala (para quem tem outro plantão diferente) continua existindo de forma clara.

---

## 1. Presets de escala no modal

No topo do modal **"Adicionar plantão"** (`src/components/escala-config-modal.tsx`), adicionar um seletor `"Modelo de escala"` com as opções:

| Preset | Turno 1 | Turno 2 (alternado) |
|---|---|---|
| **12x24 / 12x48** (dia + noite) | 12h trab × 24h folga · início 07:00 | 12h trab × 48h folga · início 19:00 |
| **12x36** | 12h trab × 36h folga · início 07:00 | — |
| **24x72** | 24h trab × 72h folga · início 07:00 | — |
| **24x48** | 24h trab × 48h folga · início 07:00 | — |
| **Personalizada** | (usuário define) | (opcional, via checkbox) |

Selecionar um preset preenche automaticamente: `trabalho`, `folga`, `horaInicio`, `minutoInicio` e, quando o preset for 12x24/12x48, também marca **alternada = true** e preenche o segundo turno.

Os campos de hora continuam editáveis depois do preset — o usuário pode ajustar o horário inicial sem perder a configuração das horas. Trocar o preset reseta os campos para os valores do novo preset.

## 2. Clareza visual: "Turno alternado" vs. "Segunda escala"

Hoje há ambiguidade entre dois conceitos diferentes:

- **Turno alternado** (dentro da mesma escala): plantão dia + plantão noite que se intercalam (caso 12x24/12x48).
- **Segunda escala** (cadastrar outra regra separada): outro plantão em local diferente, sem relação com o primeiro.

Mudanças no modal para deixar isso explícito:

- Renomear a label `Escala alternada (segundo turno)` → **"Plantão alterna dia/noite no mesmo local"**, com um texto de apoio: _"Marque quando o mesmo serviço alterna um turno diurno e um noturno (ex.: 12x24 / 12x48)."_
- Quando o preset já implica alternância (12x24/12x48), o checkbox aparece **marcado e bloqueado** com uma nota _"Já configurado pelo modelo selecionado."_
- No `EscalaCalendarCard`, abaixo da lista de regras, adicionar um botão secundário **"+ Cadastrar outra escala"** que abre o mesmo modal (já dispara `setModalOpen(true)`). Isso reforça que cadastrar uma segunda escala = nova regra independente, não o checkbox de alternância.

## 3. Detalhes técnicos

- Novo arquivo `src/lib/escala-presets.ts` exporta a lista de presets com a estrutura:
  ```ts
  type Preset = {
    id: "custom" | "12x24-12x48" | "12x36" | "24x72" | "24x48";
    label: string;
    descricao: string;
    turno: { trabalho; folga; horaInicio; minutoInicio };
    alternada?: { trabalho; folga; horaInicio; minutoInicio };
  };
  ```
- No modal, estado novo `preset: string`; ao mudar, dispara `setTrabalho/setFolga/setHoraInicio/setMinutoInicio/setAlternada/setTrabalhoB/...` com os valores do preset.
- Ao editar uma regra existente (`initial` definido), tentar adivinhar o preset comparando os valores; se não bater, seleciona `"Personalizada"`.
- Componente: usar `Select` shadcn já presente para o picker de preset, no topo do bloco "Escala".

## Fora do escopo

- Salvar presets criados pelo próprio usuário.
- Mudar a forma de armazenamento ou o algoritmo `gerarPlantoesDoMes` — os presets só preenchem campos existentes.
- Notificações ou avisos por plantão.
