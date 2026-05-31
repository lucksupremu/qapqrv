import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.qapqrv.app",
  appName: "QAP, QRV!",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
