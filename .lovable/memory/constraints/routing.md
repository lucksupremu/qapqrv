---
name: TanStack routing — não improvisar
description: Regras para adicionar rotas neste projeto sem quebrar build/produção
type: constraint
---
- Para adicionar uma rota: criar arquivo em `src/routes/<slug>.tsx` com `createFileRoute("/<slug>")`. Nada mais.
- NUNCA editar `src/routeTree.gen.ts` manualmente — é gerado pelo plugin Vite do TanStack Router.
- NUNCA trocar SPA por TanStack Start SSR para "resolver" um 404 de rota. **Why:** quebra o build de produção (referências a módulos virtuais de dev).
- NUNCA servir páginas via arquivo estático em `public/<slug>.html` ou `public/<slug>/index.html` quando já existe roteamento SPA. **Why:** conflita com o roteador do cliente e gera NotFound/tela branca.
- Após adicionar/renomear rota, atualizar em conjunto: links internos, `sitemap.xml` estático e `src/routes/sitemap[.]xml.ts`.
