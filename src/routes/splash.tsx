import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/splash")({
  head: () => ({
    meta: [
      { title: "MIKE TOOLS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      sessionStorage.setItem("splash_shown", "1");
    } catch {
      // ignore
    }
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}

