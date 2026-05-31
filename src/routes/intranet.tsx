import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/components/em-construcao";

export const Route = createFileRoute("/intranet")({
  head: () => ({ meta: [{ title: "Intranet — Atividade D" }] }),
  component: () => <EmConstrucao titulo="Intranet" />,
});
