import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { DrawerProvider } from "@/components/side-drawer";
import { BottomNav } from "@/components/bottom-nav";

/** Google AdSense client ID — preencha com seu ca-pub-XXXXXXXXXXXXXXXX */
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? ""; // <-- SUBSTITUA AQUI OU USE .env

function getAdSenseScript(): { type: "text/javascript"; children: string } | undefined {
  if (!ADSENSE_CLIENT) return undefined;
  return {
    type: "text/javascript",
    children: `
      (function() {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
        s.crossOrigin = 'anonymous';
        document.head.appendChild(s);
      })();
    `,
  };
}

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no",
      },
      { name: "theme-color", content: "#f4f8fc" },
      { title: "QAP, QRV! — Ferramentas operacionais" },
      {
        name: "description",
        content: "Central de ferramentas operacionais para o policial militar.",
      },
      { property: "og:title", content: "QAP, QRV! — Ferramentas operacionais" },
      {
        property: "og:description",
        content: "Ferramentas operacionais em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "QAP, QRV! — Ferramentas operacionais" },
      { name: "description", content: "QAP QRV Tools provides essential utilities for military police officers, enhancing operational efficiency." },
      { property: "og:description", content: "QAP QRV Tools provides essential utilities for military police officers, enhancing operational efficiency." },
      { name: "twitter:description", content: "QAP QRV Tools provides essential utilities for military police officers, enhancing operational efficiency." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e0fa5b7f-428d-457d-96fa-3dceb4d0abe4/id-preview-49580de1--c4ba12ae-de4d-4739-b500-bee9ca5bb9e9.lovable.app-1780237479015.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e0fa5b7f-428d-457d-96fa-3dceb4d0abe4/id-preview-49580de1--c4ba12ae-de4d-4739-b500-bee9ca5bb9e9.lovable.app-1780237479015.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const shown = sessionStorage.getItem("splash_shown");
      const path = window.location.pathname;
      if (!shown && path === "/") {
        router.navigate({ to: "/splash", replace: true });
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DrawerProvider>
        <div
          className="mx-auto w-full max-w-[430px] min-h-screen pb-[72px] scroll-smooth"
          style={{ background: "var(--bg)" }}
        >
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <BottomNav />
        <Toaster />
      </DrawerProvider>
    </QueryClientProvider>
  );
}
