# Plano: Recriar Política de Privacidade do zero

## Objetivo
Substituir totalmente a antiga rota `/privacidade` por uma nova `/politica-de-privacidade`, eliminando qualquer vestígio do conteúdo legado que esteja sendo interceptado no CDN.

## Passos

### 1. Remover tudo relacionado à rota antiga
- Excluir `src/routes/privacidade.tsx`.
- Remover toda referência ao caminho `/privacidade` em:
  - `src/components/side-drawer.tsx` (item do menu)
  - `src/components/privacy-consent.tsx` (2 links `to="/privacidade"`)
  - `src/routes/index.tsx` (navigate na linha 539)
  - `src/routes/manual.tsx` (Link na linha 300)
  - `src/routes/sitemap[.]xml.ts` (entrada do sitemap)
  - `public/sitemap.xml` (entrada `https://miketools.top/privacidade`)
- Verificar se não restou nenhuma string `privacidade`, `privacy.html` ou `privacy-policy` no projeto.

### 2. Criar nova rota React
- Como o projeto usa **TanStack Start** (file-based routing em `src/routes/`), a nova página será:
  - `src/routes/politica-de-privacidade.tsx` → registra `createFileRoute("/politica-de-privacidade")`.
- O usuário pediu `src/pages/PoliticaPrivacidade.tsx`, mas `src/pages/` não é usado neste stack e quebraria o roteamento. Vou criar o **componente** em `src/components/politica-privacidade.tsx` e importá-lo no arquivo de rota — assim mantemos o espírito do pedido (componente React separado) sem romper a convenção do TanStack Start.
- Nenhum arquivo HTML estático, nada em `public/`, nenhum asset baixável.

### 3. Conteúdo da página
Título: **Política de Privacidade – QAP, QRV!**

Seções: Sobre o aplicativo, Dados coletados, Permissões utilizadas, Armazenamento local, Publicidade (Google AdMob), Segurança, Exclusão de dados, Alterações desta política, Contato (`Suporte.qapqrv@gmail.com`).

Conteúdo redigido especificamente para o app QAP, QRV! (ferramentas para profissionais de segurança/operações).

### 4. Design
- Fundo claro, card centralizado (`max-w-3xl mx-auto`), shadow suave, padding generoso.
- Títulos destacados com hierarquia clara (h1 grande, h2 com cor de destaque).
- Mobile-friendly, usando tokens do design system em `src/styles.css`.
- `head()` com title + meta description próprios.

### 5. Atualizar todos os links
- Menu lateral, banner de consentimento, manual, página inicial, sitemap e `public/sitemap.xml` apontam para `/politica-de-privacidade`.

### 6. Validação
- Confirmar build OK e que `routeTree.gen.ts` registrou a nova rota.
- Após publish, a URL `/politica-de-privacidade` retorna HTML React (não é interceptada por asset legado, pois o nome é totalmente novo).

## Observação sobre `/privacidade` legado no CDN
O motivo do download era um asset legado servido pelo CDN antes do fallback SPA. Ao usar um **slug totalmente novo** (`/politica-de-privacidade`), nenhum asset antigo poderá interceptar a rota. A rota `/privacidade` deixa de existir no app.
