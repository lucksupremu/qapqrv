## Verificação do vídeo tutorial

O vídeo está corretamente configurado:

- Asset CDN ativo: `tutorial-anyconnect.mp4` (~105 MB, `video/mp4`) em `src/assets/anyconnect/tutorial.mp4.asset.json`.
- Web (preview/publicado): carrega via `tutorial.url` → `/__l5e/assets-v1/.../tutorial-anyconnect.mp4` ✓
- APK nativo (Capacitor): já há fallback no `src/routes/anyconnect.tsx` prefixando com `https://qapqrv.lovable.app` (linha 11/133), porque o `localhost` do APK não resolve o caminho relativo do CDN ✓
- O `<video controls playsInline preload="metadata">` está correto para tocar ao toque tanto no navegador quanto no WebView do Android.

Conclusão: o vídeo abre corretamente. Não há mudança técnica a fazer aqui.

## Renomear o item do menu

Hoje aparece "Guia AnyConnect" em dois lugares. Vou trocar para **"Vídeo tutorial ANYCONECT"** (mantendo o ANYCONECT em caixa alta, como pedido):

1. `src/components/side-drawer.tsx` (linha 73) — item do menu lateral.
2. `src/routes/index.tsx` (linha 252) — atalho na home.

Nenhuma rota, ícone ou navegação muda. O título da própria tela `/anyconnect` ("Configurar AnyConnect") permanece como está, já que descreve o conteúdo da página em si — me avise se quiser trocar esse título também.
