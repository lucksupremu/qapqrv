package br.com.qapqrv.app.plugins

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.ads.AdListener
import com.google.android.gms.ads.AdLoader
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.VideoOptions
import com.google.android.gms.ads.nativead.MediaView
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdOptions
import com.google.android.gms.ads.nativead.NativeAdView

/**
 * Plugin Capacitor para AdMob **Native Ads**.
 *
 * Cada "slot" da UI web (um <div data-native-ad-slot="…"> com posição conhecida)
 * é coberto por uma `NativeAdView` real desenhada por cima do WebView.
 *
 * API JS (registerPlugin<NativeAdPlugin>("NativeAd")):
 *   - initialize()                       → garante SDK pronto
 *   - render({ slotId, x, y, w, h })     → carrega + posiciona o ad (dp)
 *   - update({ slotId, x, y, w, h })     → reposiciona quando o layout/scroll muda
 *   - remove({ slotId })                 → tira da tela e libera o NativeAd
 *
 * Unidade de teste do Google é usada em debug (AD_UNIT_ID_TEST). Substituir por
 * `AD_UNIT_ID_PROD` quando publicar.
 */
@CapacitorPlugin(name = "NativeAd")
class NativeAdPlugin : Plugin() {

    companion object {
        private const val TAG = "NativeAdPlugin"
        // Test ID oficial do Google p/ native ads — trocar pelo prod ao publicar.
        private const val AD_UNIT_ID_TEST = "ca-app-pub-3940256099942544/2247696110"
        private const val AD_UNIT_ID_PROD = "ca-app-pub-9197484743954603/8424254265"
        private val AD_UNIT_ID = AD_UNIT_ID_TEST
    }

    private data class Slot(
        val container: FrameLayout,
        var ad: NativeAd? = null,
    )

    private val slots = mutableMapOf<String, Slot>()
    private var initialized = false

    @PluginMethod
    fun initialize(call: PluginCall) {
        val act = activity ?: return call.reject("Activity indisponível")
        if (initialized) {
            call.resolve(JSObject().put("initialized", true)); return
        }
        try {
            MobileAds.initialize(act.applicationContext) {
                initialized = true
                call.resolve(JSObject().put("initialized", true))
            }
        } catch (e: Throwable) {
            Log.w(TAG, "init falhou", e)
            call.reject(e.message ?: "init")
        }
    }

    @PluginMethod
    fun render(call: PluginCall) {
        val act = activity ?: return call.reject("Activity indisponível")
        val slotId = call.getString("slotId") ?: return call.reject("slotId obrigatório")
        val x = call.getFloat("x") ?: 0f
        val y = call.getFloat("y") ?: 0f
        val w = call.getFloat("w") ?: 0f
        val h = call.getFloat("h") ?: 0f

        act.runOnUiThread {
            try {
                val existing = slots[slotId]
                if (existing != null) {
                    positionContainer(existing.container, x, y, w, h)
                    call.resolve(JSObject().put("ok", true).put("reused", true))
                    return@runOnUiThread
                }
                val root = act.findViewById<ViewGroup>(android.R.id.content)
                    ?: return@runOnUiThread call.reject("root indisponível")
                val container = FrameLayout(act).apply { setBackgroundColor(Color.TRANSPARENT) }
                root.addView(container)
                positionContainer(container, x, y, w, h)
                slots[slotId] = Slot(container)
                loadInto(slotId, call)
            } catch (e: Throwable) {
                Log.w(TAG, "render falhou", e)
                call.reject(e.message ?: "render")
            }
        }
    }

    @PluginMethod
    fun update(call: PluginCall) {
        val act = activity ?: return call.reject("Activity indisponível")
        val slotId = call.getString("slotId") ?: return call.reject("slotId obrigatório")
        val x = call.getFloat("x") ?: 0f
        val y = call.getFloat("y") ?: 0f
        val w = call.getFloat("w") ?: 0f
        val h = call.getFloat("h") ?: 0f
        act.runOnUiThread {
            val slot = slots[slotId]
            if (slot == null) { call.resolve(JSObject().put("ok", false)); return@runOnUiThread }
            positionContainer(slot.container, x, y, w, h)
            call.resolve(JSObject().put("ok", true))
        }
    }

    @PluginMethod
    fun remove(call: PluginCall) {
        val act = activity ?: return call.reject("Activity indisponível")
        val slotId = call.getString("slotId") ?: return call.reject("slotId obrigatório")
        act.runOnUiThread {
            val slot = slots.remove(slotId)
            slot?.ad?.destroy()
            slot?.container?.let { (it.parent as? ViewGroup)?.removeView(it) }
            call.resolve(JSObject().put("removed", slot != null))
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        slots.values.forEach { s ->
            s.ad?.destroy()
            (s.container.parent as? ViewGroup)?.removeView(s.container)
        }
        slots.clear()
    }

    // ---------- helpers ----------

    private fun positionContainer(container: FrameLayout, xDp: Float, yDp: Float, wDp: Float, hDp: Float) {
        val d = container.resources.displayMetrics.density
        val lp = FrameLayout.LayoutParams((wDp * d).toInt(), (hDp * d).toInt())
        lp.leftMargin = (xDp * d).toInt()
        lp.topMargin = (yDp * d).toInt()
        container.layoutParams = lp
    }

    private fun loadInto(slotId: String, call: PluginCall) {
        val act: Activity = activity ?: return
        val loader = AdLoader.Builder(act, AD_UNIT_ID)
            .forNativeAd { nativeAd ->
                val slot = slots[slotId]
                if (slot == null) { nativeAd.destroy(); return@forNativeAd }
                slot.ad?.destroy()
                slot.ad = nativeAd
                val view = buildNativeAdView(act, nativeAd)
                slot.container.removeAllViews()
                slot.container.addView(
                    view,
                    FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    ),
                )
            }
            .withAdListener(object : AdListener() {
                override fun onAdFailedToLoad(error: LoadAdError) {
                    Log.w(TAG, "native ad falhou: ${error.message}")
                    if (!call.isReleased) call.resolve(JSObject().put("ok", false).put("reason", error.message))
                }
                override fun onAdLoaded() {
                    if (!call.isReleased) call.resolve(JSObject().put("ok", true))
                }
            })
            .withNativeAdOptions(
                NativeAdOptions.Builder()
                    .setVideoOptions(VideoOptions.Builder().setStartMuted(true).build())
                    .build(),
            )
            .build()
        loader.loadAd(AdRequest.Builder().build())
    }

    /** Monta uma `NativeAdView` programaticamente (sem depender de XML extra). */
    private fun buildNativeAdView(act: Activity, ad: NativeAd): NativeAdView {
        val d = act.resources.displayMetrics.density
        fun dp(v: Int) = (v * d).toInt()

        val adView = NativeAdView(act)
        val bg = GradientDrawable().apply {
            cornerRadius = dp(12).toFloat()
            setColor(Color.parseColor("#0F2535"))
            setStroke(dp(1), Color.parseColor("#1F3A4D"))
        }
        adView.background = bg
        adView.setPadding(dp(12), dp(10), dp(12), dp(10))

        val row = LinearLayout(act).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        val icon = ImageView(act).apply {
            layoutParams = LinearLayout.LayoutParams(dp(40), dp(40)).also { it.rightMargin = dp(10) }
        }

        val texts = LinearLayout(act).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        val headline = TextView(act).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        val body = TextView(act).apply {
            setTextColor(Color.parseColor("#A8C2D6"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            maxLines = 2
        }
        val adBadge = TextView(act).apply {
            text = "Ad"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            setPadding(dp(6), dp(1), dp(6), dp(1))
            background = GradientDrawable().apply {
                cornerRadius = dp(4).toFloat()
                setColor(Color.parseColor("#F5A524"))
            }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            ).also { it.bottomMargin = dp(2) }
        }
        texts.addView(adBadge)
        texts.addView(headline)
        texts.addView(body)

        val cta = Button(act).apply {
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setTextColor(Color.WHITE)
            background = GradientDrawable().apply {
                cornerRadius = dp(8).toFloat()
                setColor(Color.parseColor("#3DA4E0"))
            }
            setPadding(dp(12), dp(6), dp(12), dp(6))
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            ).also { it.leftMargin = dp(10); it.gravity = Gravity.CENTER_VERTICAL }
        }

        row.addView(icon); row.addView(texts); row.addView(cta)

        // Optional media (vídeo/imagem) abaixo
        val media = MediaView(act).apply {
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(120),
            ).also { it.topMargin = dp(8) }
            visibility = if (ad.mediaContent != null) View.VISIBLE else View.GONE
        }

        val wrap = LinearLayout(act).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }
        wrap.addView(row); wrap.addView(media)
        adView.addView(wrap)

        // Wire data
        headline.text = ad.headline ?: ""
        body.text = ad.body ?: (ad.advertiser ?: "")
        ad.icon?.drawable?.let { icon.setImageDrawable(it) } ?: run { icon.visibility = View.GONE }
        cta.text = ad.callToAction ?: "Saiba mais"

        adView.headlineView = headline
        adView.bodyView = body
        adView.callToActionView = cta
        adView.iconView = icon
        adView.mediaView = media
        adView.setNativeAd(ad)
        return adView
    }
}
