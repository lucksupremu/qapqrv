// Wrapper TypeScript do plugin nativo Android `CustomTabs`.
// Abre URLs em Chrome Custom Tabs — herda autofill/senhas/dark-mode do Chrome
// do usuário, sem ocupar MB extras no APK. No web é no-op (resolve `opened:false`).
import { registerPlugin } from "@capacitor/core";

export interface CustomTabsOpenOptions {
  url: string;
  /** Cor hex (ex: "#2e6b8a"). Default no lado nativo: cor da toolbar do app. */
  toolbarColor?: string;
}

export interface CustomTabsPlugin {
  open(options: CustomTabsOpenOptions): Promise<{ opened: boolean }>;
}

export const CustomTabs = registerPlugin<CustomTabsPlugin>("CustomTabs");
