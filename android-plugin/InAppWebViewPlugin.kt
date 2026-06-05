package br.com.qapqrv.app.plugins

import android.content.Intent
import androidx.core.content.FileProvider
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import android.webkit.CookieManager
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import kotlin.concurrent.thread

/** Hosts oficiais da PMESP/intranet — recebem TLS relaxado por causa de CA própria/VPN. */
private val TRUSTED_PMESP_HOSTS = listOf(
    "policiamilitar.sp.gov.br",
)

private fun isTrustedPmespHost(host: String?): Boolean {
    if (host.isNullOrBlank()) return false
    val h = host.lowercase()
    return TRUSTED_PMESP_HOSTS.any { h == it || h.endsWith(".$it") }
}

/** SSLContext que aceita qualquer certificado — usar APENAS em hosts confiáveis. */
private fun trustAllSslContext(): SSLContext {
    val trustAll = arrayOf<TrustManager>(object : X509TrustManager {
        override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
        override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
    })
    return SSLContext.getInstance("TLS").apply { init(null, trustAll, SecureRandom()) }
}

/**
 * Plugin Capacitor próprio:
 *  - open: abre WebView interna (Activity dedicada).
 *  - downloadPdf: baixa PDF da intranet validando header %PDF.
 *  - openPdf: abre PDF salvo no app do aparelho via FileProvider + ACTION_VIEW.
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
                    CookieManager.getInstance().getCookie(url)?.let { setRequestProperty("Cookie", it) }
                }
                val status = conn.responseCode
                if (status !in 200..299) {
                    getActivity().runOnUiThread { call.reject("HTTP $status") }
                    conn.disconnect()
                    return@thread
                }
                val contentType = conn.contentType?.lowercase() ?: ""
                conn.inputStream.use { input -> out.outputStream().use { output -> input.copyTo(output) } }
                conn.disconnect()

                // Valida que é PDF real (header %PDF) — evita salvar HTML de login.
                val isPdf = out.length() > 4 && run {
                    val head = ByteArray(4)
                    out.inputStream().use { it.read(head) }
                    head[0] == 0x25.toByte() && head[1] == 0x50.toByte() &&
                        head[2] == 0x44.toByte() && head[3] == 0x46.toByte()
                }
                if (!isPdf) {
                    out.delete()
                    val motivo = if (contentType.contains("html"))
                        "Sessão expirou ou VPN inativa (servidor retornou página HTML)."
                    else "Resposta não é um PDF válido (tipo: $contentType)."
                    getActivity().runOnUiThread { call.reject(motivo) }
                    return@thread
                }

                val ret = JSObject()
                ret.put("path", "escalas/$safeId.pdf")
                ret.put("size", out.length())
                ret.put("mime", "application/pdf")
                getActivity().runOnUiThread { call.resolve(ret) }
            } catch (e: Throwable) {
                getActivity().runOnUiThread { call.reject(e.message ?: "Falha ao baixar PDF") }
            }
        }
    }

    /**
     * Abre um PDF salvo (path relativo dentro de filesDir) usando o app PDF
     * preferido do aparelho. Usa FileProvider para conceder URI segura.
     */
    @PluginMethod
    fun openPdf(call: PluginCall) {
        val path = call.getString("path")
        if (path.isNullOrBlank()) {
            call.reject("path ausente")
            return
        }
        try {
            val file = File(context.filesDir, path)
            if (!file.exists()) {
                call.reject("Arquivo não encontrado: $path")
                return
            }
            val authority = "${context.packageName}.fileprovider"
            val uri = FileProvider.getUriForFile(context, authority, file)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val chooser = Intent.createChooser(intent, "Abrir PDF com").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
            val ret = JSObject()
            ret.put("opened", true)
            call.resolve(ret)
        } catch (e: Throwable) {
            call.reject(e.message ?: "Falha ao abrir PDF")
        }
    }
}
