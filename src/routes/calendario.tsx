import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/components/em-construcao";

export const Route = createFileRoute("/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Atividade D" }] }),
  component: () => <EmConstrucao titulo="Calendário" />,
});
