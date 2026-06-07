import { QueryClient } from "@tanstack/react-query";
import {
  createRouter,
  createHashHistory,
  createBrowserHistory,
  createMemoryHistory,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isNativeApp } from "@/lib/in-app-browser";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // SSR (sem window) → memory history; APK Capacitor → hash; web → browser.
  const history =
    typeof window === "undefined"
      ? createMemoryHistory({ initialEntries: ["/"] })
      : isNativeApp()
        ? createHashHistory()
        : createBrowserHistory();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
