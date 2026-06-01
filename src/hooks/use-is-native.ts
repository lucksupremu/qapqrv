import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/in-app-browser";

/**
 * Retorna true apenas quando rodando no APK Capacitor.
 * Começa como false (igual ao SSR) e atualiza no mount para evitar
 * hydration mismatch.
 */
export function useIsNative(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativeApp());
  }, []);
  return native;
}
