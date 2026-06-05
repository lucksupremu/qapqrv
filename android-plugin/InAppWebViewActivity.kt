package br.com.qapqrv.app.plugins

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.webkit.URLUtil
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import org.mozilla.geckoview.AllowOrDeny
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebRequestError
import org.mozilla.geckoview.WebResponse
import java.io.InputStream
import kotlin.concurrent.thread

/**
 * Navegador interno baseado em Mozilla GeckoView (motor do Firefox).
 * Não depende do Android System WebView / Chrome.
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "InAppGecko"
        private const val LOAD_TIMEOUT_MS = 25_000L

        @Volatile
        private var sRuntime: GeckoRuntime? = null

        @Synchronized
        fun runtime(ctx: Context): GeckoRuntime {
            val cached = sRuntime
            if (cached != null) return cached
            val settings = GeckoRuntimeSettings.Builder()
                .javaScriptEnabled(true)
                .aboutConfigEnabled(false)
                .consoleOutput(true)
                .build()
            val r = GeckoRuntime.create(ctx.applicationContext, settings)
            sRuntime = r
            return r
        }
    }

    private lateinit var geckoView: GeckoView
    private lateinit var session: GeckoSession
    private lateinit var titleView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton
    private lateinit var errorOverlay: LinearLayout
    private lateinit var errorMessage: TextView
    private lateinit var loadingOverlay: View

    private var canGoBack = false
    private var canGoForward = false
    private var pageTitleFixed = ""
    private var initialUrl = ""
    private var userAgentOverride: String = ""
    private var firstPaintReceived = false

    private val mainHandler = Handler(Looper.getMainLooper())
    private val timeoutRunnable = Runnable {
        if (!firstPaintReceived) {
            Log.w(TAG, "Timeout sem first-paint para $initialUrl")
            showErrorOverlay(initialUrl, "TIMEOUT", "A página não respondeu a tempo.")
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        userAgentOverride = intent.getStringExtra(EXTRA_USER_AGENT).orEmpty()
        pageTitleFixed = title
        initialUrl = url

        Log.i(TAG, "onCreate url=$url title=$title ua=${userAgentOverride.take(60)}")

        setContentView(buildLayout(title))

        val rt = runtime(this)
        session = newSession(rt)
        geckoView.setSession(session)

        loadUrl(url)
    }

    private fun newSession(rt: GeckoRuntime): GeckoSession {
        val s = GeckoSession(
            GeckoSessionSettings.Builder()
                .usePrivateMode(false)
                .userAgentMode(GeckoSessionSettings.USER_AGENT_MODE_MOBILE)
                .viewportMode(GeckoSessionSettings.VIEWPORT_MODE_MOBILE)
                .allowJavascript(true)
                .build(),
        )
        s.open(rt)
        if (userAgentOverride.isNotBlank()) {
            try {
                s.settings.userAgentOverride = userAgentOverride
            } catch (e: Throwable) {
                Log.w(TAG, "userAgentOverride falhou: ${e.message}")
            }
        }
        attachDelegates(s, rt)
        return s
    }

    private fun attachDelegates(s: GeckoSession, rt: GeckoRuntime) {
        s.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onCanGoBack(ses: GeckoSession, value: Boolean) {
                canGoBack = value
                btnBack.alpha = if (value) 1f else 0.3f
            }

            override fun onCanGoForward(ses: GeckoSession, value: Boolean) {
                canGoForward = value
                btnForward.alpha = if (value) 1f else 0.3f
            }

            override fun onLocationChange(
                ses: GeckoSession,
                url: String?,
                perms: MutableList<GeckoSession.PermissionDelegate.ContentPermission>,
                hasUserGesture: Boolean,
            ) {
                Log.d(TAG, "onLocationChange $url")
            }

            override fun onLoadRequest(
                ses: GeckoSession,
                request: GeckoSession.NavigationDelegate.LoadRequest,
            ): GeckoResult<AllowOrDeny>? {
                Log.d(TAG, "onLoadRequest ${request.uri} target=${request.target}")
                return GeckoResult.fromValue(AllowOrDeny.ALLOW)
            }

            override fun onNewSession(ses: GeckoSession, uri: String): GeckoResult<GeckoSession>? {
                // Em vez de abrir popup (que costuma virar tela branca),
                // carrega o link na sessão atual.
                Log.i(TAG, "onNewSession redirecionado para sessão atual: $uri")
                mainHandler.post { loadUrl(uri) }
                return null
            }

            override fun onLoadError(
                ses: GeckoSession,
                uri: String?,
                error: WebRequestError,
            ): GeckoResult<String>? {
                Log.e(TAG, "onLoadError uri=$uri code=${error.code} cat=${error.category}")

                if (shouldAutoAcceptPmespCertificate(uri, error)) {
                    Log.w(TAG, "Certificado PMESP/iNotes aceito temporariamente para $uri")
                    return GeckoResult.fromValue(buildCertificateExceptionPage(uri.orEmpty()))
                }

                mainHandler.post {
                    showErrorOverlay(uri.orEmpty(), "ERR_${error.code}", error.message ?: "Erro de carregamento")
                }
                return null
            }
        }

        s.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onPageStart(ses: GeckoSession, url: String) {
                Log.d(TAG, "onPageStart $url")
                firstPaintReceived = false
                mainHandler.removeCallbacks(timeoutRunnable)
                mainHandler.postDelayed(timeoutRunnable, LOAD_TIMEOUT_MS)
                progressBar.visibility = View.VISIBLE
                loadingOverlay.visibility = View.VISIBLE
                hideErrorOverlay()
            }

            override fun onProgressChange(ses: GeckoSession, progress: Int) {
                progressBar.progress = progress
                if (progress >= 30) {
                    firstPaintReceived = true
                    loadingOverlay.visibility = View.GONE
                }
                if (progress >= 100) progressBar.visibility = View.GONE
            }

            override fun onPageStop(ses: GeckoSession, success: Boolean) {
                Log.d(TAG, "onPageStop success=$success")
                mainHandler.removeCallbacks(timeoutRunnable)
                progressBar.visibility = View.GONE
                loadingOverlay.visibility = View.GONE
                firstPaintReceived = true
            }
        }

        s.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onTitleChange(ses: GeckoSession, t: String?) {
                if (pageTitleFixed.isBlank() && !t.isNullOrBlank()) titleView.text = t
                Log.d(TAG, "title=$t")
            }

            override fun onFirstContentfulPaint(ses: GeckoSession) {
                firstPaintReceived = true
                loadingOverlay.visibility = View.GONE
                Log.d(TAG, "firstContentfulPaint")
            }

            override fun onCrash(ses: GeckoSession) {
                Log.e(TAG, "GeckoSession crash — recriando")
                mainHandler.post {
                    try { ses.close() } catch (_: Throwable) {}
                    val rt = runtime(this@InAppWebViewActivity)
                    session = newSession(rt)
                    geckoView.setSession(session)
                    loadUrl(initialUrl)
                }
            }

            override fun onExternalResponse(ses: GeckoSession, response: WebResponse) {
                downloadResponseToDownloads(response)
            }
        }

        s.promptDelegate = object : GeckoSession.PromptDelegate {}
    }

    private fun loadUrl(url: String) {
        Log.i(TAG, "loadUrl $url")
        firstPaintReceived = false
        mainHandler.removeCallbacks(timeoutRunnable)
        mainHandler.postDelayed(timeoutRunnable, LOAD_TIMEOUT_MS)
        try {
            session.loadUri(url)
        } catch (e: Throwable) {
            Log.e(TAG, "loadUri falhou", e)
            showErrorOverlay(url, "LOAD_FAIL", e.message ?: "Falha ao iniciar carregamento")
        }
    }

    private fun buildLayout(title: String): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
        }

        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(TOOLBAR_BG)
            setPadding(dp(8), dp(10), dp(8), dp(10))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }
        val btnClose = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(TOOLBAR_FG)
            background = null
            setOnClickListener { finish() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        titleView = TextView(this).apply {
            text = title.ifBlank { "Carregando…" }
            setTextColor(TOOLBAR_FG)
            textSize = 16f
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(dp(8), 0, dp(8), 0)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
        }
        val btnReload = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_rotate)
            setColorFilter(TOOLBAR_FG)
            background = null
            setOnClickListener {
                hideErrorOverlay()
                session.reload()
            }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        toolbar.addView(btnClose)
        toolbar.addView(titleView)
        toolbar.addView(btnReload)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3),
            )
        }

        geckoView = GeckoView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
        }

        // Overlay de loading (cobre o GeckoView enquanto não pinta nada)
        loadingOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(Color.WHITE)
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            addView(ProgressBar(this@InAppWebViewActivity).apply {
                isIndeterminate = true
            })
            addView(TextView(this@InAppWebViewActivity).apply {
                text = "Carregando…"
                setTextColor(TOOLBAR_BG)
                setPadding(0, dp(12), 0, 0)
            })
        }

        // Overlay de erro
        errorOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setBackgroundColor(Color.WHITE)
            setPadding(dp(24), dp(24), dp(24), dp(24))
            visibility = View.GONE
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        val errTitle = TextView(this).apply {
            text = "Não foi possível abrir a página"
            setTextColor(TOOLBAR_BG)
            textSize = 18f
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, dp(8))
        }
        errorMessage = TextView(this).apply {
            text = ""
            setTextColor(0xFF5B7A8F.toInt())
            textSize = 14f
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, dp(16))
        }
        val btnRetry = TextView(this).apply {
            text = "Tentar novamente"
            setTextColor(Color.WHITE)
            setBackgroundColor(TOOLBAR_BG)
            gravity = android.view.Gravity.CENTER
            setPadding(dp(20), dp(12), dp(20), dp(12))
            setOnClickListener {
                hideErrorOverlay()
                loadUrl(initialUrl)
            }
        }
        errorOverlay.addView(errTitle)
        errorOverlay.addView(errorMessage)
        errorOverlay.addView(btnRetry)

        val webContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            setBackgroundColor(Color.WHITE)
            addView(geckoView)
            addView(loadingOverlay)
            addView(errorOverlay)
        }

        val bottomBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(Color.WHITE)
            setPadding(dp(8), dp(6), dp(8), dp(6))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }
        btnBack = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_media_previous)
            setColorFilter(TOOLBAR_BG)
            background = null
            alpha = 0.3f
            setOnClickListener { if (canGoBack) session.goBack() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
        }
        btnForward = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_media_next)
            setColorFilter(TOOLBAR_BG)
            background = null
            alpha = 0.3f
            setOnClickListener { if (canGoForward) session.goForward() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
        }
        bottomBar.addView(btnBack)
        bottomBar.addView(btnForward)

        root.addView(toolbar)
        root.addView(progressBar)
        root.addView(webContainer)
        root.addView(bottomBar)
        return root
    }

    private fun showErrorOverlay(url: String, code: String, description: String) {
        val ehIntranet = url.contains("policiamilitar.sp.gov.br", ignoreCase = true) ||
            url.contains("intranet", ignoreCase = true)
        val hintVpn = if (ehIntranet) "\n\n⚠️ Verifique se o AnyConnect (VPN) está conectado." else ""
        errorMessage.text = "$description\n\n[$code]\n$url$hintVpn"
        errorOverlay.visibility = View.VISIBLE
        loadingOverlay.visibility = View.GONE
        progressBar.visibility = View.GONE
    }

    private fun hideErrorOverlay() {
        errorOverlay.visibility = View.GONE
    }

    private fun shouldAutoAcceptPmespCertificate(url: String?, error: WebRequestError): Boolean {
        if (url.isNullOrBlank()) return false
        val host = try { Uri.parse(url).host.orEmpty() } catch (_: Throwable) { "" }
        val isTrustedPmespHost = host.equals("correio.policiamilitar.sp.gov.br", ignoreCase = true) ||
            host.endsWith(".policiamilitar.sp.gov.br", ignoreCase = true)
        val isCertificateError = error.code == WebRequestError.ERROR_SECURITY_BAD_CERT ||
            error.category == WebRequestError.ERROR_CATEGORY_SECURITY
        return isTrustedPmespHost && isCertificateError
    }

    private fun buildCertificateExceptionPage(failedUrl: String): String {
        val safeMessage = "Abrindo iNotes…"
        val html = """
            <!doctype html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: sans-serif; color: #2e6b8a; background: #fff; }
              </style>
            </head>
            <body>
              <p>$safeMessage</p>
              <script>
                document.addCertException(true).then(function () {
                  location.href = ${org.json.JSONObject.quote(failedUrl)};
                }, function () {
                  location.reload();
                });
              </script>
            </body>
            </html>
        """.trimIndent()
        return "data:text/html;charset=utf-8," + Uri.encode(html)
    }

    override fun onBackPressed() {
        if (::session.isInitialized && canGoBack) {
            session.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(timeoutRunnable)
        if (::session.isInitialized) {
            try { session.close() } catch (_: Throwable) {}
        }
        super.onDestroy()
    }

    private fun dp(v: Int): Int =
        (v * resources.displayMetrics.density).toInt()

    private fun downloadResponseToDownloads(response: WebResponse) {
        thread(name = "QapQrvDownload") {
            try {
                val url = response.uri
                val mime = response.headers["Content-Type"]?.substringBefore(';')?.trim() ?: "application/octet-stream"
                val cd = response.headers["Content-Disposition"]
                val guessed = URLUtil.guessFileName(url, cd, mime)
                val fileName = if (mime.contains("pdf", true) && !guessed.endsWith(".pdf", true)) "$guessed.pdf" else guessed

                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                downloadsDir.mkdirs()
                val out = java.io.File(downloadsDir, fileName)

                val body: InputStream = response.body ?: run {
                    runOnUiThread { Toast.makeText(this, "Download vazio.", Toast.LENGTH_SHORT).show() }
                    return@thread
                }
                body.use { input -> out.outputStream().use { o -> input.copyTo(o) } }

                runOnUiThread {
                    Toast.makeText(this, "Baixado: $fileName", Toast.LENGTH_LONG).show()
                    try {
                        val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                        @Suppress("DEPRECATION")
                        dm.addCompletedDownload(fileName, fileName, true, mime, out.absolutePath, out.length(), true)
                    } catch (_: Throwable) {}
                }
            } catch (e: Throwable) {
                Log.e(TAG, "download falhou", e)
                runOnUiThread { Toast.makeText(this, "Falha no download: ${e.message}", Toast.LENGTH_LONG).show() }
            }
        }
    }
}
