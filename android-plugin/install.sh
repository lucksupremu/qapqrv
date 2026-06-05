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
cp "$ROOT/android-plugin/VpnStatusPlugin.kt"      "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewPlugin.kt"   "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewActivity.kt" "$PKG_DIR/"

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
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86_64'
            universalApk false
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

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(VpnStatusPlugin::class.java)
        registerPlugin(InAppWebViewPlugin::class.java)
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

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(VpnStatusPlugin.class);
    registerPlugin(InAppWebViewPlugin.class);
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

echo "==> install.sh: OK (Android System WebView, sem GeckoView)"
echo "--- app/build.gradle ---"
cat "$APP_GRADLE"
echo "--- AndroidManifest ---"
cat "$MANIFEST"
