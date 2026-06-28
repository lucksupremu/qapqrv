/**
 * Allowlist de rotas onde o Google AdSense pode ser carregado/exibido.
 *
 * As políticas do AdSense proíbem anúncios em telas:
 *  - sem conteúdo editorial / com conteúdo de baixo valor
 *  - "em construção"
 *  - usadas para alertas, navegação ou outros fins comportamentais
 *  - splash / loading / onboarding
 *
 * Por isso só ligamos AdSense (script + <ins>) em páginas densas de
 * conteúdo editorial: blog, manual, e páginas institucionais.
 *
 * Toda rota fora desta lista NÃO carrega o script `adsbygoogle.js` e
 * o componente <AdSlot> vira no-op.
 */

const STATIC_ALLOW = new Set<string>([
  "/blog",
  "/sobre",
  "/manual",
  "/termos",
  "/contato",
  "/privacidade",
]);

export function isAdsAllowedRoute(pathname: string): boolean {
  if (!pathname) return false;
  if (STATIC_ALLOW.has(pathname)) return true;
  // Posts de blog: /blog/<slug>
  if (pathname.startsWith("/blog/")) return true;
  return false;
}
