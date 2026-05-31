import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/components/em-construcao";

export const Route = createFileRoute("/anyconnect")({
  head: () => ({ meta: [{ title: "AnyConnect — Atividade D" }] }),
  component: () => <EmConstrucao titulo="AnyConnect" />,
});
