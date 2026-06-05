package br.com.qapqrv.app.plugins

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin Capacitor próprio que abre uma WebView Android nativa em uma
 * Activity dedicada. Substitui o @capacitor/inappbrowser que estava com
 * problemas de UA / cookies em sites .gov.br (intranet PMESP).
 *
 * Uso (TS):
 *   import { registerPlugin } from '@capacitor/core';
 *   const InAppWebView = registerPlugin<InAppWebViewPlugin>('InAppWebView');
 *   await InAppWebView.open({ url, title, userAgent });
 */
@CapacitorPlugin(name = "InAppWebView")
class InAppWebViewPlugin : Plugin() {

    @PluginMethod
    fun open(call: PluginCall) {
        val url = call.getString("url")
        if (url.isNullOrBlank()) {
            call.reject("URL ausente")
            return
        }
        val title = call.getString("title") ?: ""
        val userAgent = call.getString("userAgent") ?: ""

        val intent = Intent(context, InAppWebViewActivity::class.java).apply {
            putExtra(InAppWebViewActivity.EXTRA_URL, url)
            putExtra(InAppWebViewActivity.EXTRA_TITLE, title)
            putExtra(InAppWebViewActivity.EXTRA_USER_AGENT, userAgent)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)

        val ret = JSObject()
        ret.put("opened", true)
        call.resolve(ret)
    }
}
