# Ajustes no navegador interno (Atividade Delegada/DEJEM)

Dois problemas na tela pós-login da DEJEM (ver screenshot anexo: conteúdo minúsculo no canto superior + botões × e ⋮ cobrindo links importantes no topo):

## 1. Aplicar viewport mobile também na tela da DEJEM

Hoje a injeção de viewport/CSS em `injectMobileViewport()` só roda em `login.aspx` e `autenticacaosegura.aspx`. A tela "Atividade Delegada/DEJEM" e demais páginas da intranet PMESP ficam sem viewport e renderizam em largura desktop (≈980px), aparecendo minúsculas no celular.

**Mudança:** ampliar o filtro de URL para cobrir todo o host `policiamilitar.sp.gov.br` (intranet), aplicando apenas o **meta-viewport** (`width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes`) em todas as páginas desse host. O CSS pesado de saneamento de formulário (inputs grandes, botão azul, overlay "Entrando…") **continua restrito** a `login.aspx` / `autenticacaosegura.aspx` — pois nas outras telas (iNotes, folha, DEJEM) o usuário já confirmou que estava OK e não pode quebrar o layout.

Resultado: a DEJEM e demais telas vão abrir já no zoom certo respeitando a largura do celular, mas o usuário ainda pode dar pinch-to-zoom se quiser.

## 2. Mover botões flutuantes × (fechar) e ⋮ (menu) para a parte inferior

Hoje ambos ficam no topo (`Gravity.TOP`), cobrindo o link "Inscrever-se na escala" da DEJEM (visível parcialmente atrás do botão × no screenshot).

**Mudança em `InAppWebViewActivity.kt` (linhas 470-482):**
- `btnClose`: trocar `Gravity.TOP or Gravity.START` → `Gravity.BOTTOM or Gravity.START`, e usar `bottomMargin = navigationBarHeight() + dp(12)` no lugar de `topMargin`.
- `btnOverflow`: trocar `Gravity.TOP or Gravity.END` → `Gravity.BOTTOM or Gravity.END`, mesmo `bottomMargin`.
- Adicionar um pequeno helper `navigationBarHeight()` análogo a `statusBarHeight()`, para não colidir com a barra de gestos.
- Manter o auto-fade (alpha 0.30 após 1.5s) como já funciona.
- Remover/ajustar o `padding-top: 48px` do CSS de `login.aspx` (linha 616) já que os botões não estarão mais no topo — para os campos de CPF/senha não ficarem desnecessariamente afastados.

## Arquivo afetado

- `android-plugin/InAppWebViewActivity.kt` (apenas)

Sem mudanças em código TS/React — é tudo nativo Android do navegador interno.
