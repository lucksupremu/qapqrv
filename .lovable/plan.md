## Problema

Hoje o ícone de Sol/Lua usa a **mesma cor do plantão** (vermelho, azul, verde, etc.) com um leve halo branco. Resultado: o ícone vira "mais um detalhe colorido" em vez de comunicar imediatamente "dia" ou "noite".

## Solução

Dar identidade visual fixa ao Sol e à Lua, independente da cor do plantão e do tema (claro/escuro): cada um vira um **micro-badge circular** com cor própria, contrastando com a faixa do plantão por trás.

### Cores fixas (sempre as mesmas)
- **Sol** ☀️ — círculo **amarelo âmbar** (`#FBBF24`) com ícone branco em cima.
- **Lua** 🌙 — círculo **índigo profundo** (`#1E1B4B`) com ícone branco-creme em cima.

Essas duas cores não colidem com nenhuma cor da paleta de plantões (vermelho, azul, verde, magenta, laranja, ciano, roxo, amarelo "trabalho") porque ficam **dentro de um badge circular** com fundo sólido + anel branco fino. Mesmo se o plantão for amarelo, o sol ainda lê como sol (anel branco + ícone branco no centro) e a lua lê como lua.

### Tema escuro
- O anel externo do badge troca para `hsl(var(--card))` (não fica branco puro sobre fundo escuro do card). Isso já casa automaticamente com light/dark via token.
- O fundo do badge (âmbar / índigo) é sólido e bem saturado — funciona nos dois temas.
- O ícone interno fica branco em ambos.

### Posicionamento
- Mesmo canto (inferior-direito da coluna), mesmo tamanho geral (badge ~14px / ícone ~9px com 1 coluna; ~12 / ~7 com 2 colunas; ocultar com 3+).
- `border: 1.5px solid hsl(var(--card))` para o anel; `box-shadow: 0 1px 2px rgba(0,0,0,.25)` para dar peso e não sumir no fundo claro do plantão.

### Acessibilidade
- Adicionar `aria-label="Plantão diurno"` / `"Plantão noturno"` no span do badge (remover `aria-hidden` dele) para leitores de tela. O resto da célula continua decorativo.

### Mudanças
**Arquivo único: `src/components/escala-calendar-card.tsx`**
- Substituir o trecho atual que renderiza `<PeriodoIcon … color={s.cor}>` (dentro do `colunasVisiveis.map`) por um `<span>` badge com fundo fixo (âmbar/índigo), anel via `hsl(var(--card))`, e o ícone branco dentro.
- Ajustar tamanhos: badge 14/12, ícone 9/7, conforme `totalCol`.
- Ocultar quando `totalCol >= 3` (mesma regra de hoje).

### Fora do escopo
- Não mexe na lógica de geração de plantões nem em cores das faixas dos plantões.
- Não cria novos tokens globais (cores do sol/lua ficam locais nesse componente — são identidade do ícone, não do tema do app).

## Detalhes técnicos

```tsx
// pseudo
const isNoite = s.periodo === "noite";
const badgeBg = isNoite ? "#1E1B4B" : "#FBBF24";
const badgeSize = totalCol === 1 ? 14 : 12;
const iconSize  = totalCol === 1 ? 9  : 7;

<span
  role="img"
  aria-label={isNoite ? "Plantão noturno" : "Plantão diurno"}
  style={{
    position: "absolute", right: 2, bottom: 1,
    width: badgeSize, height: badgeSize, borderRadius: "50%",
    background: badgeBg,
    border: "1.5px solid hsl(var(--card))",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}
>
  <PeriodoIcon size={iconSize} strokeWidth={2.5} color="#fff" />
</span>
```

Posso aplicar?
