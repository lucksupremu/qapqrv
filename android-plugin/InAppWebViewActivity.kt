package br.com.qapqrv.app.plugins

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
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
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoRuntime
import org.mozilla.geckoview.GeckoRuntimeSettings
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSessionSettings
import org.mozilla.geckoview.GeckoView
import org.mozilla.geckoview.WebResponse
import java.io.InputStream
import kotlin.concurrent.thread

/**
 * Navegador interno baseado em Mozilla GeckoView (mesmo motor do Firefox).
 * Não depende do Android System WebView / Chrome — resolve a tela branca
 * em aparelhos onde o WebView do sistema está desatualizado ou bloqueado.
 *
 * Layout em código pra evitar XML em res/.
 */
class InAppWebViewActivity : Activity() {

    companion object {
        const val EXTRA_URL = "extra_url"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_USER_AGENT = "extra_user_agent"

        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "InAppGecko"

        @Volatile
        private var sRuntime: GeckoRuntime? = null

        @Synchronized
        fun runtime(ctx: Context): GeckoRuntime {
            val cached = sRuntime
            if (cached != null) return cached
            val settings = GeckoRuntimeSettings.Builder()
                .javaScriptEnabled(true)
                .aboutConfigEnabled(false)
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

    private var canGoBack = false
    private var canGoForward = false
    private var pageTitleFixed = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val url = intent.getStringExtra(EXTRA_URL) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE).orEmpty()
        pageTitleFixed = title

        setContentView(buildLayout(title))

        val rt = runtime(this)
        session = GeckoSession(
            GeckoSessionSettings.Builder()
                .usePrivateMode(false)
                .build(),
        )
        session.open(rt)
        geckoView.setSession(session)

        session.navigationDelegate = object : GeckoSession.NavigationDelegate {
            override fun onCanGoBack(s: GeckoSession, value: Boolean) {
                canGoBack = value
                btnBack.alpha = if (value) 1f else 0.3f
            }

            override fun onCanGoForward(s: GeckoSession, value: Boolean) {
                canGoForward = value
                btnForward.alpha = if (value) 1f else 0.3f
            }

            override fun onNewSession(s: GeckoSession, uri: String): GeckoResult<GeckoSession> {
                // Popups (Marcar/Desmarcar, iNotes) — abre na mesma view.
                val newSession = GeckoSession()
                newSession.open(rt)
                attachDelegates(newSession, rt)
                geckoView.releaseSession()
                geckoView.setSession(newSession)
                session = newSession
                return GeckoResult.fromValue(newSession)
            }

            override fun onLoadError(
                s: GeckoSession,
                uri: String?,
                error: org.mozilla.geckoview.WebRequestError,
            ): GeckoResult<String>? {
                Log.e(TAG, "onLoadError uri=$uri code=${error.code} cat=${error.category}")
                val safeUrl = uri.orEmpty()
                val html = buildErrorHtml(safeUrl, "ERR_${error.code}", error.message ?: "Erro de carregamento")
                return GeckoResult.fromValue("data:text/html;base64,${android.util.Base64.encodeToString(html.toByteArray(Charsets.UTF_8), android.util.Base64.NO_WRAP)}")
            }
        }

        session.progressDelegate = object : GeckoSession.ProgressDelegate {
            override fun onProgressChange(s: GeckoSession, progress: Int) {
                progressBar.progress = progress
                progressBar.visibility = if (progress >= 100) View.GONE else View.VISIBLE
            }
        }

        session.contentDelegate = object : GeckoSession.ContentDelegate {
            override fun onTitleChange(s: GeckoSession, t: String?) {
                if (pageTitleFixed.isBlank() && !t.isNullOrBlank()) titleView.text = t
            }

            override fun onExternalResponse(s: GeckoSession, response: WebResponse) {
                // Arquivos não-renderizáveis (PDF não-inline, anexos) → baixa.
                downloadResponseToDownloads(response)
            }
        }

        session.loadUri(url)
    }

    private fun attachDelegates(s: GeckoSession, rt: GeckoRuntime) {
        s.navigationDelegate = session.navigationDelegate
        s.progressDelegate = session.progressDelegate
        s.contentDelegate = session.contentDelegate
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
            setOnClickListener { session.reload() }
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
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
        }
        val webContainer = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f,
            )
            addView(geckoView)
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

    override fun onBackPressed() {
        if (::session.isInitialized && canGoBack) {
            session.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
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
                    // Registra no DownloadManager para aparecer nas notificações
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

    private fun buildErrorHtml(failingUrl: String, codeName: String, description: String): String {
        val ehIntranet = failingUrl.contains("policiamilitar.sp.gov.br", ignoreCase = true) ||
            failingUrl.contains("intranet", ignoreCase = true)
        val dicaVpn = if (ehIntranet) {
            "<div class='warn'>⚠️ Este é um endereço da intranet PMESP. " +
                "Verifique se o <b>AnyConnect</b> está conectado antes de tentar novamente.</div>"
        } else ""
        val safeUrl = failingUrl.replace("&", "&amp;").replace("<", "&lt;")
        val safeDesc = description.replace("&", "&amp;").replace("<", "&lt;")
        return """
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
              button{width:100%;height:44px;border-radius:12px;border:0;background:#2e6b8a;color:#fff;font-size:14px;font-weight:600;margin-top:18px}
            </style></head>
            <body>
              <div class="card">
                <h1>Não foi possível abrir a página</h1>
                <p>$safeDesc</p>
                <div class="code">$codeName</div>
                $dicaVpn
                <div class="url">$safeUrl</div>
                <button onclick="location.href='$safeUrl'">Tentar de novo</button>
              </div>
            </body></html>
        """.trimIndent()
    }
}
