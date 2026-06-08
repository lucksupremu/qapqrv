package br.com.qapqrv.app.plugins

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import br.com.qapqrv.app.R
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Widget home-screen com a próxima escala marcada pelo usuário.
 * Lê dados de SharedPreferences gravados via WidgetDataPlugin.
 *
 * Pré-requisito:
 *  - layout XML em android/app/src/main/res/layout/widget_proxima_escala.xml
 *  - metadata em android/app/src/main/res/xml/widget_proxima_escala_info.xml
 *  - receiver registrado no AndroidManifest.xml
 *
 *  Veja android-plugin/README.md para o passo a passo.
 */
class ProximaEscalaWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        updateAll(context, appWidgetManager, appWidgetIds)
    }

    companion object {
        fun updateAll(context: Context, mgr: AppWidgetManager, ids: IntArray) {
            val prefs = context.getSharedPreferences(WidgetDataPlugin.PREFS, Context.MODE_PRIVATE)
            val tipo = prefs.getString(WidgetDataPlugin.KEY_TIPO, "") ?: ""
            val dataIso = prefs.getString(WidgetDataPlugin.KEY_DATA, "") ?: ""
            val valor = prefs.getFloat(WidgetDataPlugin.KEY_VALOR, 0f)

            val titulo: String
            val subtitulo: String
            if (tipo.isBlank() || dataIso.isBlank()) {
                titulo = "Sem próxima escala"
                subtitulo = "Toque para abrir o calendário"
            } else {
                val dataFmt = try {
                    val d = parseIso(dataIso)
                    val fmt = SimpleDateFormat("dd/MM 'às' HH'h'mm", Locale("pt", "BR"))
                    fmt.format(d)
                } catch (_: Throwable) { dataIso }
                titulo = "Próximo $tipo"
                subtitulo = if (valor > 0)
                    "$dataFmt · R$ ${"%.2f".format(valor)}"
                else dataFmt
            }

            for (id in ids) {
                val views = RemoteViews(context.packageName, R.layout.widget_proxima_escala)
                views.setTextViewText(R.id.widget_titulo, titulo)
                views.setTextViewText(R.id.widget_subtitulo, subtitulo)

                // Toque → abre o app na /calendario via deep link.
                val launch = Intent(Intent.ACTION_VIEW, Uri.parse("qapqrv://calendario")).apply {
                    setPackage(context.packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val pi = PendingIntent.getActivity(
                    context,
                    0,
                    launch,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                views.setOnClickPendingIntent(R.id.widget_root, pi)

                mgr.updateAppWidget(id, views)
            }
        }

        private fun parseIso(iso: String): Date {
            // Suporta "YYYY-MM-DDTHH:mm:ss(.sssZ)" — formato típico do JS toISOString.
            val patterns = listOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSSX",
                "yyyy-MM-dd'T'HH:mm:ssX",
                "yyyy-MM-dd'T'HH:mm:ss",
                "yyyy-MM-dd",
            )
            for (p in patterns) {
                try {
                    return SimpleDateFormat(p, Locale.US).parse(iso)!!
                } catch (_: Throwable) {}
            }
            return Date()
        }
    }
}
