package br.com.qapqrv.app.plugins

import android.content.Intent
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Plugin Capacitor próprio que abre uma WebView Android nativa em uma
 * Activity dedicada. Substitui o navegador externo que estava com
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

    @PluginMethod
    fun downloadPdf(call: PluginCall) {
        val url = call.getString("url")
        val id = call.getString("id") ?: "escala"
        if (url.isNullOrBlank()) {
            call.reject("URL ausente")
            return
        }

        thread(name = "QapQrvPdfDownload") {
            try {
                val safeId = id.replace(Regex("[^A-Za-z0-9_-]"), "_")
                val dir = File(context.filesDir, "escalas").apply { mkdirs() }
                val out = File(dir, "$safeId.pdf")
                val conn = (URL(url).openConnection() as HttpURLConnection).apply {
                    instanceFollowRedirects = true
                    connectTimeout = 20_000
                    readTimeout = 60_000
                    requestMethod = "GET"
                    setRequestProperty("Accept", "application/pdf,*/*")
                    setRequestProperty(
                        "User-Agent",
                        "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 QAPQRVWebView/1.0",
                    )
                }
                val status = conn.responseCode
                if (status !in 200..299) {
                    getActivity().runOnUiThread { call.reject("HTTP $status") }
                    conn.disconnect()
                    return@thread
                }
                conn.inputStream.use { input -> out.outputStream().use { output -> input.copyTo(output) } }
                conn.disconnect()

                val ret = JSObject()
                ret.put("path", "escalas/$safeId.pdf")
                ret.put("size", out.length())
                ret.put("mime", "application/pdf")
                getActivity().runOnUiThread { call.resolve(ret) }
            } catch (e: Throwable) {
                getActivity().runOnUiThread { call.reject(e.message ?: "Falha ao baixar PDF", e) }
            }
        }
    }
}
