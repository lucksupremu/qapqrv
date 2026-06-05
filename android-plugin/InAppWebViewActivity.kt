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
                "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

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
                return false
            }

            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: android.net.http.SslError?,
            ) {
                // Intranet PMESP tem cert auto-assinado em algumas pontas.
                // Em vez de bloquear, prossegue (usuário já está na VPN).
                handler?.proceed()
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                btnBack.alpha = if (webView.canGoBack()) 1f else 0.3f
                btnForward.alpha = if (webView.canGoForward()) 1f else 0.3f
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
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
            try {
                val fileName = URLUtil.guessFileName(dlUrl, contentDisposition, mimeType)
                val req = DownloadManager.Request(Uri.parse(dlUrl))
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
                    .setMimeType(mimeType)
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(true)
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(req)
                Toast.makeText(this, "Baixando $fileName…", Toast.LENGTH_SHORT).show()
            } catch (e: Throwable) {
                Toast.makeText(this, "Falha ao baixar: ${e.message}", Toast.LENGTH_LONG).show()
            }
        })

        webView.loadUrl(url)
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
        val btnExternal = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_share)
            setColorFilter(TOOLBAR_BG)
            background = null
            setOnClickListener {
                try {
                    val u = webView.url ?: return@setOnClickListener
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(u)))
                } catch (_: Throwable) {}
            }
            layoutParams = LinearLayout.LayoutParams(0, dp(44), 1f)
        }
        bottomBar.addView(btnBack)
        bottomBar.addView(btnForward)
        bottomBar.addView(btnExternal)

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
}
