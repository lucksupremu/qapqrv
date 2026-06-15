## Objetivo

1. Parar o **crash "abre e fecha sozinho"** no cold start do APK.
2. Entregar um **navegador interno mais robusto**: Chrome Custom Tabs para links genéricos + WebView turbinada para a intranet PMESP.

---

## Parte 1 — Fix do cold-start crash

A causa mais provável: no `src/routes/__root.tsx`, no primeiro `useEffect`, três coisas pesadas disparam **ao mesmo tempo**, logo no primeiro frame do APK:

- `warmupIntranetSession()` → cria uma `WebView` invisível na UI thread.
- `initAdMob()` → `MobileAds.initialize` + `loadAd()`.
- `showAppOpenAd()` chamado **na hora** que o init resolve, antes da Activity estar 100 % visível.

Duas WebViews (Capacitor + warm-up) sendo criadas em paralelo com inicialização de AdMob é um padrão conhecido de ANR/crash silencioso em vários devices Android.

**Mudanças:**

1. **`src/routes/__root.tsx`** — bloco de cold start nativo:
   - Envolver tudo num `requestIdleCallback` / `setTimeout(..., 1500)` para dar tempo da Activity inflar.
   - **Não mostrar App Open Ad no cold start.** Seguindo a recomendação do próprio Google AdMob, o App Open Ad deve aparecer **só no warm resume** (volta de background longo). Manter apenas o pré-load no cold start. Isso elimina a janela em que o ad fullscreen aparece em cima de uma Activity recém-criada.
   - Encadear o warm-up da intranet **depois** do AdMob init resolver (não em paralelo), com `setTimeout(..., 3000)` extra.
   - Envolver cada `import(...).then(...)` num `.catch(console.warn)` para evitar unhandled rejection.

2. **`src/lib/admob.ts`** — `showAppOpenAd`:
   - Adicionar parâmetro `opts?: { trigger: "cold" | "resume" }`. Se `trigger === "cold"`, **só pré-carrega** e retorna sem mostrar.
   - Aumentar `MIN_INTERVAL_MS` para 5 min (já era 4).

3. **`android-plugin/AppOpenAdPlugin.kt`** — `show()`:
   - Antes de `ad.show(activity)`, checar `activity.isFinishing || activity.isDestroyed` e abortar com `not_ready`. Evita crash quando o resume foi cancelado.
   - Envolver `MobileAds.initialize` num `try/catch` que resolve `initialized=false` em vez de rejeitar — assim o JS nunca quebra.

4. **`android-plugin/InAppWebViewPlugin.kt`** — `warmupIntranet`:
   - Adiar `wv.loadUrl(url)` para `Handler.postDelayed(..., 800)` depois da criação da WebView, dando tempo do processo WebView estabilizar.
   - Já tem `try/catch` global; ok.

5. **Telemetria** (opcional, mas barato): em `__root.tsx`, registrar `window.addEventListener("error", …)` e `unhandledrejection` que loga via `reportLovableError` para capturar o que sobrar.

---

## Parte 2 — Navegador interno mais robusto

### 2a. Chrome Custom Tabs para links externos genéricos

Hoje **todo** link externo cai no `InAppWebViewActivity`. Para sites quaisquer (notícias, Google, YouTube etc.), Custom Tabs é melhor: usa o Chrome do usuário, herda autofill/senhas, tem dark mode automático, é mais rápido e ocupa zero MB.

- **Novo arquivo `android-plugin/CustomTabsPlugin.kt`** (plugin Capacitor `CustomTabs`):
  - Método `open({ url, toolbarColor })` usa `androidx.browser.customtabs.CustomTabsIntent.Builder()`.
  - Cor da toolbar `#2e6b8a` (igual ao tema do app).
  - Fallback: se não houver Chrome/handler, faz `Intent(ACTION_VIEW)` normal.
  - Dependência já vem com o Capacitor (`androidx.browser`).

- **Novo arquivo `src/lib/custom-tabs.ts`** — wrapper com `registerPlugin<CustomTabsPlugin>`.

- **`src/lib/in-app-browser.ts`** — `openInAppBrowser`:
  - Se `isNativeApp()` **e** o host **não** for `*.policiamilitar.sp.gov.br` **e** não houver `opts.forceWebview`, abrir via Custom Tabs.
  - Senão, manter `InAppWebView.open(...)` (intranet PMESP continua na WebView interna por causa de autofill, cookies, TLS relaxado, PDFs).
  - Adicionar `opts.forceWebview?: boolean` ao tipo `AbrirOpts`.

### 2b. WebView interna turbinada (`InAppWebViewActivity.kt`)

Layout novo, mantendo o esquema visual atual:

```text
┌──────────────────────────────────────────┐
│ [×]  [host editável ▼ ]  [⋮]             │ toolbar
├──────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░     │ progress
│                                          │
│            CONTEÚDO WEB                  │
│                                          │
├──────────────────────────────────────────┤
│  ←     →     ↻     🔍     ⤓              │ bottom bar
└──────────────────────────────────────────┘
```

Adições:
- **Campo de URL editável** na toolbar (TextView vira `EditText` com `imeOptions=actionGo`); ao confirmar, carrega `loadUrl`. Mostra `host` quando não está focado.
- **Menu de overflow `⋮`** (`PopupMenu`) com:
  - "Compartilhar link" → `Intent.ACTION_SEND`.
  - "Copiar link" → `ClipboardManager`.
  - "Abrir no Chrome" → `Intent(ACTION_VIEW)` forçando `setPackage` do Chrome se presente.
  - "Modo desktop" (toggle) → alterna `userAgentString` entre o mobile atual e UA desktop + `useWideViewPort/loadWithOverviewMode`.
  - "Buscar na página" → abre overlay com `EditText` que chama `webView.findAllAsync(q)` + `findNext(true/false)`.
  - "Limpar cache desta sessão" → `webView.clearCache(false)` + `clearHistory()`.
- **Bottom bar** com Back / Forward / Reload / Find / Downloads (atalho para abrir `Environment.DIRECTORY_DOWNLOADS`).
- **Estabilidade**: já tem; manter trust-relaxado restrito a `*.policiamilitar.sp.gov.br`.
- **Long-press em link** (`setOnCreateContextMenuListener` + `WebView.HitTestResult`): "Abrir em nova aba" → empilha `Intent` para outra `InAppWebViewActivity`; "Copiar link"; "Compartilhar".
- **Pull-to-refresh**: envolver o `WebView` num `SwipeRefreshLayout` (já está no `androidx.swiperefreshlayout`, que vem com Capacitor).
- **Toast de progresso de download** → trocar pelo já existente `DownloadManager` + um `BroadcastReceiver` em `DownloadManager.ACTION_DOWNLOAD_COMPLETE` que mostra "Download concluído — abrir?" como `Toast` clicável (na verdade Snackbar não dá em Activity sem CoordinatorLayout, então usar `AlertDialog` simples).

### 2c. JS — nada quebra

`openInAppBrowser` continua com a mesma assinatura. Quem chama `openInAppBrowser(url, { modo: "webview" })` (ex.: `intranet.tsx`) força WebView via novo `opts.forceWebview = true` (mapear `modo === "webview"` para isso, sem mudar callsites).

---

## Detalhes técnicos

- Plugins novos a registrar no `MainActivity.java` do APK (instruções no `android-plugin/install.sh`): `CustomTabs`. Atualizar o `install.sh` para copiar o novo `.kt` e adicionar a linha `registerPlugin(CustomTabsPlugin.class);`.
- Dependência `androidx.browser:browser` — já vem transitivamente do Capacitor 6. Se faltar, adicionar `implementation "androidx.browser:browser:1.8.0"` ao `app/build.gradle` via patch no `.github/scripts/patch-gradle-signing.py` (ou doc no `APK-BUILD.md`).
- O usuário precisa rodar `git pull` + `npx cap sync android` + rebuild do APK (workflow `build-apk.yml`) para o crash-fix e Custom Tabs subirem. Mudanças JS-only (admob.ts, __root.tsx, in-app-browser.ts) já valem na PWA imediatamente.

---

## Arquivos tocados

**Editados**
- `src/routes/__root.tsx` (delay + ordering + error handlers)
- `src/lib/admob.ts` (`trigger: "cold" | "resume"`)
- `src/lib/in-app-browser.ts` (roteia para Custom Tabs)
- `android-plugin/AppOpenAdPlugin.kt` (guard `isFinishing`/`isDestroyed`)
- `android-plugin/InAppWebViewPlugin.kt` (delay no warmup)
- `android-plugin/InAppWebViewActivity.kt` (URL bar, menu, find, desktop mode, pull-to-refresh, long-press)
- `android-plugin/install.sh` (registrar CustomTabs)
- `APK-BUILD.md` (nota sobre `androidx.browser`)

**Criados**
- `android-plugin/CustomTabsPlugin.kt`
- `src/lib/custom-tabs.ts`

Nenhuma mudança de dependência npm. Nenhuma alteração de backend.
