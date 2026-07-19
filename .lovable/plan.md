
# Plano — Otimização QAP, QRV! para AdSense

Objetivo: adicionar conteúdo editorial denso, SEO forte e áreas próprias para anúncios, **sem mexer** no dashboard, nas ferramentas ou na velocidade. Reutiliza os componentes atuais (`tool-card`, `ad-slot`, `app-header`, `side-drawer`, blog).

## 1. Arquitetura de conteúdo

Nova fonte de dados única em `src/content/`:

- `src/content/categorias.ts` — 9 categorias (DEJEM, Delegada, Escalas, Procedimentos, Produtividade, Ferramentas, Tecnologia, PMESP, Segurança Digital).
- `src/content/artigos/*.mdx-like.ts` — cada artigo como módulo TS tipado (`title`, `subtitle`, `cover`, `date`, `readingTime`, `author`, `category`, `toc[]`, `body`, `faq[]`, `related[]`). Permite adicionar artigos futuros sem tocar em código de rota.
- `src/content/ajuda.ts`, `src/content/faq.ts`, `src/content/ferramentas-info.ts` (caixa "Como funciona" por slug).

Loader único (`src/content/index.ts`) expõe `getArtigo`, `listarPorCategoria`, `getFaq`.

## 2. Novas rotas públicas (lazy)

Todas as rotas novas usam `React.lazy` + `Suspense` para não impactar bundle inicial.

- `/conteudos` — grid de categorias.
- `/conteudos/$categoria` — lista de artigos.
- `/conteudos/$categoria/$slug` — artigo com índice fixo lateral, FAQ e "Relacionados". Slots `AdSlot` no topo (após intro), meio e fim.
- `/ajuda` — Central de Ajuda com seções em Accordion.
- `/faq` — Accordion (shadcn) com ~15 perguntas.
- `/sobre` — expandida a ~1200 palavras (mantém a URL atual).
- `/contato` — formulário (mailto fallback) + WhatsApp + canais.
- `/cookies` — Política de Cookies.
- `/aviso-legal` — Aviso Legal.
- `/manual` vira Central de Conhecimento: busca client-side, categorias, índice, links relacionados (mesmo componente do artigo).
- `/mapa-do-site` — lista textual de todas as rotas públicas.

Todas com `<Helmet>` (title, description, canonical, OG, Twitter Card, Schema.org: `Article`, `FAQPage`, `BreadcrumbList`).

## 3. Home — Central de Conteúdo (discreta)

Em `src/routes/index.tsx`, **depois** do calendário e sem alterar o dashboard, uma seção enxuta:

- Título "Central de Conteúdo" + 8 cartões (reutiliza `tool-card`).
- Cada cartão: ícone, título, 1 linha, link para artigo específico.
- Renderizada com `IntersectionObserver` (aparece só ao rolar) para não afetar LCP.

## 4. Ferramentas — caixa "Como funciona"

Em `src/routes/ferramenta.$slug.tsx` (e nas ferramentas dedicadas), acima do formulário, um `<Collapsible>` **fechado por padrão** rotulado "Como funciona". Ao expandir mostra: o que é, quando usar, benefícios, boas práticas, erros comuns. Conteúdo vem de `ferramentas-info.ts`. Sem cliques extras para usar a ferramenta.

## 5. Menu lateral e rodapé

- `side-drawer.tsx`: adicionar itens "Central de Conteúdo", "Central de Ajuda", "Perguntas Frequentes", "Sobre", "Contato", "Termos", "Política de Cookies" numa nova seção "Institucional" no final. Nada é removido/movido.
- Novo `src/components/site-footer.tsx` renderizado **apenas** em rotas públicas editoriais (mesma checagem de `isPublicContentRoute`): descrição, links rápidos, contato, versão, links legais e mapa do site. Não aparece nas ferramentas nem no dashboard.

## 6. SEO / Indexação / AdSense

- Ampliar `src/lib/ads-allowlist.ts` incluindo `/conteudos`, `/conteudos/*`, `/ajuda`, `/faq`, `/cookies`, `/aviso-legal`, `/mapa-do-site`, `/manual` (já ok).
- Atualizar `public/sitemap.xml` (ou gerador) com todas as novas rotas + artigos.
- `public/robots.txt` mantém bloqueio das telas de app; libera `/conteudos/*`, `/ajuda`, `/faq`, `/cookies`, `/aviso-legal`.
- Cada rota nova define `<Helmet>` completo + Schema.org apropriado.
- Breadcrumbs visuais + `BreadcrumbList` JSON-LD em artigos.
- `AdSlot` continua no-op fora da allowlist; nunca renderizado em login/onboarding/config/modais.

## 7. Performance

- Rotas novas em `React.lazy` + code-split por categoria.
- Imagens de capa via `loading="lazy"` e `decoding="async"`.
- Sem libs novas: usa shadcn (`Accordion`, `Collapsible`, `Card`) já instalados.
- Home mantém bundle atual; Central de Conteúdo é uma seção estática.

## 8. Entregáveis

Novos arquivos:
```
src/content/{categorias.ts,index.ts,ferramentas-info.ts,ajuda.ts,faq.ts}
src/content/artigos/*.ts        (12–16 artigos iniciais, ~800–1200 palavras)
src/routes/conteudos.tsx
src/routes/conteudos.$categoria.tsx
src/routes/conteudos.$categoria.$slug.tsx
src/routes/ajuda.tsx
src/routes/faq.tsx
src/routes/cookies.tsx
src/routes/aviso-legal.tsx
src/routes/mapa-do-site.tsx
src/components/site-footer.tsx
src/components/central-conteudo-section.tsx
src/components/como-funciona-box.tsx
src/components/article-toc.tsx
src/components/breadcrumbs.tsx
```
Editados: `index.tsx` (seção discreta), `sobre.tsx` (expansão), `manual.tsx` (busca + categorias), `side-drawer.tsx`, `ferramenta.$slug.tsx` e ferramentas dedicadas, `ads-allowlist.ts`, `sitemap.xml`, `robots.txt`, `__root.tsx` (montar footer condicional).

## Não será feito

- Nenhuma alteração no dashboard, calendário, escalas, DEJEM, Delegada, VPN, splash, onboarding, configurações.
- Nada removido do menu/rodapé atuais.
- Sem novas libs pesadas, sem SSR.

## Observação honesta

Aprovação do AdSense é decisão do Google. Este plano cobre as duas rejeições ("conteúdo de baixo valor" e "anúncios em telas sem conteúdo") com volume editorial real e isolamento estrito de anúncios, mas não posso garantir aprovação.
