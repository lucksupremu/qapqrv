import { QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  createHashHistory,
  createBrowserHistory,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isNativeApp } from "@/lib/in-app-browser";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // APK Capacitor carrega de file:// → precisa de hash history.
  // PWA/web no navegador → mantém URLs normais (/calendario, /historico).
  const history = isNativeApp() ? createHashHistory() : createBrowserHistory();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
