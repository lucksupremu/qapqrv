import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { DrawerProvider } from "@/components/side-drawer";
import { BottomNav } from "@/components/bottom-nav";
import { PrivacyConsent } from "@/components/privacy-consent";
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
          <Toaster />
        </DrawerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
