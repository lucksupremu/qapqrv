# Plano: APK 100% offline (SPA estática)

Converter o projeto de TanStack Start (SSR no Cloudflare) para uma SPA estática pura, gerando `dist/` pronto para o Capacitor empacotar no APK.

## Mudanças no build

1. **Substituir `vite.config.ts`** — remover `@lovable.dev/vite-tanstack-config` (que injeta Nitro/SSR) e usar Vite puro com `@vitejs/plugin-react` + `@tanstack/router-plugin` em modo `file-based` gerando o `routeTree.gen.ts` igual hoje.
2. **Remover SSR**: deletar `src/server.ts` e `src/start.ts`. Criar `index.html` na raiz + `src/main.tsx` (entry client) que monta `<RouterProvider router={getRouter()} />`.
3. **Router em modo client**: `getRouter()` continua igual, mas removendo qualquer dependência de `createRootRouteWithContext` que use `HeadContent`/`Scripts`/`shellComponent` — esses são SSR-only. Migrar os metadados de `head()` do `__root.tsx` para tags fixas no `index.html` (title, meta, manifest, fonts, AdSense).
4. **`__root.tsx`**: remover `shellComponent`, `HeadContent`, `Scripts`. Manter só `component`, `notFoundComponent`, `errorComponent`. Conteúdo do `<head>` vai todo para `index.html`.
5. **Hash routing**: trocar history para `createHashHistory()` em `getRouter()` — necessário porque WebView do APK carrega `file://` e rotas `/calendario` não resolvem sem servidor. Todas as URLs viram `#/calendario`, `#/historico`, etc.
6. **`build` script** no `package.json`: `vite build` passa a gerar `dist/` estático (já é o `webDir` do `capacitor.config.ts`).

## Capacitor / APK

7. Após o build, rodar localmente (não dá pra fazer aqui):
   ```bash
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
8. Copiar manualmente `android-plugin/VpnStatusPlugin.kt` para `android/app/src/main/java/br/com/qapqrv/app/` e registrar no `MainActivity.java` com `registerPlugin(VpnStatusPlugin.class)`.
9. No Android Studio: Build → Generate Signed APK.

## Itens que serão removidos / desligados

- SSR, server functions (não há nenhuma em uso — `src/lib/api/example.functions.ts` será removido).
- `src/server.ts`, `src/start.ts`, `src/lib/error-page.ts`, `src/lib/error-capture.ts`, `src/lib/config.server.ts`.
- Plugin Nitro do Vite (perdemos worker/Cloudflare — não usado no APK).

## Itens preservados

- Todas as rotas, componentes, hooks, lógica de escalas, marcas, calendário, plantões.
- LocalStorage, IndexedDB (`idb-keyval`), plugins Capacitor (Preferences, Filesystem, InAppBrowser, VPN).
- Tailwind, design tokens, framer-motion, todos os componentes UI.

## Detalhes técnicos

- **Hash routing**: TanStack Router suporta nativamente `createHashHistory()` de `@tanstack/history`. Links `<Link to="/calendario">` continuam funcionando — o router cuida da serialização para `#/calendario`.
- **Meta tags por rota** (`head()` nas rotas filhas): no APK não importa SEO, então não precisamos do `HeadContent`. As páginas continuam definindo `head()` mas só o `title` será aplicado via pequeno hook `useEffect(() => { document.title = ... }, [])` em um wrapper, se necessário (opcional, fora deste plano inicial).
- **AdSense**: o `<script>` continua sendo injetado lazy no `RootComponent` via `useEffect` — funciona em WebView com internet. Se quiser desligar Ads no APK, dá pra detectar `isNativeApp()` e pular.
- **Fontes Google**: ficam carregadas via CDN no `index.html` — requer internet na primeira carga. Para offline real, precisaria baixar e embarcar as fontes (fora deste plano).
- **Build dev (Lovable preview)**: o preview do Lovable continua funcionando como SPA — só perde SSR (não é problema para este app, todo conteúdo é client-side hoje).

## Riscos

- O preview do Lovable hoje roda via TanStack Start. Após a conversão, o preview continuará funcionando, mas como SPA pura — qualquer rota direta (`/calendario`) passa a precisar de fallback. O `index.html` único resolve em produção estática; no dev do Vite o `historyApiFallback` cuida disso automaticamente.
- Se no futuro precisar de SEO/SSR de novo, dá pra reverter.

Posso prosseguir?
