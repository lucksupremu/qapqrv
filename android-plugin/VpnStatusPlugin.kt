package br.com.qapqrv.app.plugins

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.net.NetworkInterface

/**
 * Detecta VPN ativa 100% offline (sem nenhuma requisição de rede).
 * Estratégia dupla:
 *  1) ConnectivityManager.NetworkCapabilities.TRANSPORT_VPN (API 21+).
 *  2) Fallback: NetworkInterface — procura interfaces tipo tun0/ppp0/anyconnect.
 */
@CapacitorPlugin(name = "VpnStatus")
class VpnStatusPlugin : Plugin() {

    @PluginMethod
    fun isActive(call: PluginCall) {
        val active = isVpnUp(context) || hasVpnInterface()
        val ret = JSObject()
        ret.put("active", active)
        call.resolve(ret)
    }

    private fun isVpnUp(ctx: Context): Boolean {
        return try {
            val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val networks = cm.allNetworks
                for (net in networks) {
                    val caps = cm.getNetworkCapabilities(net) ?: continue
                    if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) return true
                }
                false
            } else {
                @Suppress("DEPRECATION")
                val info = cm.activeNetworkInfo
                info?.type == ConnectivityManager.TYPE_VPN
            }
        } catch (_: Throwable) {
            false
        }
    }

    private fun hasVpnInterface(): Boolean {
        return try {
            val ifaces = NetworkInterface.getNetworkInterfaces() ?: return false
            for (iface in ifaces) {
                if (!iface.isUp) continue
                val name = iface.name?.lowercase() ?: continue
                if (name.startsWith("tun") || name.startsWith("ppp") ||
                    name.contains("anyconnect") || name.contains("ipsec")) {
                    return true
                }
            }
            false
        } catch (_: Throwable) {
            false
        }
    }
}
