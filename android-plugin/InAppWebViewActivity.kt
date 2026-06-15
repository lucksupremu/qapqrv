package br.com.qapqrv.app.plugins

import android.app.Activity
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.os.Environment
import android.os.Build
import android.text.InputType
import android.text.TextUtils
import android.util.Log
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.autofill.AutofillManager
import android.view.ViewGroup
import android.view.Window
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
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
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.PopupMenu
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

/**
 * Navegador interno baseado no Android System WebView (Chromium).
 * Inclui: URL bar editável, menu overflow (compartilhar/copiar/abrir no Chrome/
 * modo desktop/buscar na página/limpar cache), pull-to-refresh, long-press
 * em links (abrir em nova janela / copiar / compartilhar) e overlay de erro.
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "InAppWV"

        private const val UA_DESKTOP =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    private lateinit var webView: WebView
    private lateinit var urlBar: EditText
    private lateinit var progressBar: ProgressBar
    private lateinit var btnBack: ImageButton
    private lateinit var btnForward: ImageButton
    private lateinit var btnOverflow: ImageButton
    private lateinit var errorOverlay: LinearLayout
    private lateinit var errorMessage: TextView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var findBar: LinearLayout
    private lateinit var findInput: EditText
    private lateinit var findCount: TextView

    private var pageTitleFixed = ""
    private var initialUrl = ""
    private var defaultUserAgent: String = ""
    private var desktopMode = false
    private var currentUrl = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        val userAgent = intent.getStringExtra(EXTRA_USER_AGENT).orEmpty()
        pageTitleFixed = title
        initialUrl = url
        currentUrl = url

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
        @Suppress("DEPRECATION")
        s.saveFormData = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS
        }
        defaultUserAgent = if (userAgent.isNotBlank()) userAgent else s.userAgentString
        s.userAgentString = defaultUserAgent

        val cm = CookieManager.getInstance()
        cm.setAcceptCookie(true)
        cm.setAcceptThirdPartyCookies(webView, true)
        try { cm.flush() } catch (_: Throwable) {}

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                Log.d(TAG, "onPageStarted $url")
                progressBar.visibility = View.VISIBLE
                hideErrorOverlay()
                if (!url.isNullOrBlank()) {
                    currentUrl = url
                    updateUrlBar(url)
                }
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
                swipeRefresh.isRefreshing = false
                btnBack.alpha = if (webView.canGoBack()) 1f else 0.3f
                btnForward.alpha = if (webView.canGoForward()) 1f else 0.3f
                if (!url.isNullOrBlank()) {
                    currentUrl = url
                    updateUrlBar(url)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try {
                        getSystemService(AutofillManager::class.java)?.commit()
                    } catch (_: Throwable) {}
                }
                tryIntranetAutofill(url)
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
                    swipeRefresh.isRefreshing = false
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
                // Title fixo só é usado pra logging; URL bar mostra a URL.
                if (!title.isNullOrBlank()) pageTitleFixed = title
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?,
            ): Boolean {
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

        // Long-press em link/imagem.
        webView.setOnLongClickListener { _ ->
            val hit = webView.hitTestResult
            val extra = hit.extra ?: return@setOnLongClickListener false
            when (hit.type) {
                WebView.HitTestResult.SRC_ANCHOR_TYPE,
                WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE -> {
                    showLinkContextMenu(extra)
                    true
                }
                else -> false
            }
        }
    }

    override fun onBackPressed() {
        if (findBar.visibility == View.VISIBLE) { hideFindBar(); return }
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    /**
     * Trata esquemas de URL que não são http/https (mailto:, tel:, intent:, market:, etc.).
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

    // ---------------- Layout ----------------

    private fun buildLayout(title: String): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
        }

        // Toolbar com [X] [URL editável] [⋮]
        val toolbar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(TOOLBAR_BG)
            setPadding(dp(8), dp(8), dp(8), dp(8))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
            gravity = Gravity.CENTER_VERTICAL
        }
        val btnClose = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(TOOLBAR_FG)
            background = null
            setOnClickListener { finish() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
            contentDescription = "Fechar"
        }
        urlBar = EditText(this).apply {
            setText(title.ifBlank { "Carregando…" })
            setSingleLine(true)
            setTextColor(TOOLBAR_FG)
            setHintTextColor(0x99FFFFFF.toInt())
            textSize = 13f
            ellipsize = TextUtils.TruncateAt.END
            background = null
            setPadding(dp(10), dp(6), dp(10), dp(6))
            inputType = InputType.TYPE_TEXT_VARIATION_URI or InputType.TYPE_CLASS_TEXT
            imeOptions = EditorInfo.IME_ACTION_GO
            setBackgroundColor(0x33000000)
            setOnEditorActionListener { v, actionId, ev ->
                if (actionId == EditorInfo.IME_ACTION_GO ||
                    (ev != null && ev.keyCode == KeyEvent.KEYCODE_ENTER)) {
                    val raw = v.text?.toString()?.trim().orEmpty()
                    if (raw.isNotEmpty()) {
                        val target = normalizeInput(raw)
                        hideKeyboard()
                        v.clearFocus()
                        webView.loadUrl(target)
                    }
                    true
                } else false
            }
            setOnFocusChangeListener { v, hasFocus ->
                if (hasFocus) {
                    (v as EditText).setText(currentUrl)
                    v.setSelection(v.text.length)
                } else {
                    updateUrlBar(currentUrl)
                }
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(40), 1f).apply {
                marginStart = dp(4); marginEnd = dp(4)
            }
        }
        btnOverflow = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_more)
            setColorFilter(TOOLBAR_FG)
            background = null
            setOnClickListener { showOverflowMenu(this) }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
            contentDescription = "Mais opções"
        }
        toolbar.addView(btnClose)
        toolbar.addView(urlBar)
        toolbar.addView(btnOverflow)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(3),
            )
        }

        // Find bar (escondida por padrão)
        findBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(0xFFEFEFEF.toInt())
            setPadding(dp(8), dp(6), dp(8), dp(6))
            visibility = View.GONE
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }
        findInput = EditText(this).apply {
            hint = "Buscar na página"
            setSingleLine(true)
            textSize = 14f
            imeOptions = EditorInfo.IME_ACTION_SEARCH
            background = null
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            addTextChangedListener(object : android.text.TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {
                    val q = s?.toString().orEmpty()
                    if (q.isEmpty()) {
                        try { webView.clearMatches() } catch (_: Throwable) {}
                        findCount.text = ""
                    } else {
                        try { webView.findAllAsync(q) } catch (_: Throwable) {}
                    }
                }
                override fun afterTextChanged(s: android.text.Editable?) {}
            })
        }
        findCount = TextView(this).apply {
            text = ""
            setTextColor(0xFF555555.toInt())
            textSize = 12f
            setPadding(dp(8), 0, dp(8), 0)
        }
        val btnFindPrev = ImageButton(this).apply {
            setImageResource(android.R.drawable.arrow_up_float)
            background = null
            setOnClickListener { try { webView.findNext(false) } catch (_: Throwable) {} }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        val btnFindNext = ImageButton(this).apply {
            setImageResource(android.R.drawable.arrow_down_float)
            background = null
            setOnClickListener { try { webView.findNext(true) } catch (_: Throwable) {} }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        val btnFindClose = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            background = null
            setOnClickListener { hideFindBar() }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        findBar.addView(findInput)
        findBar.addView(findCount)
        findBar.addView(btnFindPrev)
        findBar.addView(btnFindNext)
        findBar.addView(btnFindClose)

        try {
            webView = WebView(this)
        } catch (e: Throwable) {
            Log.e(TAG, "Falha ao criar WebView", e)
            Toast.makeText(this, "Navegador interno indisponível neste device.", Toast.LENGTH_LONG).show()
            finish()
            return root
        }
        webView.apply {
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            isScrollbarFadingEnabled = true
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        webView.setFindListener { _, numberOfMatches, isDoneCounting ->
            if (isDoneCounting) {
                findCount.text = if (numberOfMatches > 0) "$numberOfMatches" else "0"
            }
        }

        errorOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
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
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(8))
        }
        errorMessage = TextView(this).apply {
            text = ""
            setTextColor(0xFF5B7A8F.toInt())
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(16))
        }
        val btnRetry = TextView(this).apply {
            text = "Tentar novamente"
            setTextColor(Color.WHITE)
            setBackgroundColor(TOOLBAR_BG)
            gravity = Gravity.CENTER
            setPadding(dp(20), dp(12), dp(20), dp(12))
            setOnClickListener {
                hideErrorOverlay()
                webView.loadUrl(currentUrl.ifBlank { initialUrl })
            }
        }
        errorOverlay.addView(errTitle)
        errorOverlay.addView(errorMessage)
        errorOverlay.addView(btnRetry)

        // SwipeRefresh envolve a WebView para pull-to-refresh.
        swipeRefresh = SwipeRefreshLayout(this).apply {
            setColorSchemeColors(TOOLBAR_BG)
            setOnRefreshListener {
                hideErrorOverlay()
                try { webView.reload() } catch (_: Throwable) { isRefreshing = false }
            }
            addView(webView)
        }

        val webContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            setBackgroundColor(Color.WHITE)
            addView(swipeRefresh, FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            ))
            addView(errorOverlay)
        }

        // Bottom bar: ← → ↻ 🔍 ⤓
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
            contentDescription = "Voltar"
        }
        btnForward = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_media_next)
            setColorFilter(TOOLBAR_BG)
            background = null
            alpha = 0.3f
            setOnClickListener { if (webView.canGoForward()) webView.goForward() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
            contentDescription = "Avançar"
        }
        val btnReload = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_rotate)
            setColorFilter(TOOLBAR_BG)
            background = null
            setOnClickListener { hideErrorOverlay(); webView.reload() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
            contentDescription = "Recarregar"
        }
        val btnFind = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_search)
            setColorFilter(TOOLBAR_BG)
            background = null
            setOnClickListener { showFindBar() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
            contentDescription = "Buscar na página"
        }
        val btnDownloads = ImageButton(this).apply {
            setImageResource(android.R.drawable.stat_sys_download_done)
            setColorFilter(TOOLBAR_BG)
            background = null
            setOnClickListener { openDownloadsFolder() }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
            contentDescription = "Downloads"
        }
        bottomBar.addView(btnBack)
        bottomBar.addView(btnForward)
        bottomBar.addView(btnReload)
        bottomBar.addView(btnFind)
        bottomBar.addView(btnDownloads)

        root.addView(toolbar)
        root.addView(progressBar)
        root.addView(findBar)
        root.addView(webContainer)
        root.addView(bottomBar)
        return root
    }

    // ---------------- Helpers ----------------

    private fun updateUrlBar(url: String) {
        if (urlBar.hasFocus()) return
        val host = try { Uri.parse(url).host.orEmpty() } catch (_: Throwable) { "" }
        urlBar.setText(if (host.isNotBlank()) host else url)
    }

    private fun normalizeInput(raw: String): String {
        val trimmed = raw.trim()
        if (Regex("^[a-zA-Z][a-zA-Z0-9+.-]*:").containsMatchIn(trimmed)) return trimmed
        // Tem ponto e nada de espaço → URL provável; senão, busca no Google.
        return if (trimmed.contains(".") && !trimmed.contains(" "))
            "https://$trimmed"
        else
            "https://www.google.com/search?q=" + Uri.encode(trimmed)
    }

    private fun hideKeyboard() {
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(urlBar.windowToken, 0)
        } catch (_: Throwable) {}
    }

    private fun showOverflowMenu(anchor: View) {
        val popup = PopupMenu(this, anchor)
        popup.menu.add(0, 1, 0, "Compartilhar link")
        popup.menu.add(0, 2, 1, "Copiar link")
        popup.menu.add(0, 3, 2, "Abrir no Chrome")
        popup.menu.add(0, 4, 3, if (desktopMode) "Modo móvel" else "Modo desktop")
        popup.menu.add(0, 5, 4, "Buscar na página")
        popup.menu.add(0, 6, 5, "Limpar cache desta sessão")
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                1 -> shareCurrent()
                2 -> copyToClipboard(currentUrl)
                3 -> openInChrome(currentUrl)
                4 -> toggleDesktopMode()
                5 -> showFindBar()
                6 -> clearSessionCache()
            }
            true
        }
        popup.show()
    }

    private fun shareCurrent() {
        try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, currentUrl)
            }
            startActivity(Intent.createChooser(intent, "Compartilhar"))
        } catch (e: Throwable) { Log.w(TAG, "share falhou", e) }
    }

    private fun copyToClipboard(text: String) {
        try {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("URL", text))
            Toast.makeText(this, "Link copiado", Toast.LENGTH_SHORT).show()
        } catch (_: Throwable) {}
    }

    private fun openInChrome(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                setPackage("com.android.chrome")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            } catch (e2: Throwable) {
                Toast.makeText(this, "Sem navegador disponível.", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Throwable) { Log.w(TAG, "openInChrome falhou", e) }
    }

    private fun toggleDesktopMode() {
        desktopMode = !desktopMode
        val s = webView.settings
        s.userAgentString = if (desktopMode) UA_DESKTOP else defaultUserAgent
        s.useWideViewPort = true
        s.loadWithOverviewMode = true
        webView.reload()
        Toast.makeText(this, if (desktopMode) "Modo desktop ligado" else "Modo móvel ligado",
            Toast.LENGTH_SHORT).show()
    }

    private fun clearSessionCache() {
        try {
            webView.clearCache(false)
            webView.clearHistory()
            Toast.makeText(this, "Cache desta sessão limpo", Toast.LENGTH_SHORT).show()
        } catch (_: Throwable) {}
    }

    private fun showFindBar() {
        findBar.visibility = View.VISIBLE
        findInput.requestFocus()
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.showSoftInput(findInput, InputMethodManager.SHOW_IMPLICIT)
        } catch (_: Throwable) {}
    }

    private fun hideFindBar() {
        findBar.visibility = View.GONE
        findInput.setText("")
        findCount.text = ""
        try { webView.clearMatches() } catch (_: Throwable) {}
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(findInput.windowToken, 0)
        } catch (_: Throwable) {}
    }

    private fun openDownloadsFolder() {
        try {
            val intent = Intent(DownloadManager.ACTION_VIEW_DOWNLOADS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Throwable) {
            Toast.makeText(this, "Abra o app Downloads do sistema.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showLinkContextMenu(linkUrl: String) {
        val opts = arrayOf("Abrir em nova janela", "Copiar link", "Compartilhar")
        AlertDialog.Builder(this)
            .setTitle(linkUrl)
            .setItems(opts) { _, which ->
                when (which) {
                    0 -> {
                        val intent = Intent(this, InAppWebViewActivity::class.java).apply {
                            putExtra(EXTRA_URL, linkUrl)
                            putExtra(EXTRA_USER_AGENT, webView.settings.userAgentString)
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        startActivity(intent)
                    }
                    1 -> copyToClipboard(linkUrl)
                    2 -> {
                        try {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, linkUrl)
                            }
                            startActivity(Intent.createChooser(intent, "Compartilhar"))
                        } catch (_: Throwable) {}
                    }
                }
            }
            .show()
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

    /**
     * Injeta CPF/senha no formulário de login da intranet PMESP quando o
     * cofre local do app (PIN) decifrou as credenciais antes desta Activity.
     */
    private fun tryIntranetAutofill(url: String?) {
        if (url.isNullOrBlank()) return
        if (!url.contains("login.aspx", ignoreCase = true) &&
            !url.contains("policiamilitar.sp.gov.br/login", ignoreCase = true)) return
        val cpf = InAppWebViewPlugin.autofillCpf ?: return
        val senha = InAppWebViewPlugin.autofillSenha ?: return
        if (cpf.isBlank() || senha.isBlank()) return

        val cpfJs = jsString(cpf)
        val senhaJs = jsString(senha)
        val js = """
            (function(){
              try {
                var cpf = $cpfJs, senha = $senhaJs;
                var userSel = ['#txtCpf','#txtUsuario','#txtLogin','input[name*="Cpf"]','input[name*="User"]','input[type="text"]'];
                var passSel = ['#txtSenha','input[name*="Senha"]','input[type="password"]'];
                var btnSel  = ['#btnEntrar','#btnLogin','input[type="submit"]','button[type="submit"]'];
                function find(sels){ for (var i=0;i<sels.length;i++){ var el=document.querySelector(sels[i]); if(el) return el; } return null; }
                var u=find(userSel), p=find(passSel), b=find(btnSel);
                if (u){ u.value=cpf; u.dispatchEvent(new Event('input',{bubbles:true})); }
                if (p){ p.value=senha; p.dispatchEvent(new Event('input',{bubbles:true})); }
                if (u && p && b) { setTimeout(function(){ try { b.click(); } catch(e){} }, 300); }
              } catch(e) { console.log('autofill err', e); }
            })();
        """.trimIndent()
        try { webView.evaluateJavascript(js, null) } catch (_: Throwable) {}
        InAppWebViewPlugin.autofillCpf = null
        InAppWebViewPlugin.autofillSenha = null
    }

    private fun jsString(s: String): String {
        val escaped = s
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "")
        return "'$escaped'"
    }
}
