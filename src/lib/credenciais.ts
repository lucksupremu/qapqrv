// Cofre local de credenciais da intranet PMESP.
// AES-GCM com chave derivada por PBKDF2 do PIN do usuário.
// Persistência: Capacitor Preferences quando nativo, localStorage no web.

const STORAGE_KEY = "pmesp_credenciais_v1";
const FLAG_KEY = "pmesp_credenciais_existe";
const SALT_KEY = "pmesp_credenciais_salt";

export type Credenciais = { usuario: string; senha: string };

// ---------- Storage abstraction ----------
async function isNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function storageGet(key: string): Promise<string | null> {
  if (await isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    return value;
  }
  return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
}

async function storageSet(key: string, value: string) {
  if (await isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
    return;
  }
  if (typeof window !== "undefined") window.localStorage.setItem(key, value);
}

async function storageRemove(key: string) {
  if (await isNative()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
    return;
  }
  if (typeof window !== "undefined") window.localStorage.removeItem(key);
}

// ---------- Crypto ----------
function ub64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}
// Garante ArrayBuffer "puro" (não SharedArrayBuffer) para as APIs WebCrypto.
function buf(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function deriveKey(pin: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: buf(salt), iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function getOrCreateSalt() {
  const existing = await storageGet(SALT_KEY);
  if (existing) return ub64(existing);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  await storageSet(SALT_KEY, b64(salt));
  return salt;
}

// ---------- API pública ----------
export async function hasCredenciais(): Promise<boolean> {
  return (await storageGet(FLAG_KEY)) === "1";
}

export async function saveCredenciais(cred: Credenciais, pin: string) {
  const salt = await getOrCreateSalt();
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(cred));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: buf(iv) }, key, buf(plain)),
  );
  const payload = JSON.stringify({ iv: b64(iv), ct: b64(ct) });
  await storageSet(STORAGE_KEY, payload);
  await storageSet(FLAG_KEY, "1");
}

export async function loadCredenciais(pin: string): Promise<Credenciais | null> {
  const raw = await storageGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    const { iv, ct } = JSON.parse(raw) as { iv: string; ct: string };
    const salt = await getOrCreateSalt();
    const key = await deriveKey(pin, salt);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ub64(iv) },
      key,
      ub64(ct),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as Credenciais;
  } catch {
    return null; // PIN errado ou dados corrompidos
  }
}

export async function clearCredenciais() {
  await storageRemove(STORAGE_KEY);
  await storageRemove(FLAG_KEY);
  await storageRemove(SALT_KEY);
}

// ---------- PIN de sessão (cache em memória) ----------
let sessionPin: string | null = null;
export function setSessionPin(pin: string) {
  sessionPin = pin;
}
export function getSessionPin(): string | null {
  return sessionPin;
}
export function clearSessionPin() {
  sessionPin = null;
}
