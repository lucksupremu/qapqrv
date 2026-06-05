// Wrapper TypeScript do plugin Android nativo `InAppWebView`.
// Registra o plugin via Capacitor; no web é no-op.
import { registerPlugin } from "@capacitor/core";

export interface InAppWebViewOpenOptions {
  url: string;
  title?: string;
  /** UA customizado. Default: navegador interno Android (definido no lado Kotlin). */
  userAgent?: string;
}

export interface InAppWebViewPlugin {
  open(options: InAppWebViewOpenOptions): Promise<{ opened: boolean }>;
  downloadPdf(options: { url: string; id: string }): Promise<{ path: string; size: number; mime: string }>;
  openPdf(options: { path: string; title?: string }): Promise<{ opened: boolean }>;
  openPdfExternal(options: { path: string }): Promise<{ opened: boolean }>;
  warmupIntranet(options: { url: string; timeoutMs?: number }): Promise<{ ok: boolean; reason?: string }>;
}

export const InAppWebView =
  registerPlugin<InAppWebViewPlugin>("InAppWebView");
