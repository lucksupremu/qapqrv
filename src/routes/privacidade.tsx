import { createFileRoute } from "@tanstack/react-router";
import { EmConstrucao } from "@/components/em-construcao";

export const Route = createFileRoute("/privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Atividade D" }] }),
  component: () => <EmConstrucao titulo="Política de Privacidade" />,
});
