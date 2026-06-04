import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.qapqrv.app",
  appName: "QAP, QRV!",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    AdMob: {
      appId: "ca-app-pub-4966192764194561~2515666476",
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0b1733",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
