#!/usr/bin/env bash
# Instala os plugins Android nativos do projeto (VpnStatus + InAppWebView baseado
# no Android System WebView). Idempotente.
#
# Uso (no CI, após `bunx cap sync android`):
#   bash android-plugin/install.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_DIR="android/app/src/main/java/br/com/qapqrv/app/plugins"
MAIN_ACT_JAVA="android/app/src/main/java/br/com/qapqrv/app/MainActivity.java"
MAIN_ACT_KT="android/app/src/main/java/br/com/qapqrv/app/MainActivity.kt"
MANIFEST="android/app/src/main/AndroidManifest.xml"
APP_GRADLE="android/app/build.gradle"
ROOT_GRADLE="android/build.gradle"
SETTINGS_GRADLE="android/settings.gradle"
KOTLIN_VERSION="2.3.10"

echo "==> Copiando plugins Kotlin para $PKG_DIR"
mkdir -p "$PKG_DIR"
# Limpa cópias antigas de plugins/Activities removidos.
rm -f "$PKG_DIR/PdfViewerActivity.kt" "$PKG_DIR/CustomTabsPlugin.kt"
cp "$ROOT/android-plugin/VpnStatusPlugin.kt"      "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewPlugin.kt"   "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewActivity.kt" "$PKG_DIR/"
cp "$ROOT/android-plugin/AppOpenAdPlugin.kt"      "$PKG_DIR/"

ADMOB_APP_ID="ca-app-pub-4966192764194561~2515666476"

# ----- Habilita Kotlin no módulo :app -----
if [ -f "$APP_GRADLE" ] && ! grep -q "kotlin-android" "$APP_GRADLE"; then
  echo "==> Habilitando kotlin-android em $APP_GRADLE"
  sed -i "0,/apply plugin: 'com.android.application'/{s//apply plugin: 'com.android.application'\napply plugin: 'kotlin-android'/}" "$APP_GRADLE"
  if ! grep -q "kotlin-stdlib" "$APP_GRADLE"; then
    sed -i "s#dependencies {#dependencies {\n    implementation \"org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION\"#" "$APP_GRADLE"
  fi
fi

if [ -f "$APP_GRADLE" ]; then
  sed -i -E "s#org.jetbrains.kotlin:kotlin-stdlib:[0-9A-Za-z.+_-]+#org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION#g" "$APP_GRADLE"
fi

# ----- Classpath Kotlin no root build.gradle -----
if [ -f "$ROOT_GRADLE" ] && ! grep -q "kotlin-gradle-plugin" "$ROOT_GRADLE"; then
  echo "==> Adicionando classpath kotlin-gradle-plugin em $ROOT_GRADLE"
  sed -i "s#classpath 'com.android.tools.build:gradle.*#&\n        classpath \"org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION\"#" "$ROOT_GRADLE"
fi

if [ -f "$ROOT_GRADLE" ]; then
  sed -i -E "s#org.jetbrains.kotlin:kotlin-gradle-plugin:[0-9A-Za-z.+_-]+#org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION#g" "$ROOT_GRADLE"
  sed -i -E "s#kotlin_version[[:space:]]*=[[:space:]]*['\"][^'\"]+['\"]#kotlin_version = '$KOTLIN_VERSION'#g" "$ROOT_GRADLE"
  sed -i -E "s#(id[[:space:]]+['\"]org\.jetbrains\.kotlin\.(android|jvm)['\"][[:space:]]+version[[:space:]]+['\"])[^'\"]+(['\"])#\1$KOTLIN_VERSION\3#g" "$ROOT_GRADLE"
fi

if [ -f "$SETTINGS_GRADLE" ]; then
  sed -i -E "s#(id[[:space:]]+['\"]org\.jetbrains\.kotlin\.(android|jvm)['\"][[:space:]]+version[[:space:]]+['\"])[^'\"]+(['\"])#\1$KOTLIN_VERSION\3#g" "$SETTINGS_GRADLE"
fi

VARS_GRADLE="android/variables.gradle"
if [ -f "$VARS_GRADLE" ] && grep -q "kotlin_version" "$VARS_GRADLE"; then
  sed -i -E "s#kotlin_version[[:space:]]*=[[:space:]]*['\"][^'\"]+['\"]#kotlin_version = '$KOTLIN_VERSION'#g" "$VARS_GRADLE"
fi

# ----- Remove vestígios do GeckoView (versões anteriores deste script) -----
if [ -f "$APP_GRADLE" ] && grep -q "org.mozilla.geckoview" "$APP_GRADLE"; then
  echo "==> Removendo dependência GeckoView de $APP_GRADLE"
  sed -i '/org\.mozilla\.geckoview/d' "$APP_GRADLE"
fi
if [ -f "$SETTINGS_GRADLE" ] && grep -q "maven.mozilla.org" "$SETTINGS_GRADLE"; then
  sed -i '/maven.mozilla.org/d' "$SETTINGS_GRADLE"
fi
if [ -f "$ROOT_GRADLE" ] && grep -q "maven.mozilla.org" "$ROOT_GRADLE"; then
  sed -i '/maven.mozilla.org/d' "$ROOT_GRADLE"
fi

# ----- multiDexEnabled (inofensivo) -----
if [ -f "$APP_GRADLE" ] && ! grep -q "multiDexEnabled" "$APP_GRADLE"; then
  sed -i "s#defaultConfig {#defaultConfig {\n        multiDexEnabled true#" "$APP_GRADLE"
fi

# ----- ABI splits + minify para reduzir APK -----
if [ -f "$APP_GRADLE" ] && ! grep -q "splits {" "$APP_GRADLE"; then
  echo "==> Adicionando splits ABI em $APP_GRADLE"
  python3 - "$APP_GRADLE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
m = re.search(r'android\s*\{', s)
if m:
    ins = m.end()
    block = """
    splits {
        abi {
            enable false
        }
    }
    packagingOptions {
        resources {
            excludes += ['META-INF/AL2.0', 'META-INF/LGPL2.1', 'META-INF/*.kotlin_module']
        }
    }
"""

    s = s[:ins] + block + s[ins:]
    open(p,'w').write(s)
PY
fi

# Ativa minify+shrinkResources no buildType release (debug fica sem para CI rápido).
if [ -f "$APP_GRADLE" ]; then
  python3 - "$APP_GRADLE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
# Garante bloco buildTypes.release com minify e shrinkResources
if 'buildTypes' in s and 'release {' in s:
    s2 = re.sub(
        r'release\s*\{[^}]*\}',
        """release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }""",
        s, count=1
    )
    if s2 != s:
        open(p,'w').write(s2)
PY
fi

# ----- Reescreve MainActivity registrando os plugins -----
if [ -f "$MAIN_ACT_KT" ]; then
  echo "==> Reescrevendo $MAIN_ACT_KT"
  cat > "$MAIN_ACT_KT" <<'EOF'
package br.com.qapqrv.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import br.com.qapqrv.app.plugins.VpnStatusPlugin
import br.com.qapqrv.app.plugins.InAppWebViewPlugin
import br.com.qapqrv.app.plugins.AppOpenAdPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(VpnStatusPlugin::class.java)
        registerPlugin(InAppWebViewPlugin::class.java)
        registerPlugin(AppOpenAdPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
EOF
elif [ -f "$MAIN_ACT_JAVA" ]; then
  echo "==> Reescrevendo $MAIN_ACT_JAVA"
  cat > "$MAIN_ACT_JAVA" <<'EOF'
package br.com.qapqrv.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import br.com.qapqrv.app.plugins.VpnStatusPlugin;
import br.com.qapqrv.app.plugins.InAppWebViewPlugin;
import br.com.qapqrv.app.plugins.AppOpenAdPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(VpnStatusPlugin.class);
    registerPlugin(InAppWebViewPlugin.class);
    registerPlugin(AppOpenAdPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
EOF
else
  echo "!! MainActivity não encontrada" >&2
  exit 1
fi

# ----- Registrar InAppWebViewActivity no AndroidManifest -----
if ! grep -q "InAppWebViewActivity" "$MANIFEST"; then
  echo "==> Registrando InAppWebViewActivity no AndroidManifest"
  sed -i 's#</application>#    <activity android:name=".plugins.InAppWebViewActivity" android:configChanges="orientation|screenSize|keyboardHidden" android:hardwareAccelerated="true" android:exported="false" />\n    </application>#' "$MANIFEST"
fi

# PdfViewerActivity foi removida — agora PDFs abrem em app externo (Drive/Adobe).
# Remove o registro antigo do manifest se existir.
if grep -q "PdfViewerActivity" "$MANIFEST"; then
  echo "==> Removendo registro de PdfViewerActivity do AndroidManifest"
  sed -i '/PdfViewerActivity/d' "$MANIFEST"
fi

# ----- Endurece MainActivity: singleTask + configChanges + alwaysRetainTaskState -----
# Garante que ao voltar do AnyConnect (ou de outro app que mexe na rede/VPN) o
# Android resuma a Activity existente em vez de criar uma nova task vazia.
if [ -f "$MANIFEST" ] && grep -q 'android:name="\.MainActivity"' "$MANIFEST"; then
  echo "==> Reforçando MainActivity (launchMode + configChanges) no AndroidManifest"
  python3 - "$MANIFEST" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()

CONFIG_CHANGES = "orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode|navigation|mcc|mnc"

def patch_attr(tag, name, value):
    pat = re.compile(r'(\s' + re.escape(name) + r'=")[^"]*(")')
    if pat.search(tag):
        return pat.sub(r'\g<1>' + value + r'\g<2>', tag)
    # injeta antes do fechamento da tag
    return re.sub(r'(\s*/?>)', ' ' + name + '="' + value + r'"\1', tag, count=1)

def fix_main(m):
    tag = m.group(0)
    tag = patch_attr(tag, "android:launchMode", "singleTask")
    tag = patch_attr(tag, "android:alwaysRetainTaskState", "true")
    tag = patch_attr(tag, "android:configChanges", CONFIG_CHANGES)
    return tag

s2 = re.sub(r'<activity\b[^>]*android:name="\.MainActivity"[^>]*/?>', fix_main, s)
if s2 != s:
    open(p, 'w').write(s2)
PY
fi

# Permissões
grep -q "android.permission.INTERNET" "$MANIFEST" || \
  sed -i 's#<application#<uses-permission android:name="android.permission.INTERNET" />\n    <application#' "$MANIFEST"

grep -q "WRITE_EXTERNAL_STORAGE" "$MANIFEST" || \
  sed -i 's#<application#<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />\n    <application#' "$MANIFEST"

# Cleartext HTTP (intranet PMESP usa http:// em alguns endpoints)
if ! grep -q 'usesCleartextTraffic="true"' "$MANIFEST"; then
  echo "==> Habilitando android:usesCleartextTraffic no AndroidManifest"
  sed -i 's#<application#<application android:usesCleartextTraffic="true"#' "$MANIFEST"
fi

# ----- AdMob: meta-data APPLICATION_ID no Manifest -----
if ! grep -q "com.google.android.gms.ads.APPLICATION_ID" "$MANIFEST"; then
  echo "==> Adicionando meta-data AdMob APPLICATION_ID no AndroidManifest"
  sed -i "s#</application>#    <meta-data android:name=\"com.google.android.gms.ads.APPLICATION_ID\" android:value=\"$ADMOB_APP_ID\" />\n    </application>#" "$MANIFEST"
fi

# ----- AdMob: dependência play-services-ads no app/build.gradle -----
if [ -f "$APP_GRADLE" ] && ! grep -q "play-services-ads" "$APP_GRADLE"; then
  echo "==> Adicionando dependência play-services-ads em $APP_GRADLE"
  sed -i "s#dependencies {#dependencies {\n    implementation \"com.google.android.gms:play-services-ads:23.6.0\"#" "$APP_GRADLE"
fi

# ----- androidx.core (FileProvider) -----
if [ -f "$APP_GRADLE" ] && ! grep -q "androidx.core:core-ktx" "$APP_GRADLE"; then
  echo "==> Adicionando dependência androidx.core:core-ktx em $APP_GRADLE"
  sed -i "s#dependencies {#dependencies {\n    implementation \"androidx.core:core-ktx:1.13.1\"#" "$APP_GRADLE"
fi

# ----- androidx.browser (Chrome Custom Tabs) -----
if [ -f "$APP_GRADLE" ] && ! grep -q "androidx.browser:browser" "$APP_GRADLE"; then
  echo "==> Adicionando dependência androidx.browser:browser em $APP_GRADLE"
  sed -i "s#dependencies {#dependencies {\n    implementation \"androidx.browser:browser:1.8.0\"#" "$APP_GRADLE"
fi

# ----- androidx.swiperefreshlayout (pull-to-refresh na WebView interna) -----
if [ -f "$APP_GRADLE" ] && ! grep -q "androidx.swiperefreshlayout" "$APP_GRADLE"; then
  echo "==> Adicionando dependência androidx.swiperefreshlayout em $APP_GRADLE"
  sed -i "s#dependencies {#dependencies {\n    implementation \"androidx.swiperefreshlayout:swiperefreshlayout:1.1.0\"#" "$APP_GRADLE"
fi

# ----- FileProvider para abrir PDF baixado em apps externos -----
RES_XML_DIR="android/app/src/main/res/xml"
mkdir -p "$RES_XML_DIR"
cat > "$RES_XML_DIR/qapqrv_file_paths.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <files-path name="escalas" path="escalas/" />
    <files-path name="files_root" path="." />
    <cache-path name="shared" path="shared/" />
    <cache-path name="cache_root" path="." />
    <external-files-path name="ext_files" path="." />
    <external-cache-path name="ext_cache" path="." />
</paths>
EOF


if ! grep -q "androidx.core.content.FileProvider" "$MANIFEST"; then
  echo "==> Registrando FileProvider no AndroidManifest"
  PROVIDER_BLOCK='        <provider\n            android:name="androidx.core.content.FileProvider"\n            android:authorities="${applicationId}.fileprovider"\n            android:exported="false"\n            android:grantUriPermissions="true">\n            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml\/qapqrv_file_paths" \/>\n        <\/provider>\n    <\/application>'
  sed -i "s#</application>#$PROVIDER_BLOCK#" "$MANIFEST"
fi

# ----- <queries> para descobrir leitores/compartilhadores de PDF (Android 11+) -----
if ! grep -q "<!-- qapqrv-pdf-queries -->" "$MANIFEST"; then
  echo "==> Adicionando bloco <queries> ao AndroidManifest"
  QUERIES_BLOCK='    <!-- qapqrv-pdf-queries -->\n    <queries>\n        <package android:name="com.cisco.anyconnect.vpn.android.avf" \/>\n        <package android:name="com.cisco.anyconnect.vpn.android.apex" \/>\n        <intent>\n            <action android:name="android.intent.action.VIEW" \/>\n            <data android:mimeType="application\/pdf" \/>\n        <\/intent>\n        <intent>\n            <action android:name="android.intent.action.SEND" \/>\n            <data android:mimeType="application\/pdf" \/>\n        <\/intent>\n    <\/queries>\n    <application'
  sed -i "0,/<application/s##$QUERIES_BLOCK#" "$MANIFEST"
elif ! grep -q "com.cisco.anyconnect" "$MANIFEST"; then
  echo "==> Adicionando <package> do AnyConnect ao bloco <queries>"
  sed -i '0,/<queries>/s##<queries>\n        <package android:name="com.cisco.anyconnect.vpn.android.avf" \/>\n        <package android:name="com.cisco.anyconnect.vpn.android.apex" \/>#' "$MANIFEST"
fi

# ----- Network Security Config: confia em CAs do sistema + do usuário (VPN) -----
# Resolve `CertPathValidatorException: Trust anchor for certification path not found`
# ao baixar PDFs da intranet PMESP via HttpURLConnection nativo.
cat > "$RES_XML_DIR/network_security_config.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">policiamilitar.sp.gov.br</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>
EOF

if ! grep -q 'android:networkSecurityConfig' "$MANIFEST"; then
  echo "==> Registrando networkSecurityConfig no AndroidManifest"
  sed -i 's#<application#<application android:networkSecurityConfig="@xml/network_security_config"#' "$MANIFEST"
fi

echo "==> install.sh: OK (Android System WebView, sem GeckoView)"
echo "--- app/build.gradle ---"
cat "$APP_GRADLE"
echo "--- AndroidManifest ---"
cat "$MANIFEST"
