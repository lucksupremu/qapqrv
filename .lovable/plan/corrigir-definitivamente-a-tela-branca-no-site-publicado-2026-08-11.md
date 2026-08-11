# Corrigir definitivamente a tela branca no site publicado

## Diagnóstico confirmado

O domínio `miketools.top` está servindo o template SPA antigo do APK, com `<script type="module" src="/src/main.tsx">`. Em produção, essa URL retorna HTML (`text/html`) em vez de JavaScript, então o navegador bloqueia o módulo e a página fica branca. O preview já entrega o SSR correto e renderiza normalmente.

## Correção

1. **Separar os artefatos web e APK sem ambiguidade**
   - Manter o site no build TanStack Start/SSR.
   - Isolar o build estático do Capacitor em uma saída própria, evitando que seu `index.html` possa ser publicado como site.
   - Ajustar o fluxo do APK para consumir somente esse artefato separado.

2. **Eliminar cache incompatível da versão antiga**
   - Atualizar o Service Worker para remover caches do shell SPA anterior durante a ativação.
   - Garantir que navegações web priorizem a resposta SSR atual e não restaurem o HTML antigo.
   - Preservar notificações e cache de PDFs.

3. **Validar antes da publicação**
   - Confirmar que o build web gera SSR e não referencia `/src/main.tsx`.
   - Testar a home e rotas públicas em navegador limpo, com conteúdo visível e sem erro de MIME/hidratação.
   - Confirmar metadados e canonical específicos por rota.

4. **Publicar a correção e conferir o domínio real**
   - Executar a verificação de segurança exigida para publicação.
   - Publicar o build SSR atualizado.
   - Conferir `https://miketools.top/` após a implantação, validando conteúdo renderizado e ausência do erro de módulo.

## Resultado esperado

O site e o domínio customizado passam a servir o SSR atual, enquanto o APK continua usando seu build estático separado. Usuários que ainda tenham cache antigo recebem a nova versão sem tela branca.
