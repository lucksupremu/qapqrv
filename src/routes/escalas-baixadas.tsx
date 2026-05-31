import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/components/em-construcao";

export const Route = createFileRoute("/escalas-baixadas")({
  head: () => ({ meta: [{ title: "Escalas Baixadas — Atividade D" }] }),
  component: () => <EmConstrucao titulo="Escalas Baixadas" />,
});
