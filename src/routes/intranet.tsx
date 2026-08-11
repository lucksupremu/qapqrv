// Tela "intranet" — redirecionador. Não tem mais UI própria; abre o navegador
// interno imersivo (mesmo de qualquer link), opcionalmente passando credenciais
// do cofre via plugin nativo pra fazer autofill no formulário de login.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { openInAppBrowser, isNativeApp } from "@/lib/in-app-browser";
import { UnlockPinModal } from "@/components/unlock-pin-modal";
import { vaultEnabled } from "@/lib/credential-vault";
import { InAppWebView } from "@/lib/in-app-webview";

const searchSchema = z.object({
  url: z
    .string()
    .max(2048)
    .default("http://ms.policiamilitar.sp.gov.br/login.aspx"),
  titulo: z.string().min(1).max(120).default("Intranet PMESP"),
});

export const Route = createFileRoute("/intranet")({
  head: () => ({
    meta: [{ title: "Intranet — MIKE TOOLS" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: IntranetRedirect,
});

function IntranetRedirect() {
  const navigate = useNavigate();
  const { url, titulo } = Route.useSearch();
  const [pinOpen, setPinOpen] = useState(false);
  const [didOpen, setDidOpen] = useState(false);

  useEffect(() => {
    if (didOpen) return;
    // No web, abre direto em nova aba e volta.
    if (!isNativeApp()) {
      void openInAppBrowser(url, { titulo });
      navigate({ to: "/" });
      return;
    }
    // No APK: se tem cofre, pede PIN antes; senão abre direto.
    if (vaultEnabled()) {
      setPinOpen(true);
    } else {
      setDidOpen(true);
      void openInAppBrowser(url, { titulo });
      navigate({ to: "/" });
    }
  }, [url, titulo, navigate, didOpen]);

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <p className="text-sm opacity-70">Abrindo intranet…</p>

      <UnlockPinModal
        open={pinOpen}
        onOpenChange={(o) => {
          setPinOpen(o);
          if (!o && !didOpen) navigate({ to: "/" });
        }}
        onUnlock={async (creds) => {
          setDidOpen(true);
          try {
            if (InAppWebView.setAutofillCredentials) {
              await InAppWebView.setAutofillCredentials(creds);
            }
          } catch (e) {
            console.warn("setAutofillCredentials falhou", e);
            toast.error("Autofill indisponível neste build. Atualize o app.");
          }
          await openInAppBrowser(url, { titulo });
          navigate({ to: "/" });
        }}
      />
    </div>
  );
}
