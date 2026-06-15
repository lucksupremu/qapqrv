## Problema

A top bar nova ficou flutuando por cima do WebView, cobrindo a área clicável do topo da página (no print, o `×` cobre o conteúdo). O WebView ocupa `MATCH_PARENT` sem nenhum `topMargin`, então a barra fica sobreposta em vez de empurrar o conteúdo para baixo.

## Correção

Em `android-plugin/InAppWebViewActivity.kt`, no `buildLayout()`:

1. **Empurrar o `swipeRefresh` (que contém o WebView) para baixo da barra** — alterar o `FrameLayout.LayoutParams` nas linhas 426-429 para incluir:
   ```kotlin
   topMargin = statusBarHeight() + dp(44)
   ```
   Assim a página inicia abaixo da barra superior e nada do conteúdo fica coberto.

2. **Fundo opaco na `topBar`** — trocar o `0x66000000` (semitransparente) por um fundo sólido (`TOOLBAR_BG` ou `0xFF000000`) para a barra ter aparência de toolbar real e não de overlay flutuante. Remover também o `attachFloatingAutoFade` da `topBar` (mantendo-o apenas no `btnOverflow`), já que ela agora é parte do layout, não um overlay.

3. **Manter `progressBar` como está** — já fica em `topMargin = statusBarHeight() + dp(44)`, agora alinhado ao topo do WebView.

4. **`errorOverlay`** — também precisa do mesmo `topMargin = statusBarHeight() + dp(44)` para não ficar atrás da barra quando aparece.

Nenhuma outra mudança. Sem alterações em código web/React.

## Arquivo afetado

- `android-plugin/InAppWebViewActivity.kt`
