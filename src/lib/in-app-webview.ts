// Wrapper TypeScript do plugin Android nativo `InAppWebView`.
// Registra o plugin via Capacitor; no web é no-op.
import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface InAppWebViewOpenOptions {
  url: string;
  title?: string;
  /** UA customizado. Default: navegador interno Android (definido no lado Kotlin). */
  userAgent?: string;
}

export interface IntranetSalvarEscalaEvent {
  url: string;
  id: string;
  titulo: string;
}

export interface InAppWebViewPlugin {
  open(options: InAppWebViewOpenOptions): Promise<{ opened: boolean }>;
  downloadPdf(options: { url: string; id: string }): Promise<{ path: string; size: number; mime: string }>;
  /** @deprecated Agora delega para `openPdfExternal` (Drive/Adobe). */
  openPdf(options: { path: string; title?: string }): Promise<{ opened: boolean }>;
  openPdfExternal(options: { path: string }): Promise<{ opened: boolean }>;
  warmupIntranet(options: { url: string; timeoutMs?: number }): Promise<{ ok: boolean; reason?: string }>;
  /**
   * Define credenciais para autofill na próxima abertura da intranet.
   * Implementado no plugin Android; no web é no-op (resolve silenciosamente).
   */
  setAutofillCredentials?(options: { cpf: string; senha: string }): Promise<{ ok: boolean }>;
  /**
   * Evento emitido quando o usuário toca em "Salvar escala" no menu ⋮ do
   * navegador interno (só dispara em URLs de escala da PMESP).
   */
  addListener(
    eventName: "intranetSalvarEscala",
    listener: (data: IntranetSalvarEscalaEvent) => void,
  ): Promise<PluginListenerHandle>;
}

export const InAppWebView =
  registerPlugin<InAppWebViewPlugin>("InAppWebView");

