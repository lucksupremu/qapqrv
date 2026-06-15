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
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowManager
import android.view.autofill.AutofillManager
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
import kotlin.math.abs

/**
 * Navegador interno imersivo, estilo Instagram/Twitter:
 *  - Sem URL bar, sem toolbar fixa, sem barra inferior.
 *  - Só conteúdo + botão × flutuante + botão ⋮ flutuante + barra de progresso fina.
 *  - Gestos: pull-to-refresh, edge-swipe (esquerda → volta), back do Android.
 *  - Menu ⋮: compartilhar, copiar, abrir no Chrome, modo desktop, buscar, salvar
 *    escala (PMESP), limpar cache.
 *  - Status bar translúcida com ícones brancos (edge-to-edge).
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TAG = "InAppWV"
        private const val UA_DESKTOP =
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var errorOverlay: LinearLayout
    private lateinit var errorMessage: TextView
    private lateinit var btnClose: ImageButton
    private lateinit var btnOverflow: ImageButton
    private lateinit var findBar: LinearLayout
    private lateinit var findInput: EditText
    private lateinit var findCount: TextView

    private var pageTitleFixed = ""
    private var initialUrl = ""
    private var defaultUserAgent: String = ""
    private var desktopMode = false
    private var currentUrl = ""

    // Edge-swipe (esquerda → volta).
    private var edgeStartX = 0f
    private var edgeStartY = 0f
    private var edgeTracking = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        applyEdgeToEdge()

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        val userAgent = intent.getStringExtra(EXTRA_USER_AGENT).orEmpty()
        pageTitleFixed = title
        initialUrl = url
        currentUrl = url

        Log.i(TAG, "onCreate url=$url")

        setContentView(buildLayout())
        configureWebView(userAgent)
        webView.loadUrl(url)
    }

    private fun applyEdgeToEdge() {
        // Status bar translúcida com ícones brancos. Conteúdo desenha atrás dela.
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        window.statusBarColor = 0x33000000
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }
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
                progressBar.visibility = View.VISIBLE
                hideErrorOverlay()
                if (!url.isNullOrBlank()) currentUrl = url
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
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
                if (!url.isNullOrBlank()) currentUrl = url
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    try { getSystemService(AutofillManager::class.java)?.commit() } catch (_: Throwable) {}
                }
                injectMobileViewport(url)
                tryIntranetAutofill(url)
            }


            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                return handleExternalScheme(uri)
            }

            @Suppress("DEPRECATION")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url == null) return false
                return handleExternalScheme(Uri.parse(url))
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler, error: SslError) {
                val host = try { Uri.parse(error.url).host.orEmpty() } catch (_: Throwable) { "" }
                val trusted = host.endsWith("policiamilitar.sp.gov.br", ignoreCase = true)
                if (trusted) handler.proceed() else {
                    handler.cancel()
                    showErrorOverlay(error.url ?: initialUrl, "SSL", "Certificado inválido.")
                }
            }

            override fun onReceivedError(
                view: WebView?, request: WebResourceRequest?, error: WebResourceError?,
            ) {
                if (request?.isForMainFrame == true) {
                    val url = request.url?.toString().orEmpty()
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
                else progressBar.visibility = View.VISIBLE
            }

            override fun onReceivedTitle(view: WebView?, title: String?) {
                if (!title.isNullOrBlank()) pageTitleFixed = title
            }

            override fun onCreateWindow(
                view: WebView?, isDialog: Boolean, isUserGesture: Boolean,
                resultMsg: android.os.Message?,
            ): Boolean {
                if (resultMsg == null) return false
                val tempView = WebView(this@InAppWebViewActivity)
                tempView.settings.javaScriptEnabled = true
                tempView.settings.userAgentString = webView.settings.userAgentString
                tempView.webViewClient = object : WebViewClient() {
                    private var handled = false
                    override fun shouldOverrideUrlLoading(v: WebView?, req: WebResourceRequest?): Boolean {
                        val u = req?.url?.toString() ?: return true
                        loadFromPopup(u); return true
                    }
                    @Suppress("DEPRECATION")
                    override fun shouldOverrideUrlLoading(v: WebView?, url: String?): Boolean {
                        if (url != null) loadFromPopup(url); return true
                    }
                    override fun onPageStarted(v: WebView?, url: String?, favicon: Bitmap?) {
                        if (!handled && !url.isNullOrBlank() && url != "about:blank") loadFromPopup(url)
                    }
                    private fun loadFromPopup(url: String) {
                        if (handled) return
                        handled = true
                        try { tempView.stopLoading() } catch (_: Throwable) {}
                        try { tempView.destroy() } catch (_: Throwable) {}
                        if (!handleExternalScheme(Uri.parse(url))) webView.loadUrl(url)
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

            override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
                try {
                    AlertDialog.Builder(this@InAppWebViewActivity)
                        .setMessage(message ?: "")
                        .setPositiveButton("OK") { _, _ -> result?.confirm() }
                        .setOnCancelListener { result?.cancel() }
                        .show()
                } catch (_: Throwable) { result?.confirm() }
                return true
            }

            override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
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
                req.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(req)
                Toast.makeText(this, "Baixando $fileName…", Toast.LENGTH_SHORT).show()
            } catch (e: Throwable) {
                Log.e(TAG, "Download falhou", e)
                Toast.makeText(this, "Falha no download.", Toast.LENGTH_SHORT).show()
            }
        })

        webView.setOnLongClickListener {
            val hit = webView.hitTestResult
            val extra = hit.extra ?: return@setOnLongClickListener false
            when (hit.type) {
                WebView.HitTestResult.SRC_ANCHOR_TYPE,
                WebView.HitTestResult.SRC_IMAGE_ANCHOR_TYPE -> { showLinkContextMenu(extra); true }
                else -> false
            }
        }
    }

    override fun onBackPressed() {
        if (findBar.visibility == View.VISIBLE) { hideFindBar(); return }
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else { overridePendingTransition(0, android.R.anim.fade_out); super.onBackPressed() }
    }

    /** Edge-swipe da borda esquerda → volta página. */
    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        if (ev != null) {
            val edge = dp(20).toFloat()
            when (ev.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    if (ev.x <= edge) {
                        edgeStartX = ev.x; edgeStartY = ev.y; edgeTracking = true
                    } else edgeTracking = false
                }
                MotionEvent.ACTION_MOVE -> {
                    if (edgeTracking) {
                        val dx = ev.x - edgeStartX
                        val dy = abs(ev.y - edgeStartY)
                        if (dx > dp(80) && dy < dp(60)) {
                            edgeTracking = false
                            if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
                            else finish()
                            return true
                        }
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> edgeTracking = false
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    private fun handleExternalScheme(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return false
        if (scheme == "http" || scheme == "https" || scheme == "about" || scheme == "data") return false
        return try {
            if (scheme == "intent") {
                val intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); startActivity(intent)
            } else {
                startActivity(Intent(Intent.ACTION_VIEW, uri).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) })
            }
            true
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, "Nenhum app instalado para abrir este link.", Toast.LENGTH_SHORT).show(); true
        } catch (e: Throwable) { Log.e(TAG, "Falha ao abrir $uri", e); true }
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

    private fun buildLayout(): View {
        val root = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.WHITE)
        }

        try {
            webView = WebView(this)
        } catch (e: Throwable) {
            Log.e(TAG, "Falha ao criar WebView", e)
            Toast.makeText(this, "Navegador interno indisponível neste device.", Toast.LENGTH_LONG).show()
            finish()
            return root
        }
        webView.apply {
            setBackgroundColor(Color.WHITE)
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
            isScrollbarFadingEnabled = true
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        webView.setFindListener { _, numberOfMatches, isDoneCounting ->
            if (isDoneCounting) findCount.text = if (numberOfMatches > 0) "$numberOfMatches" else "0"
        }

        swipeRefresh = SwipeRefreshLayout(this).apply {
            setColorSchemeColors(TOOLBAR_BG)
            setOnRefreshListener {
                hideErrorOverlay()
                try { webView.reload() } catch (_: Throwable) { isRefreshing = false }
            }
            addView(webView, ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            ))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }
        root.addView(swipeRefresh)

        // Error overlay (full-screen, sobre a WebView)
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
            setTextColor(TOOLBAR_BG); textSize = 18f; gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(8))
        }
        errorMessage = TextView(this).apply {
            setTextColor(0xFF5B7A8F.toInt()); textSize = 14f; gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(16))
        }
        val btnRetry = TextView(this).apply {
            text = "Tentar novamente"; setTextColor(Color.WHITE); setBackgroundColor(TOOLBAR_BG)
            gravity = Gravity.CENTER; setPadding(dp(20), dp(12), dp(20), dp(12))
            setOnClickListener { hideErrorOverlay(); webView.loadUrl(currentUrl.ifBlank { initialUrl }) }
        }
        errorOverlay.addView(errTitle); errorOverlay.addView(errorMessage); errorOverlay.addView(btnRetry)
        root.addView(errorOverlay)

        // Barra de progresso fina no topo (sobre o conteúdo).
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100; progress = 0
            progressTintList = android.content.res.ColorStateList.valueOf(TOOLBAR_BG)
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3),
            ).apply { topMargin = statusBarHeight() }
        }
        root.addView(progressBar)

        // Botões flutuantes (× e ⋮) em pílulas semi-transparentes.
        btnClose = floatingButton(android.R.drawable.ic_menu_close_clear_cancel, "Fechar") { finish() }
        btnClose.layoutParams = FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.START).apply {
            topMargin = statusBarHeight() + dp(8); marginStart = dp(8)
        }
        root.addView(btnClose)

        btnOverflow = floatingButton(android.R.drawable.ic_menu_more, "Mais opções") { showOverflowMenu(it) }
        btnOverflow.layoutParams = FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.END).apply {
            topMargin = statusBarHeight() + dp(8); marginEnd = dp(8)
        }
        root.addView(btnOverflow)

        // Find bar (oculta por padrão)
        findBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(0xFFEFEFEF.toInt())
            setPadding(dp(8), dp(6), dp(8), dp(6))
            visibility = View.GONE
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.TOP,
            ).apply { topMargin = statusBarHeight() }
        }
        findInput = EditText(this).apply {
            hint = "Buscar na página"
            setSingleLine(true); textSize = 14f
            imeOptions = EditorInfo.IME_ACTION_SEARCH; background = null
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            addTextChangedListener(object : android.text.TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
                override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {
                    val q = s?.toString().orEmpty()
                    if (q.isEmpty()) { try { webView.clearMatches() } catch (_: Throwable) {}; findCount.text = "" }
                    else try { webView.findAllAsync(q) } catch (_: Throwable) {}
                }
                override fun afterTextChanged(s: android.text.Editable?) {}
            })
        }
        findCount = TextView(this).apply {
            setTextColor(0xFF555555.toInt()); textSize = 12f; setPadding(dp(8), 0, dp(8), 0)
        }
        val btnFindPrev = ImageButton(this).apply {
            setImageResource(android.R.drawable.arrow_up_float); background = null
            setOnClickListener { try { webView.findNext(false) } catch (_: Throwable) {} }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        val btnFindNext = ImageButton(this).apply {
            setImageResource(android.R.drawable.arrow_down_float); background = null
            setOnClickListener { try { webView.findNext(true) } catch (_: Throwable) {} }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        val btnFindClose = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel); background = null
            setOnClickListener { hideFindBar() }
            layoutParams = LinearLayout.LayoutParams(dp(36), dp(36))
        }
        findBar.addView(findInput); findBar.addView(findCount)
        findBar.addView(btnFindPrev); findBar.addView(btnFindNext); findBar.addView(btnFindClose)
        root.addView(findBar)

        return root
    }

    private fun floatingButton(iconRes: Int, desc: String, onClick: (View) -> Unit): ImageButton {
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(0xCC1F1F1F.toInt())
        }
        return ImageButton(this).apply {
            setImageResource(iconRes)
            setColorFilter(Color.WHITE)
            background = bg
            contentDescription = desc
            setOnClickListener { onClick(it) }
        }
    }

    private fun statusBarHeight(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else dp(24)
    }

    // ---------------- Menu ⋮ ----------------

    private fun showOverflowMenu(anchor: View) {
        val popup = PopupMenu(this, anchor)
        popup.menu.add(0, 1, 0, "Compartilhar link")
        popup.menu.add(0, 2, 1, "Copiar link")
        popup.menu.add(0, 3, 2, "Abrir no Chrome")
        popup.menu.add(0, 4, 3, if (desktopMode) "Modo móvel" else "Modo desktop")
        popup.menu.add(0, 5, 4, "Buscar na página")
        if (isEscalaUrl(currentUrl)) popup.menu.add(0, 7, 5, "Salvar escala")
        popup.menu.add(0, 6, 6, "Limpar cache desta sessão")
        popup.setOnMenuItemClickListener { item ->
            when (item.itemId) {
                1 -> shareCurrent()
                2 -> copyToClipboard(currentUrl)
                3 -> openInChrome(currentUrl)
                4 -> toggleDesktopMode()
                5 -> showFindBar()
                6 -> clearSessionCache()
                7 -> requestSalvarEscala()
            }
            true
        }
        popup.show()
    }

    private fun isEscalaUrl(url: String): Boolean {
        return url.contains("arrelconesc.aspx", ignoreCase = true) ||
            Regex("[?&]nuesc=\\d+", RegexOption.IGNORE_CASE).containsMatchIn(url)
    }

    private fun requestSalvarEscala() {
        val m = Regex("(?:nuesc=|arrelconesc\\.aspx\\?)(\\d+)", RegexOption.IGNORE_CASE).find(currentUrl)
        val id = m?.groupValues?.getOrNull(1) ?: System.currentTimeMillis().toString()
        val ok = InAppWebViewPlugin.emitSalvarEscala(currentUrl, id, pageTitleFixed)
        Toast.makeText(
            this,
            if (ok) "Salvando escala…" else "App não está em primeiro plano. Abra o app e tente de novo.",
            Toast.LENGTH_SHORT,
        ).show()
    }

    private fun shareCurrent() {
        try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"; putExtra(Intent.EXTRA_TEXT, currentUrl)
            }
            startActivity(Intent.createChooser(intent, "Compartilhar"))
        } catch (_: Throwable) {}
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
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                setPackage("com.android.chrome"); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            })
        } catch (e: ActivityNotFoundException) {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            } catch (_: Throwable) {
                Toast.makeText(this, "Sem navegador disponível.", Toast.LENGTH_SHORT).show()
            }
        } catch (_: Throwable) {}
    }

    private fun toggleDesktopMode() {
        desktopMode = !desktopMode
        webView.settings.userAgentString = if (desktopMode) UA_DESKTOP else defaultUserAgent
        webView.settings.useWideViewPort = true; webView.settings.loadWithOverviewMode = true
        webView.reload()
        Toast.makeText(this, if (desktopMode) "Modo desktop ligado" else "Modo móvel ligado", Toast.LENGTH_SHORT).show()
    }

    private fun clearSessionCache() {
        try {
            webView.clearCache(false); webView.clearHistory()
            try { CookieManager.getInstance().removeSessionCookies(null) } catch (_: Throwable) {}
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
        findInput.setText(""); findCount.text = ""
        try { webView.clearMatches() } catch (_: Throwable) {}
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(findInput.windowToken, 0)
        } catch (_: Throwable) {}
    }

    private fun showLinkContextMenu(linkUrl: String) {
        val opts = arrayOf("Abrir em nova janela", "Copiar link", "Compartilhar")
        AlertDialog.Builder(this).setTitle(linkUrl).setItems(opts) { _, which ->
            when (which) {
                0 -> startActivity(Intent(this, InAppWebViewActivity::class.java).apply {
                    putExtra(EXTRA_URL, linkUrl)
                    putExtra(EXTRA_USER_AGENT, webView.settings.userAgentString)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
                1 -> copyToClipboard(linkUrl)
                2 -> try {
                    startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"; putExtra(Intent.EXTRA_TEXT, linkUrl)
                    }, "Compartilhar"))
                } catch (_: Throwable) {}
            }
        }.show()
    }

    private fun showErrorOverlay(url: String, code: String, description: String) {
        val ehIntranet = url.contains("policiamilitar.sp.gov.br", ignoreCase = true)
        val hintVpn = if (ehIntranet) "\n\n⚠️ Verifique se o AnyConnect (VPN) está conectado." else ""
        errorMessage.text = "$description\n\n[$code]\n$url$hintVpn"
        errorOverlay.visibility = View.VISIBLE
        progressBar.visibility = View.GONE
    }

    private fun hideErrorOverlay() { errorOverlay.visibility = View.GONE }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    // ---------------- Autofill PMESP ----------------

    private fun tryIntranetAutofill(url: String?) {
        if (url.isNullOrBlank()) return
        if (!url.contains("login.aspx", ignoreCase = true) &&
            !url.contains("policiamilitar.sp.gov.br/login", ignoreCase = true)) return
        val cpf = InAppWebViewPlugin.autofillCpf ?: return
        val senha = InAppWebViewPlugin.autofillSenha ?: return
        if (cpf.isBlank() || senha.isBlank()) return
        val cpfJs = jsString(cpf); val senhaJs = jsString(senha)
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
              } catch(e) {}
            })();
        """.trimIndent()
        try { webView.evaluateJavascript(js, null) } catch (_: Throwable) {}
        InAppWebViewPlugin.autofillCpf = null
        InAppWebViewPlugin.autofillSenha = null
    }

    private fun jsString(s: String): String {
        val escaped = s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "")
        return "'$escaped'"
    }
}
