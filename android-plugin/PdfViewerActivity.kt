package br.com.qapqrv.app.plugins

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.io.File

/**
 * Visualizador de PDF interno (sem dependência de leitor externo).
 * Usa o PdfRenderer nativo do Android para renderizar página por página
 * em bitmaps verticalmente dentro de um ScrollView.
 */
class PdfViewerActivity : Activity() {

    companion object {
        const val EXTRA_PATH = "extra_path"   // caminho relativo dentro de filesDir
        const val EXTRA_TITLE = "extra_title"
        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "PdfViewer"
    }

    private var pfd: ParcelFileDescriptor? = null
    private var renderer: PdfRenderer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val rel = intent.getStringExtra(EXTRA_PATH) ?: run { finish(); return }
        val title = intent.getStringExtra(EXTRA_TITLE) ?: "Escala"
        val file = File(filesDir, rel)
        if (!file.exists()) {
            Log.e(TAG, "arquivo nao existe: ${file.absolutePath}")
            finish()
            return
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.BLACK)
        }
        root.addView(buildToolbar(title))

        val scroll = ScrollView(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                0,
                1f,
            )
            setBackgroundColor(Color.parseColor("#222222"))
        }
        val pagesContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
            setPadding(dp(8), dp(8), dp(8), dp(8))
        }
        scroll.addView(pagesContainer)
        root.addView(scroll)
        setContentView(root)

        try {
            pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
            val r = PdfRenderer(pfd!!)
            renderer = r
            val screenW = resources.displayMetrics.widthPixels - dp(16)
            for (i in 0 until r.pageCount) {
                val page = r.openPage(i)
                val ratio = page.height.toFloat() / page.width.toFloat()
                val w = screenW.coerceAtLeast(320)
                val h = (w * ratio).toInt()
                val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                bmp.eraseColor(Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()
                val iv = ImageView(this).apply {
                    setImageBitmap(bmp)
                    adjustViewBounds = true
                    setBackgroundColor(Color.WHITE)
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT,
                    ).apply { topMargin = if (i == 0) 0 else dp(8) }
                }
                pagesContainer.addView(iv)
            }
        } catch (e: Throwable) {
            Log.e(TAG, "render falhou", e)
            val msg = TextView(this).apply {
                text = "Falha ao abrir PDF: ${e.message}"
                setTextColor(Color.WHITE)
                setPadding(dp(16), dp(16), dp(16), dp(16))
            }
            pagesContainer.addView(msg)
        }
    }

    override fun onDestroy() {
        try { renderer?.close() } catch (_: Throwable) {}
        try { pfd?.close() } catch (_: Throwable) {}
        super.onDestroy()
    }

    private fun buildToolbar(title: String): View {
        val bar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(TOOLBAR_BG)
            setPadding(dp(8), dp(10), dp(8), dp(10))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
            gravity = Gravity.CENTER_VERTICAL
        }
        val close = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setColorFilter(TOOLBAR_FG)
            background = null
            setOnClickListener { finish() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        val tv = TextView(this).apply {
            text = title
            setTextColor(TOOLBAR_FG)
            textSize = 16f
            maxLines = 1
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(8), 0, dp(8), 0)
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        bar.addView(close)
        bar.addView(tv)
        return bar
    }

    private fun dp(v: Int): Int =
        (v * resources.displayMetrics.density).toInt()
}
