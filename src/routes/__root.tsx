import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { DrawerProvider } from "@/components/side-drawer";
import { BottomNav } from "@/components/bottom-nav";
import { PrivacyConsent } from "@/components/privacy-consent";
import { PushPermissionPrompt } from "@/components/push-permission-prompt";
import { BrowserWarningModal } from "@/components/browser-warning-modal";
import { isNativeApp } from "@/lib/in-app-browser";

/** Google AdSense client ID */
const ADSENSE_CLIENT = "ca-pub-4966192764194561";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Onboarding: redireciona na primeira abertura.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/onboarding") return;
    try {
      if (window.localStorage.getItem("onboarding-seen-v1") !== "1") {
        router.navigate({ to: "/onboarding" });
      }
    } catch {
      /* ignore */
    }
  }, [pathname, router]);



  useEffect(() => {
    if (typeof window === "undefined") return;

    // Lazy-load AdSense after first paint (apenas no web, não no APK nativo).
    const loadAds = () => {
      if (isNativeApp()) return;
      if (document.querySelector("script[data-adsense]")) return;
      const s = document.createElement("script");
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.setAttribute("data-adsense", "1");
      document.head.appendChild(s);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ric: any = (window as any).requestIdleCallback;
    const adTimer = ric
      ? ric(loadAds, { timeout: 3000 })
      : window.setTimeout(loadAds, 1500);

    // Inicializa AdMob e mostra App Open Ad (apenas no APK nativo).
    // Só dispara após retorno de background longo (>30s) — evita derrubar
    // a Activity recém-resumida quando o usuário volta rapidamente do
    // AnyConnect ou de outro app.
    let removeAppListener: (() => void) | null = null;
    if (isNativeApp()) {
      // Warm-up de sessão da intranet em background, para garantir os cookies
      // antes da primeira consulta de PDF de escala.
      import("@/lib/intranet-warmup").then(({ warmupIntranetSession }) => {
        warmupIntranetSession().catch(() => {});
      });

      import("@/lib/admob").then(({ initAdMob, showAppOpenAd }) => {
        initAdMob().then(() => {
          try { showAppOpenAd(); } catch (e) { console.warn("[admob] cold start show falhou", e); }
        });

        let lastBackgroundedAt = 0;
        const MIN_BG_MS = 30_000;
        import("@capacitor/app").then(({ App }) => {
          App.addListener("appStateChange", (state: { isActive: boolean }) => {
            try {
              if (!state.isActive) {
                lastBackgroundedAt = Date.now();
                return;
              }
              if (lastBackgroundedAt === 0) return;
              if (Date.now() - lastBackgroundedAt < MIN_BG_MS) return;
              showAppOpenAd();
              // Re-warm da intranet ao voltar de background longo.
              import("@/lib/intranet-warmup").then(({ warmupIntranetSession }) => {
                warmupIntranetSession().catch(() => {});
              });
            } catch (e) {
              console.warn("[admob] resume show falhou", e);
            }
          }).then((handle: { remove: () => void }) => {
            removeAppListener = () => handle.remove();
          });
        }).catch(() => {});
      });
    }


    // Rehydrate reminder timers and re-check every hour for distant reminders.
    import("@/lib/notifications-adapter").then(({ rehydrateReminders }) => {
      rehydrateReminders();
    });
    const id = setInterval(
      () => {
        import("@/lib/notifications-adapter").then(({ rehydrateReminders }) => {
          rehydrateReminders();
        });
      },
      60 * 60 * 1000,
    );

    // Registra o Service Worker para mostrar notificações locais (Chrome Android exige).
    if (!isNativeApp() && import.meta.env.PROD) {
      import("@/lib/notifications-adapter").then(({ ensureServiceWorker }) => {
        ensureServiceWorker().catch(() => {});
      });
    }
    return () => {
      clearInterval(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (ric && (window as any).cancelIdleCallback)
        (window as any).cancelIdleCallback(adTimer);
      else clearTimeout(adTimer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <DrawerProvider>
          <div
            className="mx-auto w-full max-w-[430px] sm:max-w-2xl lg:max-w-5xl min-h-screen pb-[72px] scroll-smooth"
            style={{ background: "var(--bg)" }}
          >
            <Outlet />
          </div>
          <BottomNav />
          <PrivacyConsent />
          <PushPermissionPrompt />
          <BrowserWarningModal />
          <Toaster />
        </DrawerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
