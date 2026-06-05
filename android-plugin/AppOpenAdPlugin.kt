package br.com.qapqrv.app.plugins

import android.app.Activity
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.appopen.AppOpenAd

/**
 * Plugin Capacitor próprio para AdMob App Open Ad.
 *
 * Por que não usar @capacitor-community/admob:
 *   - A v8 não expõe App Open Ads. Só Banner/Interstitial/Rewarded.
 *
 * Regras seguidas (recomendações do Google):
 *   - Mostra apenas quando o app abre (cold start) ou volta de background.
 *   - Cooldown de 4h por anúncio carregado (timestamp expira).
 *   - Não mostra durante navegação interna — é o JS que decide quando chamar `show`.
 *   - Pré-carrega o próximo logo após o ad ser fechado.
 *
 * Uso (TS):
 *   import { registerPlugin } from '@capacitor/core';
 *   const AppOpenAdPlugin = registerPlugin<AppOpenAdPlugin>('AppOpenAd');
 *   await AppOpenAdPlugin.initialize();
 *   await AppOpenAdPlugin.show();
 */
@CapacitorPlugin(name = "AppOpenAd")
class AppOpenAdPlugin : Plugin() {

    companion object {
        private const val TAG = "AppOpenAdPlugin"
        private const val AD_UNIT_ID = "ca-app-pub-9197484743954603/8424254265"
        private const val EXPIRATION_MS = 4L * 60L * 60L * 1000L // 4 horas
    }

    private var appOpenAd: AppOpenAd? = null
    private var loadedAt: Long = 0L
    private var isLoading = false
    private var isShowing = false
    private var initialized = false

    @PluginMethod
    fun initialize(call: PluginCall) {
        val activity: Activity = activity ?: run {
            call.reject("Activity indisponível")
            return
        }
        if (initialized) {
            call.resolve(JSObject().put("initialized", true))
            return
        }
        try {
            MobileAds.initialize(activity.applicationContext) {
                initialized = true
                loadAd()
                val ret = JSObject()
                ret.put("initialized", true)
                call.resolve(ret)
            }
        } catch (e: Throwable) {
            Log.w(TAG, "MobileAds.initialize falhou", e)
            call.reject(e.message ?: "Falha ao inicializar MobileAds")
        }
    }

    @PluginMethod
    fun show(call: PluginCall) {
        val activity: Activity = activity ?: run {
            call.reject("Activity indisponível")
            return
        }
        if (isShowing) {
            call.resolve(JSObject().put("shown", false).put("reason", "already_showing"))
            return
        }
        if (!isAdAvailable()) {
            // Não há ad disponível agora — pede um novo e responde sem bloquear.
            loadAd()
            call.resolve(JSObject().put("shown", false).put("reason", "not_ready"))
            return
        }
        val ad = appOpenAd ?: run {
            call.resolve(JSObject().put("shown", false).put("reason", "not_ready"))
            return
        }
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                appOpenAd = null
                isShowing = false
                loadAd() // pré-carrega o próximo
                val ret = JSObject()
                ret.put("shown", true)
                ret.put("dismissed", true)
                call.resolve(ret)
            }

            override fun onAdFailedToShowFullScreenContent(error: AdError) {
                Log.w(TAG, "onAdFailedToShowFullScreenContent: ${error.message}")
                appOpenAd = null
                isShowing = false
                loadAd()
                call.resolve(JSObject().put("shown", false).put("reason", "show_failed"))
            }

            override fun onAdShowedFullScreenContent() {
                isShowing = true
            }
        }
        activity.runOnUiThread {
            try {
                ad.show(activity)
            } catch (e: Throwable) {
                Log.w(TAG, "ad.show falhou", e)
                isShowing = false
                call.resolve(JSObject().put("shown", false).put("reason", "show_threw"))
            }
        }
    }

    private fun isAdAvailable(): Boolean {
        if (appOpenAd == null) return false
        return System.currentTimeMillis() - loadedAt < EXPIRATION_MS
    }

    private fun loadAd() {
        val activity: Activity = activity ?: return
        if (isLoading || isAdAvailable()) return
        isLoading = true
        val request = AdRequest.Builder().build()
        AppOpenAd.load(
            activity.applicationContext,
            AD_UNIT_ID,
            request,
            object : AppOpenAd.AppOpenAdLoadCallback() {
                override fun onAdLoaded(ad: AppOpenAd) {
                    appOpenAd = ad
                    loadedAt = System.currentTimeMillis()
                    isLoading = false
                    Log.d(TAG, "App Open Ad carregado.")
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    isLoading = false
                    Log.w(TAG, "App Open Ad falhou: ${error.message} (code=${error.code})")
                }
            },
        )
    }
}
