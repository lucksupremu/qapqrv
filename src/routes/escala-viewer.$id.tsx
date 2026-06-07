import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const EscalaViewerClient = lazy(() => import("@/components/escala-viewer-client"));

export const Route = createFileRoute("/escala-viewer/$id")({
  head: ({ params }) => ({ meta: [{ title: `Escala ${params.id} — QAP, QRV!` }] }),
  component: EscalaViewerRoute,
});

function EscalaViewerRoute() {
  const { id } = Route.useParams();
  if (typeof window === "undefined") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
          <Loader2 className="animate-spin" size={28} />
        </div>
      }
    >
      <EscalaViewerClient id={id} />
    </Suspense>
  );
}
