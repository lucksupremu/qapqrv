package br.com.qapqrv.app.plugins

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Bridge JS → SharedPreferences usadas pelo widget ProximaEscalaWidget.
 * Após gravar, dispara o update do widget para refletir os novos dados.
 */
@CapacitorPlugin(name = "WidgetData")
class WidgetDataPlugin : Plugin() {

    companion object {
        const val PREFS = "qapqrv_widget"
        const val KEY_TIPO = "prox_tipo"
        const val KEY_DATA = "prox_data"
        const val KEY_VALOR = "prox_valor"
    }

    @PluginMethod
    fun setProximaEscala(call: PluginCall) {
        val tipo = call.getString("tipo") ?: ""
        val data = call.getString("data") ?: ""
        val valor = call.getDouble("valor") ?: 0.0
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(KEY_TIPO, tipo)
                .putString(KEY_DATA, data)
                .putFloat(KEY_VALOR, valor.toFloat())
                .apply()
            refreshWidget()
            call.resolve(JSObject().put("ok", true))
        } catch (e: Throwable) {
            call.reject(e.message ?: "Falha ao salvar widget data")
        }
    }

    @PluginMethod
    fun clear(call: PluginCall) {
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            prefs.edit().clear().apply()
            refreshWidget()
            call.resolve(JSObject().put("ok", true))
        } catch (e: Throwable) {
            call.reject(e.message ?: "Falha")
        }
    }

    private fun refreshWidget() {
        try {
            val mgr = AppWidgetManager.getInstance(context)
            val cn = ComponentName(context, ProximaEscalaWidget::class.java)
            val ids = mgr.getAppWidgetIds(cn)
            if (ids.isNotEmpty()) {
                ProximaEscalaWidget.updateAll(context, mgr, ids)
            }
        } catch (_: Throwable) {}
    }
}
