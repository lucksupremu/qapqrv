package br.com.qapqrv.app.plugins

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.util.Log
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsIntent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin Capacitor para abrir URLs em Chrome Custom Tabs.
 *
 * Vantagens vs WebView interna:
 *  - Usa o Chrome instalado no aparelho (autofill, senhas salvas, dark mode).
 *  - Zero MB extras de runtime.
 *  - Mais estável em sites genéricos (Google, YouTube, notícias).
 *
 * Para intranet PMESP continuamos usando `InAppWebView` (precisa de TLS
 * relaxado da CA própria e cookies de autofill).
 */
@CapacitorPlugin(name = "CustomTabs")
class CustomTabsPlugin : Plugin() {

    companion object {
        private const val TAG = "CustomTabsPlugin"
    }

    @PluginMethod
    fun open(call: PluginCall) {
        val url = call.getString("url")
        if (url.isNullOrBlank()) {
            call.reject("URL ausente")
            return
        }
        val toolbarColorHex = call.getString("toolbarColor") ?: "#2E6B8A"
        val color = try {
            Color.parseColor(toolbarColorHex)
        } catch (_: Throwable) {
            Color.parseColor("#2E6B8A")
        }

        val uri = try {
            Uri.parse(url)
        } catch (e: Throwable) {
            call.reject("URL inválida: ${e.message}")
            return
        }

        val ctx = context
        try {
            val colorParams = CustomTabColorSchemeParams.Builder()
                .setToolbarColor(color)
                .setNavigationBarColor(color)
                .build()
            val intent = CustomTabsIntent.Builder()
                .setDefaultColorSchemeParams(colorParams)
                .setShowTitle(true)
                .setUrlBarHidingEnabled(false)
                .setShareState(CustomTabsIntent.SHARE_STATE_ON)
                .build()
            intent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.launchUrl(ctx, uri)
            val ret = JSObject()
            ret.put("opened", true)
            call.resolve(ret)
        } catch (e: Throwable) {
            Log.w(TAG, "Custom Tabs falhou, fallback ACTION_VIEW", e)
            try {
                val fallback = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                ctx.startActivity(fallback)
                val ret = JSObject()
                ret.put("opened", true)
                call.resolve(ret)
            } catch (e2: Throwable) {
                call.reject(e2.message ?: "Falha ao abrir link")
            }
        }
    }
}
