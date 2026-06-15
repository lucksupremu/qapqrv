package br.com.qapqrv.app.plugins

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.WebView
import android.webkit.WebViewClient
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

    companion object {
        /** Credenciais de autofill (apenas em memória do processo). */
        @Volatile var autofillCpf: String? = null
        @Volatile var autofillSenha: String? = null

        /** Instância viva do plugin pra emitir eventos a partir da Activity interna. */
        @Volatile private var liveInstance: InAppWebViewPlugin? = null

        /** Pedido de "Salvar escala" disparado pelo menu ⋮ do navegador interno. */
        fun emitSalvarEscala(url: String, id: String, titulo: String): Boolean {
            val plugin = liveInstance ?: return false
            return try {
                val data = JSObject()
                data.put("url", url); data.put("id", id); data.put("titulo", titulo)
                plugin.notifyListeners("intranetSalvarEscala", data)
                true
            } catch (_: Throwable) { false }
        }
    }

    override fun load() {
        super.load()
        liveInstance = this
    }

    override fun handleOnDestroy() {
        if (liveInstance === this) liveInstance = null
        super.handleOnDestroy()
    }

    @PluginMethod
    fun setAutofillCredentials(call: PluginCall) {
        autofillCpf = call.getString("cpf")
        autofillSenha = call.getString("senha")
        val ret = JSObject()
        ret.put("ok", true)
        call.resolve(ret)
    }

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
                val parsed = URL(url)
                val trusted = isTrustedPmespHost(parsed.host)

                val conn = (parsed.openConnection() as HttpURLConnection).apply {
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

                    // Em hosts oficiais da PMESP (intranet via VPN), o certificado pode
                    // estar fora do trust-store padrão do Android. Aplica TLS relaxado
                    // SOMENTE nesses hosts para evitar CertPathValidatorException.
                    if (this is HttpsURLConnection && trusted) {
                        sslSocketFactory = trustAllSslContext().socketFactory
                        hostnameVerifier = HostnameVerifier { _, _ -> true }
                    }
                }
                val status = try {
                    conn.responseCode
                } catch (sslErr: javax.net.ssl.SSLHandshakeException) {
                    try { conn.disconnect() } catch (_: Throwable) {}
                    call.reject("Não foi possível validar o acesso à intranet. Confirme a VPN ativa.")
                    return@thread
                }
                if (status !in 200..299) {
                    call.reject("Servidor respondeu HTTP $status. Verifique a VPN/login.")
                    try { conn.disconnect() } catch (_: Throwable) {}
                    return@thread
                }
                val contentType = conn.contentType?.lowercase() ?: ""
                conn.inputStream.use { input -> out.outputStream().use { output -> input.copyTo(output) } }
                try { conn.disconnect() } catch (_: Throwable) {}

                // Valida que é PDF real (header %PDF) — evita salvar HTML de login.
                val isPdf = out.length() > 4 && run {
                    val head = ByteArray(4)
                    out.inputStream().use { it.read(head) }
                    head[0] == 0x25.toByte() && head[1] == 0x50.toByte() &&
                        head[2] == 0x44.toByte() && head[3] == 0x46.toByte()
                }
                if (!isPdf) {
                    try { out.delete() } catch (_: Throwable) {}
                    val motivo = if (contentType.contains("html"))
                        "Sessão expirou ou VPN inativa. Faça login na intranet e tente novamente."
                    else "Resposta não é um PDF válido (tipo: $contentType)."
                    call.reject(motivo)
                    return@thread
                }

                val ret = JSObject()
                ret.put("path", "escalas/$safeId.pdf")
                ret.put("size", out.length())
                ret.put("mime", "application/pdf")
                call.resolve(ret)
            } catch (e: Throwable) {
                android.util.Log.e("InAppWebView", "downloadPdf falhou", e)
                val raw = e.message ?: ""
                val friendly = when {
                    raw.contains("Trust anchor", ignoreCase = true) ||
                        raw.contains("CertPath", ignoreCase = true) ||
                        raw.contains("SSL", ignoreCase = true) ->
                        "Não foi possível validar o acesso à intranet. Confirme a VPN ativa e tente novamente."
                    raw.contains("Unable to resolve host", ignoreCase = true) ||
                        raw.contains("No address associated", ignoreCase = true) ->
                        "Sem conexão com a intranet. Confirme a VPN ativa."
                    raw.contains("timeout", ignoreCase = true) ->
                        "Tempo esgotado ao baixar a escala. Tente novamente."
                    else -> "Falha ao baixar PDF da escala."
                }
                try {
                    call.reject(friendly)
                } catch (_: Throwable) {
                    // call já resolvido/descartado — ignora para não derrubar o processo.
                }
            }
        }
    }

    /**
     * Abre um PDF salvo (path relativo dentro de filesDir) no visualizador
     * interno do app (PdfViewerActivity). Não depende de leitor externo.
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
            val title = call.getString("title") ?: "Escala"
            val intent = Intent(context, PdfViewerActivity::class.java).apply {
                putExtra(PdfViewerActivity.EXTRA_PATH, path)
                putExtra(PdfViewerActivity.EXTRA_TITLE, title)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            val ret = JSObject()
            ret.put("opened", true)
            call.resolve(ret)
        } catch (e: Throwable) {
            call.reject(e.message ?: "Falha ao abrir PDF")
        }
    }

    /** Fallback: abre o PDF via app externo (Google PDF, etc.) usando FileProvider. */
    @PluginMethod
    fun openPdfExternal(call: PluginCall) {
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
            // Verifica se existe pelo menos um leitor de PDF instalado.
            val resolvers = context.packageManager.queryIntentActivities(intent, 0)
            if (resolvers.isEmpty()) {
                call.reject("NO_VIEWER: nenhum leitor de PDF instalado")
                return
            }
            val chooser = Intent.createChooser(intent, "Abrir PDF com").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(chooser)
            val ret = JSObject()
            ret.put("opened", true)
            call.resolve(ret)
        } catch (e: Throwable) {
            call.reject(e.message ?: "Falha ao abrir PDF externo")
        }
    }

    /**
     * Warm-up de sessão na intranet PMESP: cria uma WebView invisível,
     * carrega a URL informada e aguarda `onPageFinished`. O CookieManager
     * é compartilhado entre WebView e HttpURLConnection, então os cookies
     * de sessão (autenticação via VPN) ficam disponíveis para o
     * downloadPdf subsequente.
     *
     * Não exibe nenhuma UI. Sempre resolve (success ou timeout) — nunca
     * derruba a JS thread.
     */
    @PluginMethod
    fun warmupIntranet(call: PluginCall) {
        val url = call.getString("url")
        if (url.isNullOrBlank()) {
            call.reject("URL ausente")
            return
        }
        val act = activity ?: run {
            call.resolve(JSObject().put("ok", false).put("reason", "no_activity"))
            return
        }
        val timeoutMs = (call.getInt("timeoutMs") ?: 15000).coerceIn(2000, 60000)

        Handler(Looper.getMainLooper()).post {
            try {
                val wv = WebView(act).apply {
                    visibility = View.GONE
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.userAgentString =
                        "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 " +
                            "(KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 QAPQRVWebView/1.0"
                }
                val cm = CookieManager.getInstance()
                cm.setAcceptCookie(true)
                cm.setAcceptThirdPartyCookies(wv, true)

                var resolved = false
                fun finish(ok: Boolean, reason: String?) {
                    if (resolved) return
                    resolved = true
                    try {
                        cm.flush()
                    } catch (_: Throwable) {}
                    try {
                        wv.stopLoading()
                        wv.loadUrl("about:blank")
                        wv.destroy()
                    } catch (_: Throwable) {}
                    val ret = JSObject().put("ok", ok)
                    if (reason != null) ret.put("reason", reason)
                    call.resolve(ret)
                }

                wv.webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, finishedUrl: String?) {
                        finish(true, null)
                    }
                }

                Handler(Looper.getMainLooper()).postDelayed({
                    finish(false, "timeout")
                }, timeoutMs.toLong())

                // Adia o loadUrl em ~800ms — dá tempo do processo WebView
                // estabilizar e evita crash em cold start no APK.
                Handler(Looper.getMainLooper()).postDelayed({
                    try { wv.loadUrl(url) } catch (e: Throwable) {
                        android.util.Log.w("InAppWebView", "warmup loadUrl falhou", e)
                        finish(false, "load_failed")
                    }
                }, 800)
            } catch (e: Throwable) {
                android.util.Log.w("InAppWebView", "warmupIntranet falhou", e)
                call.resolve(JSObject().put("ok", false).put("reason", e.message ?: "erro"))
            }
        }
    }
}
