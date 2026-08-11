import { createFileRoute, Outlet } from "@tanstack/react-router";

// Blog foi consolidado na Central de Conteúdo (/conteudos) para eliminar
// duplicidade de índice — Google/AdSense penalizavam URLs distintas com
// conteúdo temático equivalente.
export const Route = createFileRoute("/blog")({
  component: () => <Outlet />,
});
