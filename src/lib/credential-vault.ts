// Cofre local de credenciais da intranet PMESP.
// Armazena CPF + senha criptografados com AES-GCM, com chave derivada via PBKDF2
// a partir de um PIN de 4 dígitos definido pelo usuário.
//
// Importante:
// - PIN nunca é salvo em lugar nenhum. Se o usuário esquecer, precisa recadastrar.
// - Senha em texto puro só existe em memória após o PIN ser digitado.
// - Tudo fica em localStorage (criptografado); nada vai para servidor.

const STORAGE_KEY = "intranet_vault_v1";
const ENABLED_KEY = "intranet_vault_enabled";
const PBKDF2_ITERATIONS = 150_000;

type StoredPayload = {
  v: 1;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64 (CPF + "\n" + senha cifrados juntos)
  createdAt: string;
};

export type VaultCredentials = {
  cpf: string;
  senha: string;
};

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const raw = atob(s);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin) as BufferSource,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function vaultHas(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(STORAGE_KEY);
}

export function vaultEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ENABLED_KEY) === "1" && vaultHas();
}

export function setVaultEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
}

export async function vaultSet(
  creds: VaultCredentials,
  pin: string,
): Promise<void> {
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN deve ter 4 dígitos.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const enc = new TextEncoder();
  const plaintext = enc.encode(`${creds.cpf}\n${creds.senha}`);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      plaintext as BufferSource,
    ),
  );
  const payload: StoredPayload = {
    v: 1,
    salt: b64encode(salt),
    iv: b64encode(iv),
    ciphertext: b64encode(cipher),
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  setVaultEnabled(true);
}

export async function vaultGet(pin: string): Promise<VaultCredentials | null> {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const p = JSON.parse(raw) as StoredPayload;
  const salt = b64decode(p.salt);
  const iv = b64decode(p.iv);
  const cipher = b64decode(p.ciphertext);
  try {
    const key = await deriveKey(pin, salt);
    const plain = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher),
    );
    const txt = new TextDecoder().decode(plain);
    const [cpf, ...rest] = txt.split("\n");
    return { cpf, senha: rest.join("\n") };
  } catch {
    return null; // PIN errado ou dado corrompido
  }
}

export function vaultClear(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(ENABLED_KEY);
}

// Controle de tentativas com lockout simples (em memória da sessão)
let failedAttempts = 0;
let lockedUntil = 0;

export function vaultLockState(): { locked: boolean; secondsLeft: number; attempts: number } {
  const now = Date.now();
  const locked = lockedUntil > now;
  return {
    locked,
    secondsLeft: locked ? Math.ceil((lockedUntil - now) / 1000) : 0,
    attempts: failedAttempts,
  };
}

export function vaultRegisterAttempt(success: boolean) {
  if (success) {
    failedAttempts = 0;
    lockedUntil = 0;
    return;
  }
  failedAttempts++;
  if (failedAttempts >= 3) {
    lockedUntil = Date.now() + 30_000;
    failedAttempts = 0;
  }
}
