# Corrigir o sombreamento das rotas SSR por HTML estático

## Diagnóstico confirmado

- O build atual contém `dist/client/privacidade.html`, um HTML antigo e independente da rota React/SSR.
- O arquivo gerado `dist/server/wrangler.json` publica `dist/client` no binding `ASSETS` e não define `run_worker_first`.
- Nessa configuração, um asset com caminho correspondente pode ser servido antes do Worker, impedindo que `/privacidade` chegue ao SSR.
- Não existe `dist/client/index.html` neste build, mas a rota `/` está sujeita ao mesmo problema caso um arquivo desse nome reapareça.
- O Service Worker atual não armazena páginas HTML e não é a origem deste problema.

## Implementação

1. **Eliminar a origem estática conflitante**
   - Remover qualquer `privacidade.html`, `privacidade/index.html` ou `index.html` web legado que ainda esteja entrando no build público.
   - Preservar apenas o `apk/index.html`, usado exclusivamente pelo build Android em `android-dist`.

2. **Tornar o build web determinístico**
   - Limpar completamente a saída web antes de cada `vite build`, evitando que arquivos antigos sobrevivam entre builds incrementais.
   - Manter o build do APK isolado em `android-dist`.

3. **Garantir prioridade do SSR**
   - Configurar o preset Cloudflare/Nitro para gerar `run_worker_first` para `/` e `/privacidade` (ou a opção equivalente suportada pela configuração atual).
   - Confirmar no `dist/server/wrangler.json` gerado que essas rotas passam pelo Worker antes dos assets.

4. **Validar o artefato gerado**
   - Verificar que não existem `dist/client/index.html`, `dist/client/privacidade.html` nem equivalentes conflitantes.
   - Confirmar que o bundle de servidor contém as rotas SSR de `/` e `/privacidade`.
   - Conferir que os links editoriais da Home não contêm mais URLs `/blog/...`.

5. **Validar sem JavaScript e sem navegador**
   - Fazer requisições HTTP diretas para `/` e `/privacidade` no servidor local do build, usando também um User-Agent de crawler.
   - Extrair e comparar `status`, `content-type`, `title`, `meta description`, `canonical`, Open Graph e o primeiro `h1` do HTML bruto.
   - Repetir a checagem nas demais rotas públicas para detectar regressões.

6. **Publicação e verificação final**
   - Publicar somente depois de o artefato e o HTML bruto local passarem nas verificações.
   - Após o deploy, repetir o `curl` diretamente em `https://miketools.top/` e `https://miketools.top/privacidade`, sem executar JavaScript, e comparar com o resultado local esperado.

## Resultado esperado

- `/` é sempre respondida pelo SSR da Home, com seus metadados e conteúdo editorial atuais.
- `/privacidade` é sempre respondida pela rota SSR própria, com canonical `/privacidade` e metadados exclusivos.
- Nenhum HTML legado pode voltar a mascarar essas rotas em publicações futuras.
