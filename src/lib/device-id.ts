// Identidade do dispositivo (UUID v4) — usada para escopar inscrições push
// e pushes agendados no servidor. Persiste em localStorage.

const KEY = "qap_device_id_v1";

function uuidv4(): string {
  // Web Crypto disponível em todos os browsers e no webview Capacitor
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback (improvável precisar)
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40;
  arr[8] = (arr[8] & 0x3f) | 0x80;
  const hex = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}
