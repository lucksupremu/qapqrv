## O que muda na prática

**Antes:** navegador interno com toolbar grande, URL bar, barra inferior de 4 botões, look de "browser dos anos 2010". PDF abre num viewer próprio meia-boca. Intranet tem tela e fluxo separados.

**Depois:** um navegador único, imersivo, estilo Instagram/Twitter — só conteúdo + × flutuante + barra de progresso fina. Gestos para tudo. PDF nunca abre no app — vai direto pro Drive/Adobe do usuário (Android escolhe). Intranet vira "só mais um link" usando o mesmo navegador, com cofre e Salvar escala virando itens do menu ⋮.

---

## Parte 1 — Navegador interno imersivo (estilo Instagram)

Refatora `android-plugin/InAppWebViewActivity.kt` do zero.

### Layout final

```text
┌──────────────────────────────────────────┐
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ progress 2dp (some quando carrega)
│ [×]                            [⋮]      │ overlay flutuante autohide (3s)
│                                          │
│            CONTEÚDO WEB                  │
│         (ocupa quase tudo)               │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

- Sem toolbar fixa, sem URL bar, sem barra inferior.
- Status bar do Android translúcida com ícones brancos (modo edge-to-edge).
- × e ⋮ flutuantes em pílulas semi-transparentes — somem 3s depois do load; reaparecem ao tocar/scrollar para cima.

### Gestos

- **Swipe da borda esquerda → direita**: `webView.goBack()`. Se sem histórico, fecha.
- **Swipe vertical pra baixo no topo da página** (quando `scrollY == 0`): fecha a Activity com animação slide-down.
- **Pull-to-refresh** (`SwipeRefreshLayout` envolvendo a WebView): recarrega.
- **Botão voltar do Android**: igual swipe-esquerda.
- **Long-press em link**: mini bottom-sheet com Copiar / Compartilhar / Abrir em nova aba.

### Menu ⋮

`PopupMenu` ancorado no botão:
- Compartilhar link
- Copiar link
- Abrir no Chrome
- Modo desktop (toggle UA + viewport)
- Buscar na página (`findAllAsync`)
- **Salvar escala** (só aparece quando a URL bate em `arrelconesc.aspx`/`nuesc=` — antigo botão da rota intranet vira item de menu)
- Limpar cache/cookies desta sessão

### Confiabilidade

- Mantém o trust relaxado restrito a `*.policiamilitar.sp.gov.br`.
- Mantém autofill nativo do Android (input attributes já estão prontos no app, e na WebView com Android Autofill ativo o usuário usa o serviço dele).
- Download de PDF/arquivo: continua via `DownloadManager`, mas em vez de Toast simples, mostra `AlertDialog` "Download concluído — abrir?" via `BroadcastReceiver`.

---

## Parte 2 — PDF delegado pro Drive/Adobe

### Remover o viewer interno

- `android-plugin/PdfViewerActivity.kt`: **deletado**.
- Plugin `InAppWebView`: método `openPdf` passa a fazer a mesma coisa que `openPdfExternal` (mantém a assinatura, evita quebrar callsites).
- `openPdfExternal` (já existente) usa `Intent(ACTION_VIEW)` com `application/pdf` + `FileProvider`, com flag `CATEGORY_DEFAULT`. Android mostra o seletor "Abrir com…" se houver mais de um app de PDF; do contrário abre o padrão (Drive/Adobe/Samsung Reader/etc.).
- Se **nenhum app de PDF** estiver instalado: fallback abre o PDF dentro do novo navegador imersivo via `file://` + `application/pdf` (a WebView mostra ou oferece download). Mostra Toast: "Instale o Google Drive ou Adobe Reader para uma experiência melhor".

### Callsites — nada muda no JS

`escala-viewer.$id.tsx`, `escalas-baixadas.tsx`, `index.tsx` continuam chamando `InAppWebView.openPdf(...)` e `openPdfExternal(...)`. Por baixo dos panos, ambos agora delegam pro app de PDF do usuário.

---

## Parte 3 — Unificar intranet PMESP

### Tela `/intranet` deixa de existir como WebView customizada

`src/routes/intranet.tsx` vira um **redirecionador**:
1. Se cofre habilitado, abre `UnlockPinModal` direto.
2. Ao desbloquear (ou se sem cofre), chama `InAppWebView.setAutofillCredentials(creds)` (se houver) e abre o navegador imersivo (`openInAppBrowser` SEM `modo: webview` — agora todos usam o mesmo navegador) e `navigate({ to: "/" })`.
3. Sem `<iframe>`, sem header próprio, sem barra inferior, sem botão "Salvar escala" duplicado.

### Botão "Salvar escala" migra pro menu ⋮ do navegador

Lado Kotlin (`InAppWebViewActivity`):
- Quando a URL atual contém `arrelconesc.aspx` ou `?nuesc=`, o item "Salvar escala" aparece no `PopupMenu`.
- Ao clicar, dispara um evento JS (`window.dispatchEvent(new CustomEvent('lovable:salvar-escala', { detail: { url } }))`) **ou** chama de volta o JS via `evaluateJavascript`. Mais simples: o plugin Kotlin emite um evento Capacitor `intranetSalvarEscala` com `{ url, id }`, e um listener registrado em `__root.tsx` faz o mesmo que `salvarEscala()` fazia em `intranet.tsx` (`upsertEscala` + `baixarPdfEmBackground`).

### `credential-vault-card.tsx` e cofre

Sem mudança — continua funcionando. Só a tela `/intranet` muda.

---

## Detalhes técnicos

### Arquivos editados

- `android-plugin/InAppWebViewActivity.kt` — refatorado para layout imersivo (SwipeRefreshLayout + WebView + overlays flutuantes), gestos (`GestureDetector` para swipe-down e edge-swipe), menu ⋮ via `PopupMenu`, item dinâmico "Salvar escala", emissão de evento Capacitor.
- `android-plugin/InAppWebViewPlugin.kt` — `openPdf` agora delega para `openPdfExternal`. Adiciona `notifyListeners("intranetSalvarEscala", …)`.
- `src/lib/in-app-webview.ts` — adiciona tipo do evento `addListener('intranetSalvarEscala', cb)`.
- `src/lib/in-app-browser.ts` — remove a ramificação `useWebview` que separava PMESP; agora **todos os links nativos** vão pra WebView interna nova (Custom Tabs deixa de ser usada — usuário pediu "nada fora do app"). Pode manter `CustomTabs` no menu ⋮ "Abrir no Chrome" se quiser, mas não como padrão.
- `src/routes/intranet.tsx` — reduzida a ~50 linhas: só PIN modal + abrir navegador + voltar.
- `src/routes/__root.tsx` — registra listener `intranetSalvarEscala` que chama `upsertEscala` + `baixarPdfEmBackground`.

### Arquivos removidos

- `android-plugin/PdfViewerActivity.kt`
- `src/lib/custom-tabs.ts` (opcional — manter se quiser usar para "Abrir no Chrome" no menu)
- `android-plugin/CustomTabsPlugin.kt` (idem)

### Sem nova dependência

- Não usa AndroidPdfViewer (você escolheu delegar pro Drive/Adobe).
- `androidx.swiperefreshlayout` e `androidx.core` já vêm com Capacitor.
- APK final fica **menor** (sem PdfViewerActivity + sem libs de render PDF).

### Build

Mudanças Kotlin exigem rebuild do APK pelo workflow `build-apk.yml`. Mudanças JS valem na hora.

---

## Limitações honestas

- **Sem app de PDF instalado**: usuário precisa instalar Drive/Adobe (Toast informa). 99% dos Android já vêm com Drive.
- **Autofill na WebView**: depende do "Serviço de preenchimento automático" do Android estar configurado (Google, 1Password, Bitwarden). O cofre interno com PIN continua sendo o fallback robusto.
- **Cookies/sessão por site**: cada abertura do navegador interno compartilha cookies (mesma WebView do app). Item "Limpar sessão" do menu ⋮ reseta.
