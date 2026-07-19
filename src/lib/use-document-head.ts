import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Sincroniza a definição `head()` de cada rota do TanStack Router com o
 * `document.head` real. Sem isso, títulos/descrições/canonicals ficam
 * "presos" no `index.html` — o que faz o Googlebot ver todas as páginas
 * como duplicadas e é o pior sinal possível para o AdSense.
 *
 * Lê os `meta`, `links` e `scripts` acumulados dos matches, remove tags
 * antigas gerenciadas por este hook e reinjeta as novas. O `<title>` é
 * atualizado via `document.title` (deduplica sozinho).
 */
const BASE_URL = "https://miketools.top";
const MANAGED = "data-rr-head";

type MetaTag = { title?: string } & Record<string, string>;
type LinkTag = Record<string, string>;
type ScriptTag = Record<string, string> & { children?: string };

interface RouteHead {
  meta?: MetaTag[];
  links?: LinkTag[];
  scripts?: ScriptTag[];
}

export function useDocumentHead() {
  const matches = useRouterState({ select: (s) => s.matches });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof document === "undefined") return;

    // Remove tags estáticas do index.html que precisamos reescrever por rota
    // (crítico para AdSense: cada URL tem que ter description/canonical próprios).
    // Só rodamos uma vez — depois disso tudo é gerenciado por este hook.
    if (!document.documentElement.hasAttribute("data-head-cleaned")) {
      document.documentElement.setAttribute("data-head-cleaned", "1");
      document
        .querySelectorAll(
          'meta[name="description"], link[rel="canonical"], meta[property="og:title"], meta[property="og:description"], meta[property="og:url"], meta[name="twitter:title"], meta[name="twitter:description"]',
        )
        .forEach((el) => {
          // Não removemos tags que já foram criadas pelo próprio hook.
          if (!el.hasAttribute(MANAGED)) el.remove();
        });
    }

    // Agrega head de todos os matches (rota mais profunda vence via dedupe).
    const meta: MetaTag[] = [];
    const links: LinkTag[] = [];
    const scripts: ScriptTag[] = [];
    for (const m of matches) {
      // TanStack Router expõe head() resolvido em `m.meta`/`m.links`/`m.scripts`
      // dependendo da versão — fazemos leitura defensiva.
      const raw = (m as unknown as { meta?: MetaTag[]; head?: RouteHead })
        .meta;
      const headObj = (m as unknown as { head?: RouteHead }).head;
      if (Array.isArray(raw)) meta.push(...raw);
      if (headObj?.meta) meta.push(...headObj.meta);
      if (headObj?.links) links.push(...headObj.links);
      if (headObj?.scripts) scripts.push(...headObj.scripts);
    }

    // Limpa gerenciadas anteriores.
    document
      .querySelectorAll(`[${MANAGED}="1"]`)
      .forEach((el) => el.remove());

    // Title: última definição vence.
    const titleTag = [...meta].reverse().find((m) => m.title);
    if (titleTag?.title) document.title = titleTag.title;

    // Meta tags — dedup por name/property (última vence).
    const metaByKey = new Map<string, MetaTag>();
    for (const m of meta) {
      if (m.title) continue;
      const key = m.name ? `n:${m.name}` : m.property ? `p:${m.property}` : "";
      if (!key) continue;
      metaByKey.set(key, m);
    }
    for (const m of metaByKey.values()) {
      const el = document.createElement("meta");
      el.setAttribute(MANAGED, "1");
      for (const [k, v] of Object.entries(m)) {
        if (v != null) el.setAttribute(k, String(v));
      }
      document.head.appendChild(el);
    }

    // Garante canonical + og:url auto-referentes se a rota não declarou.
    const hasCanonical = links.some((l) => l.rel === "canonical");
    const hasOgUrl = metaByKey.has("p:og:url");
    const selfUrl = `${BASE_URL}${pathname === "/" ? "/" : pathname}`;
    if (!hasCanonical) {
      const el = document.createElement("link");
      el.setAttribute(MANAGED, "1");
      el.setAttribute("rel", "canonical");
      el.setAttribute("href", selfUrl);
      document.head.appendChild(el);
    }
    if (!hasOgUrl) {
      const el = document.createElement("meta");
      el.setAttribute(MANAGED, "1");
      el.setAttribute("property", "og:url");
      el.setAttribute("content", selfUrl);
      document.head.appendChild(el);
    }

    // Links declarados pelas rotas.
    for (const l of links) {
      const el = document.createElement("link");
      el.setAttribute(MANAGED, "1");
      for (const [k, v] of Object.entries(l)) {
        if (v != null) el.setAttribute(k, String(v));
      }
      document.head.appendChild(el);
    }

    // Scripts declarados (usado para JSON-LD por rota).
    for (const s of scripts) {
      const el = document.createElement("script");
      el.setAttribute(MANAGED, "1");
      for (const [k, v] of Object.entries(s)) {
        if (k === "children") continue;
        if (v != null) el.setAttribute(k, String(v));
      }
      if (s.children) el.textContent = s.children;
      document.head.appendChild(el);
    }
  }, [matches, pathname]);
}
