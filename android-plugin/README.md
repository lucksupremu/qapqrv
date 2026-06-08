# Plugins nativos Android — QAP, QRV!

Este diretório contém os fontes Kotlin que precisam ser copiados para
o projeto Android gerado pelo Capacitor (`android/`).

| Arquivo | Função |
|---|---|
| `VpnStatusPlugin.kt` | Detecta VPN ativa via `ConnectivityManager`. |
| `InAppWebViewPlugin.kt` + `InAppWebViewActivity.kt` | Navegador interno (intranet PMESP) + autofill do cofre local. |
| `PdfViewerActivity.kt` | Visualizador de PDF embutido (fallback se não houver leitor externo). |
| `AppOpenAdPlugin.kt` | AdMob — App Open. |
| `NativeAdPlugin.kt` | AdMob — Native Ads desenhados sobre o WebView (usado no histórico). |
| `WidgetDataPlugin.kt` | Bridge JS → SharedPreferences usadas pelo widget. |
| `ProximaEscalaWidget.kt` | Widget home-screen "Próxima escala". |

## Instalação no projeto Android

```bash
mkdir -p android/app/src/main/java/br/com/qapqrv/app/plugins
cp android-plugin/*.kt android/app/src/main/java/br/com/qapqrv/app/plugins/
```

Registre os plugins na `MainActivity`:

```kotlin
import com.getcapacitor.BridgeActivity
import br.com.qapqrv.app.plugins.*

class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    registerPlugin(VpnStatusPlugin::class.java)
    registerPlugin(InAppWebViewPlugin::class.java)
    registerPlugin(AppOpenAdPlugin::class.java)
    registerPlugin(NativeAdPlugin::class.java)
    registerPlugin(WidgetDataPlugin::class.java)
    super.onCreate(savedInstanceState)
  }
}
```

## Autofill da intranet

Já incluso no `InAppWebViewPlugin.kt` e `InAppWebViewActivity.kt`. O fluxo:

1. Usuário cadastra CPF + senha em **Configurações → Login automático intranet** (cofre AES-GCM cifrado por PIN).
2. Ao abrir `/intranet`, o app pede o PIN, decifra e chama
   `InAppWebView.setAutofillCredentials({ cpf, senha })`.
3. A Activity injeta JS no `onPageFinished` quando a URL contém `login.aspx`
   e limpa as credenciais em memória logo após.

Não exige permissão extra.

## Widget "Próxima escala"

### Arquivos extras a criar manualmente em `android/app/src/main/res/`

**`layout/widget_proxima_escala.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:background="#0F2535">
    <TextView
        android:id="@+id/widget_titulo"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="#FFFFFF"
        android:textSize="14sp"
        android:textStyle="bold"
        android:text="Sem próxima escala" />
    <TextView
        android:id="@+id/widget_subtitulo"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="#A8C2D6"
        android:textSize="12sp"
        android:layout_marginTop="4dp"
        android:text="Toque para abrir" />
</LinearLayout>
```

**`xml/widget_proxima_escala_info.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="80dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_proxima_escala"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
```

### `AndroidManifest.xml` — adicionar receiver + intent-filter de deep link

```xml
<receiver
    android:name="br.com.qapqrv.app.plugins.ProximaEscalaWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/widget_proxima_escala_info" />
</receiver>

<!-- Deep link para o widget abrir o calendário -->
<activity android:name=".MainActivity" ... >
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="qapqrv" />
    </intent-filter>
</activity>
```

## Atalhos rápidos (long-press no ícone)

**`AndroidManifest.xml`** — dentro da `<activity android:name=".MainActivity">`:

```xml
<meta-data
    android:name="android.app.shortcuts"
    android:resource="@xml/shortcuts" />
```

**`xml/shortcuts.xml`**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut
        android:shortcutId="nova_marca"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/shortcut_nova"
        android:shortcutLongLabel="@string/shortcut_nova">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="br.com.qapqrv.app"
            android:targetClass="br.com.qapqrv.app.MainActivity"
            android:data="qapqrv://calendario?action=nova-marca" />
    </shortcut>
    <shortcut
        android:shortcutId="proxima_escala"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/shortcut_proxima"
        android:shortcutLongLabel="@string/shortcut_proxima">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="br.com.qapqrv.app"
            android:targetClass="br.com.qapqrv.app.MainActivity"
            android:data="qapqrv://calendario" />
    </shortcut>
    <shortcut
        android:shortcutId="abrir_intranet"
        android:enabled="true"
        android:icon="@mipmap/ic_launcher"
        android:shortcutShortLabel="@string/shortcut_intranet"
        android:shortcutLongLabel="@string/shortcut_intranet">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="br.com.qapqrv.app"
            android:targetClass="br.com.qapqrv.app.MainActivity"
            android:data="qapqrv://intranet" />
    </shortcut>
</shortcuts>
```

E em `res/values/strings.xml`:

```xml
<string name="shortcut_nova">Nova marca</string>
<string name="shortcut_proxima">Próxima escala</string>
<string name="shortcut_intranet">Abrir intranet</string>
```

## Build

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```
