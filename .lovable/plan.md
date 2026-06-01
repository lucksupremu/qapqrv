## Objetivo

Hoje a **marca** (Dejem/Delegada) é desenhada como um post-it amarelo que **cobre o dia inteiro** e some por baixo qualquer faixa de plantão. A pedido: a marca passa a ocupar **apenas a metade livre** da barra vertical, escolhida a partir do **horário** dela, ficando lado a lado (ou empilhada) com a faixa do plantão. O visual de **post-it amarelo** continua, só que aplicado **apenas ao slot da marca**, para continuar fácil de identificar.

Também garantir que toda marca cadastrada em qualquer tela (esta ou a tela de marcação `/historico` etc.) seja refletida aqui — isso já acontece via `loadMarcas()` + listener de `storage`/`focus`, então só precisa continuar funcionando após o refactor.

---

## Como decidir a metade que a marca ocupa

Para cada marca do dia, classificar pelo **horário** (`new Date(marca.data).getHours()`):

- Hora < 12 → **metade superior** (manhã)
- Hora ≥ 12 → **metade inferior** (tarde/noite)

Em seguida, comparar com as faixas de plantão do mesmo dia:

| Plantão no dia                                      | Marca pela manhã (top) | Marca à tarde (bottom) |
| --------------------------------------------------- | ---------------------- | ---------------------- |
| `cheia` (dia inteiro)                               | empilha ao lado (coluna nova) | empilha ao lado (coluna nova) |
| `dir` (noturno começa hoje, ocupa metade inferior)  | **top livre** → ocupa top | conflito → coluna nova |
| `esq` (continuação de noturno, ocupa metade superior)| conflito → coluna nova | **bottom livre** → ocupa bottom |
| sem plantão                                          | ocupa top              | ocupa bottom           |

Quando há conflito direto (mesma metade ocupada), a marca vira **uma coluna vertical extra** à direita das faixas de plantão, seguindo o mesmo esquema horizontal de múltiplos plantões que já existe (`slotW = cellW / total`).

Limite visual: no máximo 3 colunas (plantões + marcas). O excedente continua agregado pelo contador `+N` no canto inferior direito (lógica de `extras` já existe — só estender para contar marcas).

---

## Visual do slot da marca (post-it preservado)

Cada slot de marca renderiza como um retângulo vertical com:

- **Fundo amarelo** `#FFE066` (mesma cor do post-it atual)
- **Sombra** `0 2px 4px rgba(0,0,0,0.25)` (idem)
- Leve rotação `rotate(-3deg)` para manter o "feel" de post-it
- **Borda superior 3px sólida** na cor do tipo (`MARCA_COR[tipo]` — azul Dejem / verde ou laranja Delegada), reforçando a identificação
- Bolinha colorida 6px no canto superior direito do slot (como hoje)
- `borderRadius` 4px

A faixa de plantão ao lado mantém o visual translúcido vertical já implementado.

O número do dia continua em `zIndex: 1`, por cima de tudo, com cor `#1a1a1a` quando há plantão ou marca.

---

## Múltiplas marcas no mesmo dia

- 2 marcas no mesmo dia sem plantão → uma no top, uma no bottom (se horários permitirem); se ambas no mesmo período, uma vira coluna extra.
- 2 marcas no mesmo dia com plantão cheio → uma coluna extra (a 1ª) + `+1` no canto.
- A bolinha do canto superior direito vira a cor da **última marca renderizada visível** (sem perder informação porque o popover mostra todas).

---

## Popover (clique no dia)

O popover já lista plantões e marcas separadamente. Apenas garantir que:

- A seção de marcas mostre **horário** (hora:minuto) ao lado do tipo, para o usuário entender por que a marca foi posicionada em cima ou embaixo.
- Ordem: plantões primeiro, marcas depois (sem mudança estrutural).

---

## Sincronização com outras telas

Já existem listeners de `storage` (chave `marcas_atividade_d`) e `focus`/`visibilitychange` no `useEffect` do `EscalaCalendarCard`. Confirmar que:

- Após salvar uma marca em qualquer modal `MarcarModal` (em qualquer rota), o `localStorage` é atualizado.
- Ao voltar para a tela com o calendário, o listener de `focus`/`visibilitychange` chama `loadMarcas()` e re-renderiza.

Nenhuma mudança de dados é necessária — só validar o fluxo após o refactor visual.

---

## Mudanças técnicas (só `src/components/escala-calendar-card.tsx`)

1. Substituir o bloco do post-it (linhas ~254-281) que cobre `inset: 4`. O post-it deixa de ser fundo da célula inteira.
2. Estender `barrasDoDia` (ou criar `slotsDoDia`) para devolver uma lista unificada de slots verticais `{ tipo: "plantao" | "marca", cor: string, lado: "top" | "bottom" | "cheia", marcaTipo?: TipoMarca }`, aplicando a tabela de conflito acima.
3. No render dos slots, renderizar cada item como antes (faixa translúcida com borda superior colorida) **ou** como post-it amarelo quando `tipo === "marca"`.
4. Atualizar `extras` para incluir marcas que não couberam.
5. Atualizar a legenda no rodapé adicionando um exemplo do post-it amarelo: "Dejem/Delegada".

## Fora do escopo

- Mudar tamanho da célula.
- Editar/remover a marca diretamente pelo calendário (segue só pela tela de marcação).
- Sobrescrever a lógica de `gerarPlantoesDoMes` ou o storage de marcas.
