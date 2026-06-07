## Plano para corrigir `/privacidade`

### Causa exata
- O domínio publicado ainda está servindo `/privacidade` como um recurso estático sem extensão/MIME correto, retornando `Content-Type: application/octet-stream`.
- Com `X-Content-Type-Options: nosniff`, o navegador não tenta interpretar o conteúdo como HTML e por isso baixa o arquivo.
- A correção precisa eliminar qualquer caminho estático conflitante e fazer `/privacidade` ser tratado como rota web normal, com resposta HTML explícita.

### Correção proposta
1. **Manter `/privacidade` como rota pública TanStack Start**
   - Usar `src/routes/privacidade.tsx` com `createFileRoute('/privacidade')`.
   - Sem autenticação, sem middleware privado, acessível diretamente pelo navegador.

2. **Forçar resposta HTML no servidor**
   - A rota terá `server.handlers.GET` retornando `new Response(html, ...)`.
   - Headers explícitos:
     - `Content-Type: text/html; charset=utf-8`
     - `X-Content-Type-Options: nosniff`
     - sem `Content-Disposition`
   - Isso impede que o deploy trate a rota como arquivo de download.

3. **Remover conflito estático**
   - Garantir que não exista mais `public/privacidade` nem `public/privacidade/index.html`.
   - Assim o servidor publicado não prioriza um arquivo estático sem MIME correto antes da rota da aplicação.

4. **Completar o conteúdo da política**
   - Página com:
     - Título: Política de Privacidade
     - Data de atualização
     - Coleta de dados
     - Uso das informações
     - Compartilhamento de dados
     - Segurança
     - Direitos do usuário
     - Contato

5. **Validar após implementar**
   - Verificar local/preview que a rota existe.
   - Após publicar/atualizar, validar no domínio:
     - `https://miketools.top/privacidade` abre no navegador
     - status HTTP `200`
     - `Content-Type: text/html; charset=utf-8`
     - sem `Content-Disposition: attachment`
     - não baixa arquivo

### Observação importante
- A correção de código só entra no domínio `miketools.top` depois de clicar em **Publish / Update**. Enquanto o domínio publicado estiver numa versão antiga, ele continuará podendo responder `application/octet-stream`.