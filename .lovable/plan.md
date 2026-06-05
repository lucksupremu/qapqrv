## Bug 1 — PDF abre em branco no APK

**Causa**
Após o download, o app tenta abrir no visualizador interno (`PdfViewerActivity` com `PdfRenderer` nativo do Android). O `PdfRenderer` não consegue renderizar muitos PDFs da PMESP (gerados pelo Crystal Reports/aspx) — não suporta PDFs criptografados, com formulários AcroForm ou versões mais novas, e quando falha silenciosamente entrega bitmaps em branco. No app web isso "funciona" porque o Chrome usa o PDFium completo.

**Correção**
Inverter a ordem: abrir **sempre primeiro no leitor de PDF do aparelho** (Google PDF Viewer / Drive / Adobe), que é o que o usuário pediu. O visualizador interno vira apenas fallback caso não exista nenhum leitor instalado.

- `src/routes/index.tsx` (`handleConsultar`): após `downloadPdf`, chamar `openPdfExternal` primeiro; se falhar, tentar `openPdf` interno; se ambos falharem, mostrar mensagem clara com o erro real (não a mensagem genérica de "sem leitor").
- `src/routes/escalas-baixadas.tsx` (`handleAbrir`): mesma inversão.
- `android-plugin/InAppWebViewPlugin.kt` (`openPdfExternal`): usar `packageManager.queryIntentActivities(intent, 0)` antes do `createChooser` para diferenciar "nenhum leitor instalado" de "leitor falhou", e propagar a mensagem real. Caso a lista esteja vazia, rejeitar com código `NO_VIEWER` para o JS decidir o fallback interno.

## Bug 2 — App fecha ao voltar do AnyConnect

**Causa**
Dois problemas combinados:

1. `MainActivity` (Capacitor `BridgeActivity`) não declara `android:launchMode` nem `configChanges` para mudanças de rede/VPN. Quando o AnyConnect altera a interface de rede, o Android recria a Activity; com pouca RAM o processo é finalizado em background e ao retornar o sistema cria uma task nova → o app "fecha" (na verdade reinicia em estado vazio e às vezes morre antes de pintar).
2. Em `src/routes/__root.tsx`, o listener `appStateChange` chama `showAppOpenAd()` toda vez que o app volta a ficar ativo. Ao retornar do AnyConnect, isso dispara o App Open Ad antes do bridge estar pronto e pode derrubar a Activity recém-criada.

**Correção**

- `android-plugin/install.sh`: ao reescrever `MainActivity`, registrar também no `AndroidManifest.xml` os atributos `android:launchMode="singleTask"`, `android:alwaysRetainTaskState="true"` e `android:configChanges="orientation|screenSize|keyboardHidden|keyboard|screenLayout|uiMode|smallestScreenSize"`. Adicionar um `sed` que faz patch idempotente da tag `<activity android:name=".MainActivity" ...>` existente.
- `src/routes/__root.tsx`: só chamar `showAppOpenAd()` no `appStateChange` quando o app ficou em background por mais de 30 segundos (registrar timestamp em `pause`/`isActive=false`). Envolver a chamada em `try/catch`. Mantém o ad em cold start.
- `src/lib/admob.ts`: já tem cooldown de 4 min — manter, mas garantir que `showAppOpenAd` nunca propague exceções (já trata, OK).

## Detalhes técnicos

- Não mexer no `client.ts`, `types.ts` nem em arquivos auto-gerados.
- `InAppWebView` em `src/lib/in-app-webview.ts` não precisa de mudança — assinaturas já existem.
- `PdfViewerActivity.kt` continua no projeto como fallback, sem alterações.
- Testar fluxo no APK: consultar escala → deve abrir o seletor "Abrir PDF com" (Google PDF, Drive, etc.). Em "Escalas baixadas" → idem.
- Testar abrir AnyConnect e voltar: app deve resumir a Home, sem fechar.

## Arquivos a alterar

1. `src/routes/index.tsx` — inverter ordem em `handleConsultar`.
2. `src/routes/escalas-baixadas.tsx` — inverter ordem em `handleAbrir`.
3. `android-plugin/InAppWebViewPlugin.kt` — `openPdfExternal` retorna `NO_VIEWER` quando lista de apps vazia.
4. `android-plugin/install.sh` — patch idempotente em `MainActivity` no manifest com `launchMode` + `configChanges` + `alwaysRetainTaskState`.
5. `src/routes/__root.tsx` — gating de tempo no `appStateChange` para o App Open Ad.