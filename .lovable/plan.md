## O que vou corrigir

### 1) Visualizador de PDF no APK (escala consultada)
Hoje o `PdfViewerActivity` nativo só mostra páginas como imagens fixas — não tem zoom nem botões de ação. Vou adicionar:

- **Pinch-to-zoom + duplo-toque**: envolver cada página numa view com `ScaleGestureDetector` (zoom de 1x a 5x) preservando o scroll vertical entre páginas.
- **Botão "Compartilhar / Abrir com outro app"** na toolbar: dispara `Intent.ACTION_SEND` (com `application/pdf`) via `FileProvider`, mostrando o chooser do Android — o usuário escolhe Drive, Gmail, WhatsApp, leitor de PDF externo, etc.
- **Botão "Salvar / Baixar"** na toolbar: usa `MediaStore.Downloads` (Android 10+) ou `ACTION_CREATE_DOCUMENT` para o usuário escolher a pasta e salvar o PDF na memória do aparelho.

Arquivo afetado: `android-plugin/PdfViewerActivity.kt`.

### 2) Vídeo do guia AnyConnect no APK
Hoje `tutorial.mp4.asset.json` traz `url: "/__l5e/assets-v1/..."` — caminho relativo. Na web abre como `https://qapqrv.lovable.app/__l5e/...` e funciona. No APK o app roda em `https://localhost` (Capacitor) e esse caminho não existe localmente, então o vídeo nunca carrega.

Correção: ao montar o `<video>`, se estiver rodando no Capacitor (nativo), prefixar a URL com o host publicado (`https://qapqrv.lovable.app`) para que o `src` aponte para o domínio público. Na web fica como está (URL relativa).

Arquivo afetado: `src/routes/anyconnect.tsx` (lógica simples de `isNativeApp()` + base URL).

### Detalhes técnicos

- `FileProvider` (authority `${packageName}.fileprovider`) já está configurado — usado em `openPdfExternal`.
- Para o `ACTION_SEND` preciso passar `Intent.EXTRA_STREAM = uri` + `FLAG_GRANT_READ_URI_PERMISSION`.
- Zoom: implementar uma `ZoomableImageView` (extende `ImageView`) ou usar `Matrix` + `ScaleGestureDetector` num wrapper. Para manter simples, encapsulo cada `ImageView` numa `FrameLayout` que intercepta o gesto de pinça e aplica `setScaleX/setScaleY` + `pivot` no toque; scroll do `ScrollView` continua funcionando quando não está em pinça.
- Vídeo: detectar via `Capacitor.isNativePlatform()` (já usado em outras telas) e montar `const videoSrc = isNative ? \`https://qapqrv.lovable.app${tutorialVideo.url}\` : tutorialVideo.url`.

Nenhuma mudança de UI no lado React do PDF (a tela de escala no APK já abre direto no `PdfViewerActivity` nativo).
