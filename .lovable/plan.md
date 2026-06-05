## Objetivo

1. **Reduzir drasticamente o tamanho do APK** (hoje ~70–90 MB por causa do GeckoView do Firefox embutido).
2. **Corrigir o navegador interno** que vinha quebrando em loop (erros de Kotlin, certificado, tela branca em iNotes/folha).

---

## Diagnóstico

O GeckoView (`org.mozilla.geckoview:geckoview`) é responsável por:
- ~60–70 MB do APK final (bibliotecas nativas `.so` por arquitetura).
- Boa parte das falhas de build recentes (incompatibilidade `minSdk`, Kotlin metadata 2.3 vs 2.1, assinaturas de delegate quebradas, `remoteDebuggingService` inexistente, ERR_50 de certificado).
- Atrito permanente: cada update do GeckoView muda APIs internas e quebra o build.

O Android já tem um motor web nativo embutido no sistema (**Android System WebView**, baseado no Chromium). Ele:
- Adiciona **0 MB** ao APK (já está no aparelho).
- É o mesmo motor que o Capacitor já usa para rodar o app web.
- Suporta tudo que o iNotes/folha precisa: cookies, JS, popups, downloads, certificados customizados.
- Permite aceitar certificados específicos da PMESP via `onReceivedSslError` apenas para domínios confiáveis.

A justificativa original para o GeckoView (“independente do System WebView”) não compensa o custo: praticamente todo Android ≥ 7 tem WebView atualizada via Play Store automaticamente.

---

## Plano

### 1. Trocar o motor do navegador interno: GeckoView → Android WebView

Reescrever `android-plugin/InAppWebViewActivity.kt` usando `android.webkit.WebView` em vez de `GeckoView`. Mantém a mesma Activity, mesma toolbar, mesmos botões (voltar/avançar/recarregar/fechar), mesmo overlay de loading e de erro.

Configuração da WebView para compatibilidade total com sites legados da PMESP:
- `javaScriptEnabled = true`
- `domStorageEnabled = true`
- `databaseEnabled = true`
- `useWideViewPort = true`, `loadWithOverviewMode = true`
- `setSupportZoom(true)`, `builtInZoomControls = true`, `displayZoomControls = false`
- `mixedContentMode = MIXED_CONTENT_ALWAYS_ALLOW` (intranet usa http em alguns endpoints)
- `userAgentString = <UA mobile recebido do app>`
- `CookieManager.setAcceptCookie(true)` e `setAcceptThirdPartyCookies(webView, true)`
- `setSupportMultipleWindows(true)` + `onCreateWindow` que carrega o link na própria WebView (corrige tela branca de popups do iNotes).

### 2. Tratar certificado da PMESP corretamente

No `WebViewClient.onReceivedSslError`:
- Se o host for `*.policiamilitar.sp.gov.br` (ou `correio.policiamilitar.sp.gov.br`): `handler.proceed()` (aceita).
- Qualquer outro host: `handler.cancel()` e mostra o overlay de erro com mensagem clara.

Em `onReceivedError` / `onReceivedHttpError`: mostra overlay com botão “Tentar novamente” e dica de VPN se for domínio de intranet.

### 3. Downloads (PDFs de escala, etc.)

Manter `DownloadListener` da WebView usando o `DownloadManager` do Android — mesmo comportamento que já existe hoje, sem precisar de `WebResponse` do GeckoView.

### 4. Remover GeckoView do build

Em `android-plugin/install.sh`:
- Remover a dependência `org.mozilla.geckoview:geckoview`.
- Remover a injeção do repositório `maven.mozilla.org` (não é mais necessária).
- Manter `minSdkVersion 24` (WebView funciona desde API 21, então não precisa mais forçar 26).
- Manter `multiDexEnabled` (inofensivo).

### 5. Encolher mais o APK (ganho adicional ~30–40%)

No `android/app/build.gradle`, no bloco `buildTypes.debug` e `release`:
- `minifyEnabled true` + `shrinkResources true` (com `proguard-rules.pro` padrão do Capacitor).
- `splits.abi { enable true; reset(); include 'armeabi-v7a','arm64-v8a','x86_64'; universalApk false }` — gera 3 APKs pequenos por arquitetura em vez de um universal gigante.

O workflow `.github/workflows/build-apk.yml` passa a publicar como artefato a pasta `android/app/build/outputs/apk/debug/` inteira (3 APKs pequenos), e adicionamos um passo extra para listar tamanhos no log.

### 6. Validar

- Build do APK no GitHub Actions deve passar sem erros de Kotlin/Gecko.
- Tamanho esperado por APK: **~6–10 MB** (vs ~80 MB hoje).
- Testes manuais sugeridos: abrir iNotes, abrir folha de pagamento, abrir um PDF de escala, ligar VPN AnyConnect e confirmar acesso.

---

## Arquivos a alterar

- `android-plugin/InAppWebViewActivity.kt` — reescrita completa (Gecko → WebView).
- `android-plugin/install.sh` — remove dependência/maven do Gecko, ajusta minSdk, adiciona splits ABI e minify no `app/build.gradle`.
- `.github/workflows/build-apk.yml` — upload da pasta de APKs e log de tamanhos.
- `src/lib/in-app-browser.ts` / `src/lib/in-app-webview.ts` — sem mudanças (interface do plugin permanece a mesma).

## Risco

Baixo. O Android System WebView está disponível em 100% dos aparelhos Android 7+ via Play Store e é o mesmo motor que o app já usa para sua própria UI. Se um aparelho específico tiver WebView desatualizada, o Play Store atualiza automaticamente.