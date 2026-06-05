#!/usr/bin/env bash
# Instala os plugins Android nativos do projeto (VpnStatus + InAppWebView baseado em GeckoView)
# DENTRO da pasta android/ que o `cap add android` gera. Idempotente.
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
KOTLIN_VERSION="2.1.0"
# GeckoView estável (motor do Firefox) — independe do Android System WebView / Chrome.
GECKOVIEW_VERSION="149.0.20260403140140"

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
  sed -i "s#org.jetbrains.kotlin:kotlin-stdlib:\${rootProject.ext.kotlin_version ?: '1.9.25'}#org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION#g" "$APP_GRADLE"
fi

# ----- Classpath Kotlin no root build.gradle -----
if [ -f "$ROOT_GRADLE" ] && ! grep -q "kotlin-gradle-plugin" "$ROOT_GRADLE"; then
  echo "==> Adicionando classpath kotlin-gradle-plugin em $ROOT_GRADLE"
  sed -i "s#classpath 'com.android.tools.build:gradle.*#&\n        classpath \"org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION\"#" "$ROOT_GRADLE"
fi

if [ -f "$ROOT_GRADLE" ]; then
  sed -i "s#org.jetbrains.kotlin:kotlin-gradle-plugin:\${kotlin_version ?: '1.9.25'}#org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION#g" "$ROOT_GRADLE"
fi

# ----- Adiciona repositório Maven da Mozilla (necessário para GeckoView) -----
# Capacitor 5+/Gradle 8 usa dependencyResolutionManagement em settings.gradle
# com RepositoriesMode.FAIL_ON_PROJECT_REPOS — então precisamos injetar lá.
# Em projetos antigos ainda existe allprojects { repositories } no root build.gradle.
MOZILLA_REPO_LINE='        maven { url "https://maven.mozilla.org/maven2/" }'

# settings.gradle: dependencyResolutionManagement -> repositories
if [ -f "$SETTINGS_GRADLE" ] && ! grep -q "maven.mozilla.org" "$SETTINGS_GRADLE"; then
  if grep -q "dependencyResolutionManagement" "$SETTINGS_GRADLE"; then
    echo "==> Adicionando repositório Mozilla em dependencyResolutionManagement ($SETTINGS_GRADLE)"
    # Insere depois da PRIMEIRA "repositories {" que aparece após dependencyResolutionManagement
    python3 - "$SETTINGS_GRADLE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
m = re.search(r'dependencyResolutionManagement\s*\{', s)
if m:
    rest = s[m.end():]
    rm = re.search(r'repositories\s*\{', rest)
    if rm:
        ins_at = m.end() + rm.end()
        s = s[:ins_at] + '\n        maven { url "https://maven.mozilla.org/maven2/" }' + s[ins_at:]
        open(p,'w').write(s)
PY
  fi
fi

# root build.gradle: allprojects { repositories { ... } } (fallback)
if [ -f "$ROOT_GRADLE" ] && ! grep -q "maven.mozilla.org" "$ROOT_GRADLE"; then
  if grep -q "allprojects" "$ROOT_GRADLE"; then
    echo "==> Adicionando repositório Mozilla em allprojects ($ROOT_GRADLE)"
    python3 - "$ROOT_GRADLE" <<'PY'
import sys, re
p = sys.argv[1]
s = open(p).read()
m = re.search(r'allprojects\s*\{', s)
if m:
    rest = s[m.end():]
    rm = re.search(r'repositories\s*\{', rest)
    if rm:
        ins_at = m.end() + rm.end()
        s = s[:ins_at] + '\n        maven { url "https://maven.mozilla.org/maven2/" }' + s[ins_at:]
        open(p,'w').write(s)
PY
  fi
fi

# ----- Adiciona dependência GeckoView ao módulo :app -----
if [ -f "$APP_GRADLE" ] && ! grep -q "org.mozilla.geckoview:geckoview" "$APP_GRADLE"; then
  echo "==> Adicionando dependência GeckoView ($GECKOVIEW_VERSION) em $APP_GRADLE"
  sed -i "s#dependencies {#dependencies {\n    implementation \"org.mozilla.geckoview:geckoview:$GECKOVIEW_VERSION\"#" "$APP_GRADLE"
fi

# ----- Garante minSdkVersion >= 21 e multiDexEnabled (GeckoView é grande) -----
if [ -f "$APP_GRADLE" ]; then
  # multiDex
  if ! grep -q "multiDexEnabled" "$APP_GRADLE"; then
    sed -i "s#defaultConfig {#defaultConfig {\n        multiDexEnabled true#" "$APP_GRADLE"
  fi
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
elif grep -q 'InAppWebViewActivity' "$MANIFEST" && ! grep -q 'InAppWebViewActivity.*hardwareAccelerated' "$MANIFEST"; then
  sed -i 's#android:name=".plugins.InAppWebViewActivity"#android:name=".plugins.InAppWebViewActivity" android:hardwareAccelerated="true"#' "$MANIFEST"
fi

# Permissões: INTERNET + WRITE_EXTERNAL_STORAGE (para Downloads em SDK<=28)
grep -q "android.permission.INTERNET" "$MANIFEST" || \
  sed -i 's#<application#<uses-permission android:name="android.permission.INTERNET" />\n    <application#' "$MANIFEST"

grep -q "WRITE_EXTERNAL_STORAGE" "$MANIFEST" || \
  sed -i 's#<application#<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />\n    <application#' "$MANIFEST"

# Cleartext HTTP (intranet PMESP usa http:// em alguns endpoints)
if ! grep -q 'usesCleartextTraffic="true"' "$MANIFEST"; then
  echo "==> Habilitando android:usesCleartextTraffic no AndroidManifest"
  if grep -q '<application' "$MANIFEST" && ! grep -q 'usesCleartextTraffic' "$MANIFEST"; then
    sed -i 's#<application#<application android:usesCleartextTraffic="true"#' "$MANIFEST"
  fi
fi

echo "==> install.sh: OK (GeckoView $GECKOVIEW_VERSION)"
echo "--- MainActivity ---"
cat "${MAIN_ACT_JAVA:-$MAIN_ACT_KT}" 2>/dev/null || cat "$MAIN_ACT_KT"
echo "--- app/build.gradle ---"
cat "$APP_GRADLE"
echo "--- root build.gradle ---"
cat "$ROOT_GRADLE"
echo "--- settings.gradle ---"
cat "$SETTINGS_GRADLE" 2>/dev/null || true
echo "--- AndroidManifest ---"
cat "$MANIFEST"
