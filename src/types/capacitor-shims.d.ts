// APK descontinuado — os módulos Capacitor não estão mais instalados.
// Estes shims existem só para o TypeScript não reclamar dos imports dinâmicos
// remanescentes em código dead-branch (guardado por `isNativeApp()` que agora
// sempre retorna false). Em runtime esses imports nunca são executados.
declare module "@capacitor/core";
declare module "@capacitor/filesystem";
declare module "@capacitor/inappbrowser";
declare module "@capacitor/app-launcher";
declare module "@capacitor/local-notifications";
declare module "@capacitor/push-notifications";
declare module "@capacitor/preferences";
declare module "@capacitor-community/admob";
