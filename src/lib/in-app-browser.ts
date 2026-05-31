// Abre links externos em um navegador interno.
// - No app nativo (Capacitor): usa @capacitor/inappbrowser com injeção de
//   script para autofill do login da intranet PMESP.
// - No web (navegador comum): cai para a rota /intranet (iframe) ou nova aba.

import { toast } from "sonner";
import {
  hasCredenciais,
  loadCredenciais,
  getSessionPin,
  type Credenciais,
} from "./credenciais";

export type AbrirOpts = {
  titulo?: string;
  autofill?: boolean; // tentar preencher login PMESP
};

async function isNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function buildAutofillScript(cred: Credenciais): string {
  const u = JSON.stringify(cred.usuario);
  const s = JSON.stringify(cred.senha);
  return `
    (function(){
      function setVal(el, v){
        var d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        d && d.set ? d.set.call(el, v) : (el.value = v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      function fill(){
        var user = document.querySelector(
          "input[name*='usuario' i], input[name*='login' i], input[name*='user' i], input[id*='usuario' i], input[id*='login' i], input[id*='user' i]"
        );
        var pass = document.querySelector("input[type='password']");
        if (user) setVal(user, ${u});
        if (pass) setVal(pass, ${s});
        return !!(user && pass);
      }
      if (!fill()) {
        var tries = 0;
        var iv = setInterval(function(){
          tries++;
          if (fill() || tries > 20) clearInterval(iv);
        }, 250);
      }
    })();
  `;
}

export async function openInAppBrowser(url: string, opts: AbrirOpts = {}) {
  const titulo = opts.titulo ?? "Intranet PMESP";
  const wantAutofill = opts.autofill ?? true;

  if (await isNative()) {
    try {
      const mod = await import("@capacitor/inappbrowser");
      // @ts-expect-error tipos do pacote variam por versão
      const InAppBrowser = mod.InAppBrowser ?? mod.default;

      let cred: Credenciais | null = null;
      if (wantAutofill && (await hasCredenciais())) {
        const pin = getSessionPin();
        if (pin) cred = await loadCredenciais(pin);
      }

      // API openInWebView (v4+) — espalha defaults para satisfazer o tipo
      await InAppBrowser.openInWebView({
        url,
        options: {
          ...mod.DefaultWebViewOptions,
          showURL: true,
          showNavigationButtons: true,
          closeButtonText: "Fechar",
        },
      });

      if (cred) {
        // Pequeno atraso para a página carregar antes de injetar
        setTimeout(() => {
          try {
            // @ts-expect-error executeScript pode variar conforme versão
            InAppBrowser.executeScript({ code: buildAutofillScript(cred!) });
          } catch (e) {
            console.warn("autofill falhou", e);
          }
        }, 1500);
      }
      return;
    } catch (e) {
      console.warn("InAppBrowser indisponível, fallback web", e);
    }
  }

  // Fallback web: abre nova aba (iframe não consegue autofill)
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    if (wantAutofill && (await hasCredenciais())) {
      toast.info("Autofill só funciona no app instalado (Android).");
    }
  }
}
