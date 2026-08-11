import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/index")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  component: () => <Navigate to="/" replace />,
});
