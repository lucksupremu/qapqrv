# Ajuste fino do viewport por página da intranet

Problema atual: a última mudança aplicou `width=device-width, initial-scale=1` em todo o host `policiamilitar.sp.gov.br`. Isso:
- Quebra o **iNotes** (`correio.policiamilitar.sp.gov.br/iwaredir.nsf`), que já tinha layout próprio e funcionava sem ajuste.
- Deixa a tela **"Inscrever PM na Atividade DEJEM"** (`sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/EscOpeDel.aspx`) "muito zoom" — o layout é desktop largo (~980px) e ao forçar `device-width` o conteúdo estoura horizontalmente e cada elemento fica gigante.

## Correção em `android-plugin/InAppWebViewActivity.kt` — função `injectMobileViewport`

Trocar a regra única por **três trilhas distintas** por URL:

1. **Login PMESP** (`/login.aspx` ou `/autenticacaosegura.aspx` em qualquer host `*.policiamilitar.sp.gov.br`):
   → mantém exatamente como está hoje: `width=device-width, initial-scale=1, maximum-scale=5` + CSS pesado de saneamento (inputs grandes, botão azul, overlay "Entrando…"). **Sem mudança** — o usuário confirmou que está perfeito.

2. **Intranet de sistemas pós-login** (host = `sistemasadmin.intranet.policiamilitar.sp.gov.br`, qualquer path que **não seja** login):
   → injeta apenas meta-viewport `width=980, initial-scale=0.38, minimum-scale=0.3, maximum-scale=3, user-scalable=yes`. Isso mostra o layout desktop original cabendo na tela (zoom-out automático), preservando o menu lateral e o formulário, e o usuário ainda pode dar pinch-to-zoom pra ler. Sem CSS extra — não mexe no HTML legado.

3. **Qualquer outro host** (inclui `correio.policiamilitar.sp.gov.br` do **iNotes**, `ciaf.policiamilitar.sp.gov.br` da folha, etc.):
   → **nenhuma injeção**. Volta ao comportamento original do WebView, que era o que o usuário disse estar bom.

## Detalhes técnicos

- O dispatcher fica numa única função: detecta `(isLoginPmesp, isSistemasAdminPosLogin)` via `Uri.parse(url)`, e cada ramo monta o JS apropriado (ou retorna sem fazer nada).
- O bloco do overlay "Entrando…" e os listeners de `submit` continuam **só no ramo 1 (login)**.
- O cálculo de `initial-scale=0.38` é aproximado pra tela típica de 360 CSS px (`360 / 980 ≈ 0.367`). Uso `0.38` que dá folga de 1-2% sem cortar conteúdo. Se ficar pequeno demais ou grande demais, ajustamos pra `0.42` ou `0.34` depois do seu teste.

## Arquivo afetado

- `android-plugin/InAppWebViewActivity.kt` (só `injectMobileViewport`)

Sem mudanças em TS/React.
