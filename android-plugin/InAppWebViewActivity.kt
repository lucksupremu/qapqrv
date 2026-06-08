package br.com.qapqrv.app.plugins

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.os.Environment
import android.os.Build
import android.util.Log
import android.view.View
import android.view.autofill.AutofillManager
import android.view.ViewGroup
import android.view.Window
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.JsResult
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast

/**
 * Navegador interno baseado no Android System WebView (Chromium).
 * Zero MB extras no APK e suporte total a cookies, JS, popups e downloads.
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "InAppWV"
    }

    private lateinit var webView: WebView
    private lateinit var titleView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton
    private lateinit var errorOverlay: LinearLayout
    private lateinit var errorMessage: TextView

    private var pageTitleFixed = ""
    private var initialUrl = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        val userAgent = intent.getStringExtra(EXTRA_USER_AGENT).orEmpty()
        pageTitleFixed = title
        initialUrl = url

        Log.i(TAG, "onCreate url=$url")

        setContentView(buildLayout(title))
        configureWebView(userAgent)
        webView.loadUrl(url)
    }

    private fun configureWebView(userAgent: String) {
        val s = webView.settings
        s.javaScriptEnabled = true
        s.domStorageEnabled = true
        @Suppress("DEPRECATION")
        s.databaseEnabled = true
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        s.setSupportZoom(true)
        s.builtInZoomControls = true
        s.displayZoomControls = false
        s.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        s.setSupportMultipleWindows(true)
        s.javaScriptCanOpenWindowsAutomatically = true
        s.allowFileAccess = true
        s.allowContentAccess = true
        s.cacheMode = WebSettings.LOAD_DEFAULT
        // Permite que o serviço de Autofill do Android (Google, Samsung Pass, 1Password…)
        // detecte os campos de usuário/senha do WebView e ofereça "Salvar senha?".
        @Suppress("DEPRECATION")
        s.saveFormData = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS
        }
        if (userAgent.isNotBlank()) s.userAgentString = userAgent

        val cm = CookieManager.getInstance()
        cm.setAcceptCookie(true)
        cm.setAcceptThirdPartyCookies(webView, true)
        // Garante que cookies já gravados sejam carregados nesta sessão.
        try { cm.flush() } catch (_: Throwable) {}

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                Log.d(TAG, "onPageStarted $url")
                progressBar.visibility = View.VISIBLE
                hideErrorOverlay()
                // Liga autofill só em hosts da PMESP — evita oferecer salvar senha
                // em sites aleatórios abertos pelo navegador interno.
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val host = try { Uri.parse(url).host.orEmpty() } catch (_: Throwable) { "" }
                    val isPmesp = host.endsWith("policiamilitar.sp.gov.br", ignoreCase = true)
                    webView.importantForAutofill = if (isPmesp)
                        View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS
                    else
                        View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
                }
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                Log.d(TAG, "onPageFinished $url")
                progressBar.visibility = View.GONE
                btnBack.alpha = if (webView.canGoBack()) 1f else 0.3f
                btnForward.alpha = if (webView.canGoForward()) 1f else 0.3f
                // Sinaliza ao framework que terminou um fluxo — aciona o
                // diálogo "Salvar senha?" em ROMs que só disparam no commit().
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        getSystemService(AutofillManager::class.java)?.commit()
                    } catch (_: Throwable) {}
                }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?,
            ): Boolean {
                val uri = request?.url ?: return false
                return handleExternalScheme(uri)
            }

            @Suppress("DEPRECATION")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleExternalScheme(Uri.parse(url))
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler,
                error: SslError,
            ) {
                val host = try { Uri.parse(error.url).host.orEmpty() } catch (_: Throwable) { "" }
                val trusted = host.endsWith("policiamilitar.sp.gov.br", ignoreCase = true)
                if (trusted) {
                    Log.w(TAG, "SSL aceito para host confiável: $host")
                    handler.proceed()
                } else {
                    Log.e(TAG, "SSL rejeitado para $host")
                    handler.cancel()
                    showErrorOverlay(error.url ?: initialUrl, "SSL", "Certificado inválido.")
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?,
            ) {
                val url = request?.url?.toString().orEmpty()
                if (request?.isForMainFrame == true) {
                    Log.e(TAG, "onReceivedError $url code=${error?.errorCode} ${error?.description}")
                    showErrorOverlay(
                        url.ifBlank { initialUrl },
                        "ERR_${error?.errorCode ?: "?"}",
                        error?.description?.toString() ?: "Falha ao carregar.",
                    )
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress >= 100) progressBar.visibility = View.GONE
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                if (pageTitleFixed.isBlank() && !title.isNullOrBlank()) titleView.text = title
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?,
            ): Boolean {
                // Popups (EscOpeDel, iNotes, folha): cria WebView descartável só
                // para capturar a URL alvo e carrega na WebView principal.
                // Reutilizar a própria webView aqui crasha o app em alguns devices.
                if (resultMsg == null) return false
                val tempView = WebView(this@InAppWebViewActivity)
                tempView.settings.javaScriptEnabled = true
                tempView.settings.userAgentString = webView.settings.userAgentString
                tempView.webViewClient = object : WebViewClient() {
                    private var handled = false
                    override fun shouldOverrideUrlLoading(
                        v: WebView?,
                        req: WebResourceRequest?,
                    ): Boolean {
                        val u = req?.url?.toString() ?: return true
                        loadFromPopup(u)
                        return true
                    }

                    @Suppress("DEPRECATION")
                    override fun shouldOverrideUrlLoading(v: WebView?, url: String?): Boolean {
                        if (url != null) loadFromPopup(url)
                        return true
                    }

                    override fun onPageStarted(v: WebView?, url: String?, favicon: Bitmap?) {
                        if (!handled && !url.isNullOrBlank() && url != "about:blank") {
                            loadFromPopup(url)
                        }
                    }

                    private fun loadFromPopup(url: String) {
                        if (handled) return
                        handled = true
                        Log.i(TAG, "popup → main webview: $url")
                        try { tempView.stopLoading() } catch (_: Throwable) {}
                        try { tempView.destroy() } catch (_: Throwable) {}
                        if (!handleExternalScheme(Uri.parse(url))) {
                            webView.loadUrl(url)
                        }
                    }
                }
                val transport = resultMsg.obj as? WebView.WebViewTransport
                transport?.webView = tempView
                resultMsg.sendToTarget()
                return true
            }

            override fun onCloseWindow(window: WebView?) {
                // Popup pediu para fechar — volta no histórico se possível.
                if (webView.canGoBack()) webView.goBack()
            }

            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?,
            ): Boolean {
                try {
                    AlertDialog.Builder(this@InAppWebViewActivity)
                        .setMessage(message ?: "")
                        .setPositiveButton("OK") { _, _ -> result?.confirm() }
                        .setOnCancelListener { result?.cancel() }
                        .show()
                } catch (_: Throwable) { result?.confirm() }
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?,
            ): Boolean {
                try {
                    AlertDialog.Builder(this@InAppWebViewActivity)
                        .setMessage(message ?: "")
                        .setPositiveButton("OK") { _, _ -> result?.confirm() }
                        .setNegativeButton("Cancelar") { _, _ -> result?.cancel() }
                        .setOnCancelListener { result?.cancel() }
                        .show()
                } catch (_: Throwable) { result?.cancel() }
                return true
            }
        }

        webView.setDownloadListener(DownloadListener { url, ua, contentDisposition, mimeType, _ ->
            try {
                val req = DownloadManager.Request(Uri.parse(url))
                val fileName = URLUtil.guessFileName(url, contentDisposition, mimeType)
                req.setMimeType(mimeType)
                req.addRequestHeader("User-Agent", ua)
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(req)
                Toast.makeText(this, "Baixando $fileName…", Toast.LENGTH_SHORT).show()
            } catch (e: Throwable) {
                Log.e(TAG, "Download falhou", e)
                Toast.makeText(this, "Falha no download.", Toast.LENGTH_SHORT).show()
            }
        })
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    /**
     * Trata esquemas de URL que não são http/https (mailto:, tel:, intent:, market:, etc.).
     * Retorna true se a URL foi delegada a um app externo (e o WebView NÃO deve carregá-la).
     * Para http/https, retorna false (deixa o WebView lidar normalmente).
     */
    private fun handleExternalScheme(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme == "http" || scheme == "https" || scheme == "about" || scheme == "data") {
            return false
        }
        return try {
            if (scheme == "intent") {
                val intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
            } else {
                val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            }
            true
        } catch (e: ActivityNotFoundException) {
            Log.w(TAG, "Sem app para abrir $uri")
            Toast.makeText(this, "Nenhum app instalado para abrir este link.", Toast.LENGTH_SHORT).show()
            true
        } catch (e: Throwable) {
            Log.e(TAG, "Falha ao abrir $uri", e)
            true
        }
    }

    override fun onPause() {
        // Persiste cookies em disco para que a sessão da intranet
        // continue válida na próxima abertura (login "lembrado").
        try { CookieManager.getInstance().flush() } catch (_: Throwable) {}
        super.onPause()
    }

    override fun onDestroy() {
        try { CookieManager.getInstance().flush() } catch (_: Throwable) {}
        try {
            webView.stopLoading()
            webView.loadUrl("about:blank")
            webView.removeAllViews()
            webView.destroy()
        } catch (_: Throwable) {}
        super.onDestroy()
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
                webView.reload()
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

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
            // Aceleração de hardware explícita — melhora scroll e render.
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            isScrollbarFadingEnabled = true
            overScrollMode = View.OVER_SCROLL_NEVER
        }

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
                webView.loadUrl(initialUrl)
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
            addView(webView)
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

    private fun showErrorOverlay(url: String, code: String, description: String) {
        val ehIntranet = url.contains("policiamilitar.sp.gov.br", ignoreCase = true) ||
            url.contains("intranet", ignoreCase = true)
        val hintVpn = if (ehIntranet) "\n\n⚠️ Verifique se o AnyConnect (VPN) está conectado." else ""
        errorMessage.text = "$description\n\n[$code]\n$url$hintVpn"
        errorOverlay.visibility = View.VISIBLE
        progressBar.visibility = View.GONE
    }

    private fun hideErrorOverlay() {
        errorOverlay.visibility = View.GONE
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()
}
