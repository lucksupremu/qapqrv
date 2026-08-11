# SSR real por rota (corrigir "conteúdo de baixo valor" do AdSense)

## Diagnóstico confirmado

Verifiquei o projeto e o problema é exatamente o descrito:

- `vite.config.ts` está configurado como SPA pura (só `@vitejs/plugin-react` + plugin de rotas), sem o plugin do TanStack Start. Não existe renderização no servidor.
- `src/main.tsx` monta o app 100% no cliente (`createRoot(...).render`).
- `index.html` traz `<title>`, `description`, `og:*` e `<link rel="canonical" href="https://miketools.top/">` fixos, mais um bloco `#seo-fallback` com o texto da home. Todas as URLs recebem esse mesmo HTML.
- `src/lib/use-document-head.ts` corrige title/description/canonical, mas só depois do JS rodar — o AdsBot não vê.
- `src/routes/sitemap[.]xml.ts` existe como server route, porém sem servidor ela nunca é executada; o que é servido é o `public/sitemap.xml` estático, que ainda lista URLs `/blog/...` que hoje redirecionam para `/conteudos`.

## O que será feito

### 1. Reativar o build com SSR para a web
- Passar o `vite.config.ts` a usar `@lovable.dev/vite-tanstack-config` (já está no projeto), habilitando o servidor do TanStack Start.
- Criar as entradas de servidor/cliente do Start (`src/server.ts`, `src/client.tsx`) e mover a inicialização atual de `main.tsx` (tema, service worker, PWA) para o lado cliente, com guardas de `typeof window`.
- Adicionar `<HeadContent />` e `<Scripts />` no `__root.tsx`, com `head()` global (charset, viewport, JSON-LD do site, ícones, fontes) migrado do `index.html`.

### 2. Manter o APK funcionando
- O Capacitor continua com um build estático próprio: script `build:apk` usando modo SPA (hash history preservada por `isNativeApp()`), sem SSR.
- `cap:sync` passa a usar esse build. Nada muda no comportamento do app nativo.

### 3. head() e canonical por rota
- Cada rota passa a declarar no `head()`: `title`, `description`, `og:title`, `og:description`, `og:url`, `twitter:*` e `canonical` autorreferente.
- Rotas de conteúdo dinâmico (`/conteudos/$categoria/$slug`) geram esses valores a partir do `loader`, retornando apenas dados serializáveis (slug/campos de texto), nunca componentes.
- Rotas de ferramentas/telas internas continuam com `robots: noindex`, agora emitido já no HTML do servidor em vez de via efeito no cliente.
- `useDocumentHead` é removido (vira redundante) e as tags fixas do `index.html`, incluindo o canonical da home e o bloco `#seo-fallback`, saem — o servidor passa a entregar o conteúdo real de cada página.

### 4. Auditoria de segurança para SSR
- Varredura das rotas e componentes que tocam `window`, `document`, `localStorage` ou Capacitor durante a renderização, movendo tudo para `useEffect` ou import dinâmico. Isso evita erro 500 na primeira renderização no servidor.

### 5. Sitemap
- `sitemap.xml` volta a ser servido pela server route (que já cobre home, institucionais, categorias e todos os artigos), e o `public/sitemap.xml` estático desatualizado é removido para não conflitar.
- Entradas `/blog/...` obsoletas saem; `/blog` continua redirecionando para `/conteudos`.

### 6. Verificação
- Buscar o HTML bruto (sem JS) de pelo menos 4 URLs — `/`, um artigo de `/conteudos/...`, `/privacidade` e `/sobre` — e conferir que title, meta description, og:* e o corpo de texto são diferentes entre si e que cada canonical aponta para a própria URL.
- Conferir também que `/sitemap.xml` responde XML válido e que `/robots.txt` continua liberando o crawler.

## Observações

- O AdSense e o Google só reprocessam depois de um novo rastreamento; após publicar, vale pedir reindexação no Search Console.
- O script do AdSense segue desligado por flag até a aprovação, como está hoje.
