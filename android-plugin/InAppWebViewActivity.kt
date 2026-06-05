package br.com.qapqrv.app.plugins

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.os.Message
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast

/**
 * Activity que hospeda uma WebView Android nativa em tela cheia. Controle
 * total de User-Agent, cookies (inclusive third-party — essencial pra
 * .gov.br), JS, zoom, downloads e botão voltar.
 *
 * Layout é construído em código pra não depender de um arquivo XML que
 * precisaria ser copiado pra res/layout/ no CI (mais simples).
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val DEFAULT_UA =
            "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 QAPQRVWebView/1.0"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
    }

    private lateinit var webView: WebView
    private lateinit var titleView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        val ua = intent.getStringExtra(EXTRA_USER_AGENT).takeUnless { it.isNullOrBlank() }
            ?: DEFAULT_UA

        setContentView(buildLayout(title))

        // Cookies (essencial pra autenticação em .gov.br)
        val cm = CookieManager.getInstance()
        cm.setAcceptCookie(true)
        cm.setAcceptThirdPartyCookies(webView, true)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false
            userAgentString = ua
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val u = request.url.toString()
                // mailto: / tel: / intent: → deixa o Android resolver
                if (!u.startsWith("http://") && !u.startsWith("https://")) {
                    return try {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url))
                        true
                    } catch (_: Throwable) { true }
                }
                if (isPdfLikeUrl(u)) {
                    downloadPdfToDownloads(u, null, "application/pdf")
                    showDownloadedPdfPage(u)
                    return true
                }
                return false
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: android.net.http.SslError?,
            ) {
                val host = error?.url.orEmpty().lowercase()
                if (host.contains("policiamilitar.sp.gov.br")) {
                    handler?.proceed()
                } else {
                    handler?.cancel()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: android.webkit.WebResourceError?,
            ) {
                super.onReceivedError(view, request, error)
                // Só mostra a tela de erro se for o frame principal
                if (request?.isForMainFrame != true) return
                val code = error?.errorCode ?: 0
                val desc = error?.description?.toString() ?: "Erro desconhecido"
                val failingUrl = request.url?.toString() ?: ""
                Log.e("InAppWebView", "onReceivedError code=$code desc=$desc url=$failingUrl")
                showErrorPage(failingUrl, errorCodeName(code), desc)
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: android.webkit.WebResourceResponse?,
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame != true) return
                val status = errorResponse?.statusCode ?: 0
                val reason = errorResponse?.reasonPhrase ?: ""
                val failingUrl = request.url?.toString() ?: ""
                Log.e("InAppWebView", "onReceivedHttpError $status $reason url=$failingUrl")
                // Só sobrescreve a tela em 4xx/5xx do documento principal
                if (status >= 400) {
                    showErrorPage(failingUrl, "HTTP $status", reason.ifBlank { "Erro do servidor" })
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                btnBack.alpha = if (webView.canGoBack()) 1f else 0.3f
                btnForward.alpha = if (webView.canGoForward()) 1f else 0.3f
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message?,
            ): Boolean {
                val popup = WebView(this@InAppWebViewActivity)
                popup.settings.javaScriptEnabled = true
                popup.settings.domStorageEnabled = true
                popup.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(v: WebView, request: WebResourceRequest): Boolean {
                        val target = request.url.toString()
                        if (isPdfLikeUrl(target)) {
                            downloadPdfToDownloads(target, null, "application/pdf")
                            showDownloadedPdfPage(target)
                        } else {
                            webView.loadUrl(target)
                        }
                        return true
                    }
                }
                val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
                transport.webView = popup
                resultMsg.sendToTarget()
                return true
            }

            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE
            }

            override fun onReceivedTitle(view: WebView?, t: String?) {
                if (title.isBlank() && !t.isNullOrBlank()) titleView.text = t
            }
        }

        // Downloads (PDFs de escala, etc.) → DownloadManager do Android
        webView.setDownloadListener(DownloadListener { dlUrl, _, contentDisposition, mimeType, _ ->
            downloadPdfToDownloads(dlUrl, contentDisposition, mimeType)
            if ((mimeType ?: "").contains("pdf", ignoreCase = true) || isPdfLikeUrl(dlUrl)) {
                showDownloadedPdfPage(dlUrl)
            }
        })

        if (isPdfLikeUrl(url)) {
            downloadPdfToDownloads(url, null, "application/pdf")
            showDownloadedPdfPage(url)
        } else {
            webView.loadUrl(url)
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

        // ---- Toolbar superior ----
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
            setOnClickListener { webView.reload() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        toolbar.addView(btnClose)
        toolbar.addView(titleView)
        toolbar.addView(btnReload)

        // ---- Progress bar ----
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3),
            )
        }

        // ---- WebView ----
        webView = WebView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
        }
        val webContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            addView(webView)
        }

        // ---- Bottom bar (voltar / avançar / abrir externo) ----
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
            setOnClickListener { if (webView.canGoBack()) webView.goBack() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
        }
        btnForward = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_media_next)
            setColorFilter(TOOLBAR_BG)
            background = null
            alpha = 0.3f
            setOnClickListener { if (webView.canGoForward()) webView.goForward() }
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

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) {
            (webView.parent as? ViewGroup)?.removeView(webView)
            webView.stopLoading()
            webView.destroy()
        }
        super.onDestroy()
    }

    private fun dp(v: Int): Int =
        (v * resources.displayMetrics.density).toInt()

    private fun errorCodeName(code: Int): String = when (code) {
        WebViewClient.ERROR_HOST_LOOKUP -> "ERR_NAME_NOT_RESOLVED"
        WebViewClient.ERROR_CONNECT -> "ERR_CONNECTION_REFUSED"
        WebViewClient.ERROR_TIMEOUT -> "ERR_CONNECTION_TIMED_OUT"
        WebViewClient.ERROR_UNKNOWN -> "ERR_UNKNOWN"
        WebViewClient.ERROR_BAD_URL -> "ERR_BAD_URL"
        WebViewClient.ERROR_FAILED_SSL_HANDSHAKE -> "ERR_SSL_HANDSHAKE"
        WebViewClient.ERROR_PROXY_AUTHENTICATION -> "ERR_PROXY_AUTH"
        WebViewClient.ERROR_REDIRECT_LOOP -> "ERR_REDIRECT_LOOP"
        WebViewClient.ERROR_UNSUPPORTED_AUTH_SCHEME -> "ERR_UNSUPPORTED_AUTH"
        WebViewClient.ERROR_UNSUPPORTED_SCHEME -> "ERR_UNSUPPORTED_SCHEME"
        WebViewClient.ERROR_AUTHENTICATION -> "ERR_AUTHENTICATION"
        WebViewClient.ERROR_FILE -> "ERR_FILE"
        WebViewClient.ERROR_FILE_NOT_FOUND -> "ERR_FILE_NOT_FOUND"
        WebViewClient.ERROR_TOO_MANY_REQUESTS -> "ERR_TOO_MANY_REQUESTS"
        -10 -> "ERR_UNSUPPORTED_SCHEME"
        else -> "ERR_$code"
    }

    private fun isPdfLikeUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.endsWith(".pdf") ||
            lower.contains(".pdf?") ||
            lower.contains("arrelconesc.aspx")
    }

    private fun downloadPdfToDownloads(dlUrl: String, contentDisposition: String?, mimeType: String?) {
        try {
            val safeMime = mimeType?.takeIf { it.isNotBlank() } ?: "application/pdf"
            val guessed = URLUtil.guessFileName(dlUrl, contentDisposition, safeMime)
            val fileName = if (guessed.endsWith(".pdf", ignoreCase = true)) guessed else "$guessed.pdf"
            val req = DownloadManager.Request(Uri.parse(dlUrl))
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                .setMimeType("application/pdf")
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
            CookieManager.getInstance().getCookie(dlUrl)?.let { req.addRequestHeader("Cookie", it) }
            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(req)
            Toast.makeText(this, "PDF baixando: $fileName", Toast.LENGTH_SHORT).show()
        } catch (e: Throwable) {
            Log.e("InAppWebView", "downloadPdfToDownloads falhou url=$dlUrl", e)
            Toast.makeText(this, "Falha ao baixar PDF: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun showDownloadedPdfPage(pdfUrl: String) {
        val safeUrl = pdfUrl.replace("&", "&amp;").replace("<", "&lt;")
        val html = """
            <!DOCTYPE html>
            <html lang="pt-br"><head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
              body{font-family:-apple-system,Roboto,sans-serif;margin:0;padding:24px;background:#f6f8fb;color:#1f2d3d}
              .card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 16px rgba(46,107,138,.08);max-width:520px;margin:24px auto}
              h1{color:#2e6b8a;font-size:20px;margin:0 0 8px}
              p{line-height:1.5;color:#5b7a8f;font-size:14px;margin:8px 0}
              .url{font-size:12px;color:#7a8fa3;word-break:break-all;margin-top:12px}
              button{width:100%;height:44px;border-radius:12px;border:0;background:#2e6b8a;color:#fff;font-size:14px;font-weight:600;margin-top:18px}
            </style></head>
            <body>
              <div class="card">
                <h1>PDF enviado para download</h1>
                <p>O Android está baixando este PDF. A escala consultada também ficará registrada em <b>Escalas baixadas</b> dentro do aplicativo.</p>
                <div class="url">$safeUrl</div>
                <button onclick="location.href='$safeUrl'">Baixar novamente</button>
              </div>
            </body></html>
        """.trimIndent()
        webView.loadDataWithBaseURL(pdfUrl, html, "text/html", "UTF-8", pdfUrl)
    }

    private fun showErrorPage(failingUrl: String, codeName: String, description: String) {
        val ehIntranet = failingUrl.contains("policiamilitar.sp.gov.br", ignoreCase = true) ||
            failingUrl.contains("intranet", ignoreCase = true)
        val dicaVpn = if (ehIntranet) {
            "<div class='warn'>⚠️ Este é um endereço da intranet PMESP. " +
                "Verifique se o <b>AnyConnect</b> está conectado antes de tentar novamente.</div>"
        } else ""
        val cleartext = if (codeName == "ERR_CLEARTEXT_NOT_PERMITTED" ||
            description.contains("cleartext", ignoreCase = true)
        ) {
            "<div class='warn'>O sistema bloqueou uma conexão HTTP não-segura. " +
                "Reinstale a versão mais recente do APK.</div>"
        } else ""
        val safeUrl = failingUrl.replace("&", "&amp;").replace("<", "&lt;")
        val safeDesc = description.replace("&", "&amp;").replace("<", "&lt;")
        val html = """
            <!DOCTYPE html>
            <html lang="pt-br"><head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
              body{font-family:-apple-system,Roboto,sans-serif;margin:0;padding:24px;
                   background:#f6f8fb;color:#1f2d3d}
              .card{background:#fff;border-radius:16px;padding:24px;
                    box-shadow:0 4px 16px rgba(46,107,138,.08);max-width:520px;margin:24px auto}
              h1{color:#2e6b8a;font-size:20px;margin:0 0 8px}
              p{line-height:1.5;color:#5b7a8f;font-size:14px;margin:8px 0}
              .code{font-family:monospace;background:#eef3f8;color:#2e6b8a;
                    padding:6px 10px;border-radius:8px;display:inline-block;
                    font-size:12px;margin-top:8px;word-break:break-all}
              .url{font-size:12px;color:#7a8fa3;word-break:break-all;margin-top:12px}
              .warn{background:#fff4e0;border-left:4px solid #f0a020;
                    padding:12px;border-radius:8px;margin:16px 0;font-size:14px;color:#8a5a00}
              .row{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}
              button{flex:1;min-width:140px;height:44px;border-radius:12px;border:0;
                     font-size:14px;font-weight:600;cursor:pointer}
              .primary{background:#2e6b8a;color:#fff}
              .ghost{background:#fff;color:#2e6b8a;border:2px solid #2e6b8a}
            </style></head>
            <body>
              <div class="card">
                <h1>Não foi possível abrir a página</h1>
                <p>$safeDesc</p>
                <div class="code">$codeName</div>
                $dicaVpn
                $cleartext
                <div class="url">$safeUrl</div>
                <div class="row">
                  <button class="primary" onclick="location.href='$safeUrl'">Tentar de novo</button>
                </div>
              </div>
            </body></html>
        """.trimIndent()
        // Carrega com base URL pra manter o histórico/recarregar funcionando
        webView.loadDataWithBaseURL(failingUrl, html, "text/html", "UTF-8", failingUrl)
    }
}
