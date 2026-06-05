Plano para resolver definitivamente o botão amarelo de pesquisa de escala:

1. Alterar o fluxo do botão amarelo na home
- No APK, ao inserir o ID e tocar em Pesquisar, não abrir mais o navegador/WebView como fallback.
- O fluxo será: registrar a escala, baixar o PDF automaticamente e, se der certo, oferecer/abrir o PDF pelo app adequado do aparelho.
- Se o download falhar, mostrar uma mensagem clara pedindo VPN/login ativo, sem abrir a tela branca.

2. Fortalecer o download nativo do PDF
- Ajustar o plugin Android `InAppWebViewPlugin.downloadPdf` para validar que o arquivo baixado é realmente PDF.
- Rejeitar respostas HTML/login/página vazia para evitar salvar arquivo inválido.
- Salvar o PDF em local acessível e manter o registro em “Escalas Baixadas”.

3. Criar abertura do PDF pelo aplicativo do aparelho
- Adicionar no plugin Android um método para abrir o PDF salvo usando `Intent.ACTION_VIEW` com `application/pdf`.
- Usar `FileProvider`/URI segura para o Android permitir que outro app leia o PDF.
- Atualizar o script `android-plugin/install.sh` para registrar o `FileProvider` e copiar o XML necessário no build do APK.

4. Ajustar o JavaScript do app
- Expandir `src/lib/in-app-webview.ts` com o novo método nativo de abrir PDF.
- Atualizar `src/lib/escala-download.ts` para retornar sucesso/falha do download em vez de apenas executar em segundo plano.
- Atualizar `src/routes/index.tsx` para chamar download + abrir PDF nativo; sem `openInAppBrowser` no caso da consulta por ID.

5. Manter “Escalas Baixadas” funcionando
- O PDF baixado continuará aparecendo em “Escalas baixadas”.
- Ao tocar em Abrir, se houver PDF local, pode abrir pelo visualizador interno atual ou pelo app do aparelho conforme o novo método ficar disponível.

Resultado esperado: no APK, pesquisar uma escala por ID nunca mais deve abrir a WebView branca; deve baixar o PDF, salvar em “Escalas baixadas” e abrir/oferecer abertura por aplicativo PDF instalado no celular.