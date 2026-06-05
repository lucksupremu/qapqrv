
## Objetivo

Trocar o navegador interno atual (`@capacitor/inappbrowser`, que está com problemas de UA/renderização) por uma **WebView Android nativa customizada**, empacotada como plugin Capacitor próprio dentro do projeto. Isso dá controle total sobre User-Agent, cookies, JavaScript, zoom, downloads e botão "voltar" — resolvendo de vez o acesso à intranet PMESP no APK.

## O que muda

### 1. Novo plugin Capacitor local: `InAppWebView`

Criar `android-plugin/InAppWebViewPlugin.kt` (e arquivos de suporte) que registra um plugin Capacitor com um método `open({ url, title, userAgent })`. Esse método abre uma `Activity` Android nativa contendo:

- Toolbar superior com título, botão fechar, recarregar, voltar/avançar
- `android.webkit.WebView` em tela cheia com:
  - `javaScriptEnabled = true`
  - `domStorageEnabled = true`
  - `setSupportZoom(true)` + pinch-to-zoom
  - `userAgentString` configurável (default: UA mobile Chrome)
  - `CookieManager.setAcceptThirdPartyCookies(true)` (essencial pra .gov.br)
  - `WebViewClient` customizado pra interceptar `http://` (intranet sem TLS) e erros SSL
  - `setDownloadListener` pra baixar PDFs de escala direto pro `Downloads/`
- Barra inferior com voltar/avançar/recarregar/compartilhar

Registrar o plugin no `MainActivity.java` gerado pelo Capacitor (via patch no CI).

### 2. Substituir `src/lib/in-app-browser.ts`

- No nativo: chama `InAppWebView.open({ url, title, userAgent })` em vez de `@capacitor/inappbrowser`.
- No web: mantém `window.open` como hoje.
- Remove toda a lógica de fallback pra Custom Tabs, listeners de `browserPageLoaded`, timeout de 22s — não são mais necessários.

### 3. Remover dependência `@capacitor/inappbrowser`

- `bun remove @capacitor/inappbrowser`
- Reverter o patch de `minSdkVersion 26` no workflow (volta pra 24, que é o default do Capacitor) — o requisito de SDK 26 vinha desse plugin.

### 4. Atualizar `src/routes/intranet.tsx`

Continua redirecionando pro novo plugin quando `isNativeApp()`, só muda a chamada interna (transparente — já usa `openInAppBrowser`).

### 5. Patch no workflow `.github/workflows/build-apk.yml`

Adicionar step após `cap sync android` que:
1. Copia `android-plugin/InAppWebViewPlugin.kt` (e `AndroidManifest.xml` da nova Activity) para dentro de `android/app/src/main/java/br/com/qapqrv/app/plugins/`.
2. Registra o plugin no `MainActivity.java` (adiciona `registerPlugin(InAppWebViewPlugin.class)`).
3. Adiciona a `<activity android:name=".plugins.InAppWebViewActivity" />` no `AndroidManifest.xml`.
4. Mantém o patch do AdMob `APPLICATION_ID` (já funcionando).

## Detalhes técnicos

**Por que plugin próprio e não fork do `@capacitor/inappbrowser`?**
O OutSystems plugin abstrai demais e não expõe `WebSettings` cruas — não dá pra configurar cookies de terceiros nem interceptar erros SSL. Plugin próprio = 1 arquivo Kotlin + 1 layout XML, totalmente sob controle.

**Estrutura de arquivos do plugin:**
```text
android-plugin/
├── InAppWebViewPlugin.kt        (registra @CapacitorPlugin, método open)
├── InAppWebViewActivity.kt       (Activity com WebView)
├── activity_webview.xml          (layout: Toolbar + WebView + BottomBar)
└── install.sh                    (copia arquivos pra android/ no CI)
```

**Compatibilidade com VpnStatusPlugin existente:** já existe `android-plugin/VpnStatusPlugin.kt` no projeto — vou seguir o mesmo padrão de instalação via script no CI, então a infraestrutura já está parcialmente lá.

**TypeScript wrapper:** novo arquivo `src/lib/in-app-webview.ts` declara o plugin via `registerPlugin<InAppWebViewPlugin>('InAppWebView')` do `@capacitor/core`.

## Riscos

- **Primeiro build pode falhar** se o patch do `MainActivity.java` quebrar a sintaxe — vou validar o sed com `grep` antes do gradle.
- **Renderização da intranet PMESP** depende do servidor aceitar o UA + cookies — se ainda assim bloquear, plano B é adicionar header `X-Requested-With` customizado.

## Entregáveis

1. `android-plugin/InAppWebViewPlugin.kt`
2. `android-plugin/InAppWebViewActivity.kt`
3. `android-plugin/activity_webview.xml`
4. `android-plugin/install.sh` (idempotente, roda no CI)
5. `src/lib/in-app-webview.ts` (wrapper TS)
6. `src/lib/in-app-browser.ts` reescrito pra usar o novo plugin
7. `.github/workflows/build-apk.yml` com novo step de instalação
8. `package.json` sem `@capacitor/inappbrowser`

Depois de aprovar, faço todas as mudanças num único batch e você roda o workflow pra gerar o novo APK.
