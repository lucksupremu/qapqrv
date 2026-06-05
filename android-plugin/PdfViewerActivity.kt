package br.com.qapqrv.app.plugins

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.util.Log
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileInputStream

/**
 * Visualizador de PDF interno (sem dependência de leitor externo).
 *  - Renderiza páginas como bitmaps numa ScrollView vertical.
 *  - Pinch-to-zoom + duplo-toque por página (independente do scroll).
 *  - Toolbar com botões "Compartilhar / Abrir com" e "Salvar".
 */
class PdfViewerActivity : Activity() {

    companion object {
        const val EXTRA_PATH = "extra_path"
        const val EXTRA_TITLE = "extra_title"
        private const val TOOLBAR_BG = 0xFF2E6B8A.toInt()
        private const val TOOLBAR_FG = Color.WHITE
        private const val TAG = "PdfViewer"
        private const val REQ_CREATE_DOC = 4711
    }

    private var pfd: ParcelFileDescriptor? = null
    private var renderer: PdfRenderer? = null
    private var pdfFile: File? = null
    private var pdfTitle: String = "Escala"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestWindowFeature(Window.FEATURE_NO_TITLE)

        val rel = intent.getStringExtra(EXTRA_PATH) ?: run { finish(); return }
        pdfTitle = intent.getStringExtra(EXTRA_TITLE) ?: "Escala"
        val file = File(filesDir, rel)
        if (!file.exists()) {
            Log.e(TAG, "arquivo nao existe: ${file.absolutePath}")
            finish()
            return
        }
        pdfFile = file

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
            setBackgroundColor(Color.BLACK)
        }
        root.addView(buildToolbar(pdfTitle))

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
                // Renderiza em alta resolução (2x) para que o zoom não pixelize.
                val renderScale = 2
                val bmp = Bitmap.createBitmap(w * renderScale, h * renderScale, Bitmap.Config.ARGB_8888)
                bmp.eraseColor(Color.WHITE)
                page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                page.close()

                val zoomable = ZoomableImageView(this).apply {
                    setImageBitmap(bmp)
                    setBackgroundColor(Color.WHITE)
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        h,
                    ).apply { topMargin = if (i == 0) 0 else dp(8) }
                }
                pagesContainer.addView(zoomable)
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
            contentDescription = "Fechar"
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
        val saveBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.stat_sys_download)
            setColorFilter(TOOLBAR_FG)
            background = null
            contentDescription = "Salvar PDF"
            setOnClickListener { salvarPdf() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        val shareBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_share)
            setColorFilter(TOOLBAR_FG)
            background = null
            contentDescription = "Compartilhar / abrir com outro app"
            setOnClickListener { compartilharPdf() }
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40))
        }
        bar.addView(close)
        bar.addView(tv)
        bar.addView(saveBtn)
        bar.addView(shareBtn)
        return bar
    }

    private fun compartilharPdf() {
        val f = pdfFile ?: return
        try {
            val authority = "${packageName}.fileprovider"
            val uri: Uri = FileProvider.getUriForFile(this, authority, f)
            val share = Intent(Intent.ACTION_SEND).apply {
                type = "application/pdf"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, pdfTitle)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val view = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val sendTargets = packageManager.queryIntentActivities(share, 0)
            val viewTargets = packageManager.queryIntentActivities(view, 0)

            // Se nenhum app aceita SEND mas há leitor de PDF, abre direto.
            val base: Intent = if (sendTargets.isEmpty() && viewTargets.isNotEmpty()) view else share

            val chooser = Intent.createChooser(base, "Compartilhar / abrir com").apply {
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                if (base === share && viewTargets.isNotEmpty()) {
                    val initial: Array<android.os.Parcelable> = arrayOf(view)
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, initial)
                }
            }
            startActivity(chooser)
        } catch (e: Throwable) {
            Log.e(TAG, "compartilhar falhou", e)
            Toast.makeText(this, "Falha ao compartilhar: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun salvarPdf() {
        if (pdfFile == null) return
        val fileName = "${sanitize(pdfTitle)}.pdf"
        try {
            // SAF em todas as versões: o usuário escolhe onde salvar e o arquivo
            // fica visível fora do APK (Downloads, Drive, cartão SD, etc.).
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/pdf"
                putExtra(Intent.EXTRA_TITLE, fileName)
            }
            startActivityForResult(intent, REQ_CREATE_DOC)
        } catch (e: Throwable) {
            Log.e(TAG, "salvar falhou", e)
            Toast.makeText(this, "Falha ao salvar: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    @Deprecated("Compat: API usada para receber o resultado do SAF")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_CREATE_DOC && resultCode == RESULT_OK) {
            val uri = data?.data ?: return
            val f = pdfFile ?: return
            try {
                contentResolver.openOutputStream(uri)?.use { out ->
                    FileInputStream(f).use { input -> input.copyTo(out) }
                } ?: throw IllegalStateException("OutputStream nulo")
                Toast.makeText(this, "PDF salvo no dispositivo", Toast.LENGTH_SHORT).show()
                promptAbrirComLeitor(uri)
            } catch (e: Throwable) {
                Log.e(TAG, "gravar PDF falhou", e)
                Toast.makeText(this, "Falha ao salvar: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun promptAbrirComLeitor(uri: Uri) {
        try {
            val view = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val targets = packageManager.queryIntentActivities(view, 0)
            if (targets.isEmpty()) return
            val chooser = Intent.createChooser(view, "Abrir PDF com").apply {
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(chooser)
        } catch (e: Throwable) {
            Log.w(TAG, "abrir com leitor falhou", e)
        }
    }

    private fun sanitize(s: String): String =
        s.replace(Regex("[^A-Za-z0-9_-]"), "_").take(60).ifBlank { "escala" }

    private fun dp(v: Int): Int =
        (v * resources.displayMetrics.density).toInt()
}

/**
 * ImageView com pinch-to-zoom, duplo-toque e pan quando ampliada.
 * Cada página do PDF é independente. Quando o zoom está em 1x, os toques
 * passam para o ScrollView pai (scroll vertical funciona normalmente).
 */
private class ZoomableImageView(context: android.content.Context) : ImageView(context) {

    private val matrixZ = Matrix()
    private var scale = 1f
    private val minScale = 1f
    private val maxScale = 5f
    private var transX = 0f
    private var transY = 0f
    private var lastTouchX = 0f
    private var lastTouchY = 0f
    private var activePointerId = -1

    private val scaleDetector = ScaleGestureDetector(context, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
        override fun onScale(detector: ScaleGestureDetector): Boolean {
            val newScale = (scale * detector.scaleFactor).coerceIn(minScale, maxScale)
            val factor = newScale / scale
            scale = newScale
            // Mantém o foco da pinça estável.
            transX = detector.focusX - (detector.focusX - transX) * factor
            transY = detector.focusY - (detector.focusY - transY) * factor
            clampTranslation()
            applyMatrix()
            return true
        }
    })

    private val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
        override fun onDoubleTap(e: MotionEvent): Boolean {
            if (scale > 1f) {
                resetZoom()
            } else {
                scale = 2.5f
                transX = e.x - (e.x * scale)
                transY = e.y - (e.y * scale)
                clampTranslation()
                applyMatrix()
            }
            return true
        }
    })

    init {
        scaleType = ScaleType.MATRIX
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        applyMatrix()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        scaleDetector.onTouchEvent(event)
        gestureDetector.onTouchEvent(event)

        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                lastTouchX = event.x
                lastTouchY = event.y
                activePointerId = event.getPointerId(0)
                // Bloqueia scroll do pai apenas se estiver ampliado.
                parent?.requestDisallowInterceptTouchEvent(scale > 1f)
            }
            MotionEvent.ACTION_MOVE -> {
                if (scale > 1f && !scaleDetector.isInProgress) {
                    val idx = event.findPointerIndex(activePointerId)
                    if (idx != -1) {
                        val dx = event.getX(idx) - lastTouchX
                        val dy = event.getY(idx) - lastTouchY
                        transX += dx
                        transY += dy
                        clampTranslation()
                        applyMatrix()
                        lastTouchX = event.getX(idx)
                        lastTouchY = event.getY(idx)
                    }
                    parent?.requestDisallowInterceptTouchEvent(true)
                }
            }
            MotionEvent.ACTION_POINTER_UP -> {
                val idx = event.actionIndex
                if (event.getPointerId(idx) == activePointerId) {
                    val newIdx = if (idx == 0) 1 else 0
                    lastTouchX = event.getX(newIdx)
                    lastTouchY = event.getY(newIdx)
                    activePointerId = event.getPointerId(newIdx)
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                activePointerId = -1
                if (scale <= 1f) parent?.requestDisallowInterceptTouchEvent(false)
            }
        }
        return true
    }

    private fun resetZoom() {
        scale = 1f
        transX = 0f
        transY = 0f
        applyMatrix()
        parent?.requestDisallowInterceptTouchEvent(false)
    }

    private fun clampTranslation() {
        val viewW = width.toFloat()
        val viewH = height.toFloat()
        if (viewW <= 0 || viewH <= 0) return
        val scaledW = viewW * scale
        val scaledH = viewH * scale
        val minTx = viewW - scaledW
        val minTy = viewH - scaledH
        transX = if (scaledW <= viewW) (viewW - scaledW) / 2f else transX.coerceIn(minTx, 0f)
        transY = if (scaledH <= viewH) (viewH - scaledH) / 2f else transY.coerceIn(minTy, 0f)
    }

    private fun applyMatrix() {
        val drawable = drawable ?: return
        val viewW = width.toFloat()
        val viewH = height.toFloat()
        if (viewW <= 0 || viewH <= 0) return
        val dW = drawable.intrinsicWidth.toFloat()
        val dH = drawable.intrinsicHeight.toFloat()
        // Fit-center base (mantém a página inteira visível em scale=1).
        val baseScale = minOf(viewW / dW, viewH / dH)
        val baseTx = (viewW - dW * baseScale) / 2f
        val baseTy = (viewH - dH * baseScale) / 2f
        matrixZ.reset()
        matrixZ.postScale(baseScale, baseScale)
        matrixZ.postTranslate(baseTx, baseTy)
        matrixZ.postScale(scale, scale)
        matrixZ.postTranslate(transX, transY)
        imageMatrix = matrixZ
    }
}
