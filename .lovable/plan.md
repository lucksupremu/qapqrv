# Ajustes no navegador interno (InAppWebViewActivity)

Duas correções pontuais em `android-plugin/InAppWebViewActivity.kt`. Nenhuma mudança em código web/React.

## 1. Parar o reload ao arrastar pra baixo no DEJEM/Delegada

Hoje o `SwipeRefreshLayout` envolve a WebView inteira e dispara `webView.reload()` em qualquer pull-down — inclusive nas telas pós-login da intranet (DEJEM, Delegada, SIRH...), onde o gesto natural de rolagem acaba recarregando a página e perdendo o estado.

**Como corrigir:** dentro de `injectMobileViewport(url)`, no ramo `isSistemasAdminPos` (linha ~656), além do viewport já injetado, desativar o swipe-to-refresh:

```kotlin
swipeRefresh.isEnabled = false
```

E reabilitar nos demais ramos (login PMESP e ramo 3 "outros hosts") com `swipeRefresh.isEnabled = true`, para não vazar o estado entre páginas dentro da mesma sessão de navegação.

## 2. Barra superior com Voltar / Fechar / Recarregar

Hoje só existem dois botões flutuantes no rodapé (× e ⋮) e nada no topo. Adicionar uma barra fina ancorada no topo (logo abaixo da status bar) com três `ImageButton`:

```text
┌──────────────────────────────────────────┐
│  ←        ⟳                          ×  │  ← barra translúcida no topo
├──────────────────────────────────────────┤
│                                          │
│            conteúdo da WebView           │
```

- **←** Voltar: `if (webView.canGoBack()) webView.goBack()`
- **⟳** Recarregar: `webView.reload()`
- **×** Fechar: `finish()` (mesma ação do FAB atual)

Detalhes de implementação:
- Adicionar em `buildLayout()` um `LinearLayout` horizontal com fundo `0x66000000` (semi-transparente, igual ao estilo dos FABs), altura ~44dp, ancorado em `Gravity.TOP` com `topMargin = statusBarHeight()`.
- Reaproveitar o helper `floatingButton(...)` ou criar `ImageButton`s simples com `setColorFilter(Color.WHITE)`.
- Como agora existe a barra superior com × e ⟳, o FAB × inferior fica redundante — **remover o `btnClose` flutuante de baixo** e manter só o `btnOverflow` (⋮) no canto inferior direito.
- Aplicar o mesmo `attachFloatingAutoFade` à nova barra para ela ficar translúcida (alpha 0.30) após 1.5s sem interação, igual aos FABs, evitando cobrir conteúdo de login.
- A `progressBar` (linha 460) já fica no topo com `topMargin = statusBarHeight()` — deslocar para `topMargin = statusBarHeight() + dp(44)` para ficar logo abaixo da nova barra.

## Arquivos alterados

- `android-plugin/InAppWebViewActivity.kt` (único arquivo)

Como o build do APK roda no GitHub Actions, as mudanças só aparecem no app depois do próximo build.
