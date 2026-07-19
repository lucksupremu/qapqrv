import { createFileRoute, redirect } from "@tanstack/react-router";

// Blog foi consolidado na Central de Conteúdo (/conteudos) para eliminar
// duplicidade de índice — Google/AdSense penalizavam URLs distintas com
// conteúdo temático equivalente.
export const Route = createFileRoute("/blog")({
  beforeLoad: () => {
    throw redirect({ to: "/conteudos", replace: true });
  },
});
