Vou corrigir isso em ordem para parar o ciclo de erro:

1. Restaurar o componente ausente `EscalaViewerClient`
   - Criar `src/components/escala-viewer-client.tsx` com o conteúdo do visualizador de PDF que foi movido para lazy-load.
   - Isso corrige o erro de build: `Cannot find module '@/components/escala-viewer-client'`.

2. Manter o SSR seguro
   - `src/router.tsx` já foi ajustado para usar `createMemoryHistory` no servidor, evitando o erro `reading 'history'`.
   - O visualizador de PDF continuará carregando apenas no navegador para evitar `DOMMatrix is not defined` no servidor.

3. Garantir a rota `/privacidade`
   - Conferir que `src/routes/privacidade.tsx` continua com `createFileRoute('/privacidade')`.
   - Manter também o fallback estático `public/privacidade` para o domínio publicado conseguir servir a política mesmo fora do roteador.

4. Validar antes de concluir
   - Abrir/testar `/privacidade` no preview local.
   - Se responder 200, orientar você a clicar em Publish/Update para atualizar `https://miketools.top/privacidade`.