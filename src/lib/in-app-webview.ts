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
}

export const InAppWebView =
  registerPlugin<InAppWebViewPlugin>("InAppWebView");
