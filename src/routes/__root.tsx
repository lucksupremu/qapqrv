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
import { WhatsNewModal } from "@/components/whats-new-modal";
import { isNativeApp } from "@/lib/in-app-browser";
import { installAppBadgeUpdater } from "@/lib/app-badge";
import { InstallConfirmModal } from "@/components/install-confirm-modal";
import { ShareAppNudge } from "@/components/share-app-nudge";
import { updateDynamicShortcuts } from "@/lib/dynamic-shortcuts";


/** Google AdSense client ID */
const ADSENSE_CLIENT = "ca-pub-4966192764194561";
/** Carrega o script do AdSense apenas quando o site estiver aprovado.
 *  Mantemos `ads.txt` e o `<ins>` desligado para evitar reprovação por
 *  "inventário de anúncio sem conteúdo". Ative com VITE_ADSENSE_ENABLED=true. */
const ADSENSE_ENABLED = import.meta.env.VITE_ADSENSE_ENABLED === "true";

/** User-agents que são crawlers de busca/AdSense. Evitamos redirecionar o
 *  robô para /onboarding (que aparece como conteúdo vazio para indexação). */
const BOT_UA_RE =
  /bot|crawler|spider|crawling|googlebot|mediapartners-google|adsbot-google|bingbot|duckduckbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot/i;

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
  // Importante: NÃO redirecionar bots/crawlers — eles veriam só a tela de
  // boas-vindas e o Google AdSense reprovaria por "conteúdo insuficiente".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/onboarding") return;
    try {
      const ua = navigator.userAgent || "";
      if (BOT_UA_RE.test(ua)) return;
      if (window.localStorage.getItem("onboarding-seen-v1") !== "1") {
        router.navigate({ to: "/onboarding" });
      }
    } catch {
      /* ignore */
    }
  }, [pathname, router]);

  // Heartbeat de push: avisa o backend que o usuário está ativo (no máx. 1x/h).
  useEffect(() => {
    import("@/lib/push-client").then(({ sendHeartbeat, trackAccessDay }) => {
      trackAccessDay();
      sendHeartbeat();
    });
    // Atualiza atalhos dinâmicos do PWA conforme a rota.
    void updateDynamicShortcuts(pathname);
  }, [pathname]);





  useEffect(() => {
    if (typeof window === "undefined") return;

    // Lazy-load AdSense after first paint (apenas no web, não no APK nativo).
    // Mantém-se desligado por padrão até o site ser aprovado no AdSense —
    // ative com VITE_ADSENSE_ENABLED=true.
    const loadAds = () => {
      if (!ADSENSE_ENABLED) return;
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

    // Inicializa AdMob e agenda warm-up da intranet (apenas no APK nativo).
    //
    // Importante (fix de "abre e fecha sozinho" no cold start):
    //  - Não criamos a WebView de warm-up nem mostramos App Open Ad em paralelo
    //    com a montagem da Activity. Esses dois juntos causavam ANR/crash
    //    silencioso em vários devices.
    //  - Cold start = apenas pré-carrega o ad (não exibe). App Open Ad só
    //    aparece em warm resume (>30s em background) — recomendação do Google.
    //  - Warm-up é encadeado APÓS o AdMob init e atrasado ~3s, dando tempo da
    //    Activity inflar e do processo WebView estabilizar.
    let removeAppListener: (() => void) | null = null;
    let warmupTimer = 0;
    if (isNativeApp()) {
      const coldStartTimer = window.setTimeout(() => {
        import("@/lib/admob")
          .then(({ initAdMob, showAppOpenAd }) => {
            initAdMob()
              .then(() => {
                // trigger:"cold" só pré-carrega — não exibe na primeira tela.
                showAppOpenAd({ trigger: "cold" }).catch((e) =>
                  console.warn("[admob] cold preload falhou", e),
                );
              })
              .catch((e) => console.warn("[admob] init falhou", e));

            // Warm-up da intranet, encadeado depois do init do AdMob.
            warmupTimer = window.setTimeout(() => {
              import("@/lib/intranet-warmup")
                .then(({ warmupIntranetSession }) =>
                  warmupIntranetSession().catch((e) =>
                    console.warn("[warmup] cold falhou", e),
                  ),
                )
                .catch((e) => console.warn("[warmup] import falhou", e));
            }, 3000);

            let lastBackgroundedAt = 0;
            const MIN_BG_MS = 30_000;
            import("@capacitor/app")
              .then(({ App }) => {
                App.addListener(
                  "appStateChange",
                  (state: { isActive: boolean }) => {
                    try {
                      if (!state.isActive) {
                        lastBackgroundedAt = Date.now();
                        return;
                      }
                      if (lastBackgroundedAt === 0) return;
                      if (Date.now() - lastBackgroundedAt < MIN_BG_MS) return;
                      showAppOpenAd({ trigger: "resume" }).catch((e) =>
                        console.warn("[admob] resume show falhou", e),
                      );
                      // Re-warm da intranet ao voltar de background longo.
                      import("@/lib/intranet-warmup")
                        .then(({ warmupIntranetSession }) =>
                          warmupIntranetSession().catch(() => {}),
                        )
                        .catch(() => {});
                    } catch (e) {
                      console.warn("[appStateChange] erro", e);
                    }
                  },
                )
                  .then((handle: { remove: () => void }) => {
                    removeAppListener = () => handle.remove();
                  })
                  .catch((e) =>
                    console.warn("[app] addListener falhou", e),
                  );
              })
              .catch((e) => console.warn("[app] import falhou", e));
          })
          .catch((e) => console.warn("[admob] import falhou", e));
      }, 1500);
      // garante limpeza
      void coldStartTimer;
    }


    // Rehydrate reminder timers and re-check every hour for distant reminders.
    import("@/lib/notifications-adapter").then(({ rehydrateReminders }) => {
      rehydrateReminders();
    });

    // Atualiza o badge numérico do ícone do app (PWA instalada) com a contagem de hoje.
    installAppBadgeUpdater();
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

    // Revalida silenciosamente as últimas escalas baixadas quando VPN está ativa (APK).
    if (isNativeApp()) {
      const t = window.setTimeout(() => {
        import("@/lib/escalas-revalidate")
          .then(({ revalidateRecentEscalas }) => revalidateRecentEscalas())
          .catch(() => {});
      }, 4000);
      // limpa no unmount
      void t;
    }

    // Avaliação inteligente — pede review depois de uso recorrente.
    const reviewTimer = window.setTimeout(() => {
      import("@/lib/review-prompt")
        .then(({ maybePromptReview }) => maybePromptReview())
        .catch(() => {});
    }, 8000);

    // Listener para o item "Salvar escala" do menu ⋮ do navegador interno
    // (substitui o botão da antiga tela /intranet).
    let removeSalvarEscala: (() => void) | null = null;
    if (isNativeApp()) {
      void import("@/lib/in-app-webview").then(({ InAppWebView }) => {
        InAppWebView.addListener(
          "intranetSalvarEscala",
          async (ev) => {
            try {
              const { toast } = await import("sonner");
              const { upsertEscala, baixarPdfEmBackground } = await import(
                "@/lib/escalas-baixadas"
              );
              upsertEscala({
                id: ev.id,
                url: ev.url,
                titulo: ev.titulo || `Escala ${ev.id}`,
                dataSalva: new Date().toISOString(),
              });
              toast.success("Escala salva em Escalas baixadas!");
              const ok = await baixarPdfEmBackground(ev.id, ev.url);
              if (ok) toast.success("PDF salvo offline.");
            } catch (e) {
              console.warn("[intranetSalvarEscala] erro", e);
            }
          },
        )
          .then((handle) => { removeSalvarEscala = () => handle.remove(); })
          .catch((e) => console.warn("[intranetSalvarEscala] listener falhou", e));
      });
    }


    return () => {
      clearInterval(id);
      window.clearTimeout(reviewTimer);
      if (warmupTimer) window.clearTimeout(warmupTimer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (ric && (window as any).cancelIdleCallback)
        (window as any).cancelIdleCallback(adTimer);
      else clearTimeout(adTimer);
      if (removeAppListener) removeAppListener();
      if (removeSalvarEscala) removeSalvarEscala();
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
          <WhatsNewModal />
          <InstallConfirmModal />
          <ShareAppNudge />
          <Toaster />

        </DrawerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
