import { QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  createHashHistory,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isNativeApp } from "@/lib/in-app-browser";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // APK Capacitor carrega de file:// → precisa de hash history.
  // No servidor (SSR) e no navegador comum, deixamos o TanStack Start
  // escolher a history padrão (URLs normais: /calendario, /historico).
  const history =
    typeof window !== "undefined" && isNativeApp()
      ? createHashHistory()
      : undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    ...(history ? { history } : {}),
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
