#!/usr/bin/env bash
# Instala os plugins Android nativos do projeto (VpnStatus + InAppWebView)
# DENTRO da pasta android/ que o `cap add android` gera. Idempotente —
# pode rodar várias vezes sem efeito colateral.
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
KOTLIN_VERSION="2.1.0"

echo "==> Copiando plugins Kotlin para $PKG_DIR"
mkdir -p "$PKG_DIR"
cp "$ROOT/android-plugin/VpnStatusPlugin.kt"      "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewPlugin.kt"   "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewActivity.kt" "$PKG_DIR/"

# ----- Habilita Kotlin no módulo :app (plugins são .kt) -----
if [ -f "$APP_GRADLE" ] && ! grep -q "kotlin-android" "$APP_GRADLE"; then
  echo "==> Habilitando kotlin-android em $APP_GRADLE"
  # Adiciona apply plugin: 'kotlin-android' após a primeira linha apply plugin
  sed -i "0,/apply plugin: 'com.android.application'/{s//apply plugin: 'com.android.application'\napply plugin: 'kotlin-android'/}" "$APP_GRADLE"
  # Adiciona dependência kotlin-stdlib se faltar
  if ! grep -q "kotlin-stdlib" "$APP_GRADLE"; then
    sed -i "s#dependencies {#dependencies {\n    implementation \"org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION\"#" "$APP_GRADLE"
  fi
fi

# Corrige versões Kotlin inseridas por versões antigas deste script, quando a
# variável kotlin_version não existe no Gradle gerado pelo Capacitor.
if [ -f "$APP_GRADLE" ]; then
  sed -i "s#org.jetbrains.kotlin:kotlin-stdlib:\${rootProject.ext.kotlin_version ?: '1.9.25'}#org.jetbrains.kotlin:kotlin-stdlib:$KOTLIN_VERSION#g" "$APP_GRADLE"
fi

# Garante classpath do plugin Kotlin no root build.gradle sem depender de kotlin_version.
if [ -f "$ROOT_GRADLE" ] && ! grep -q "kotlin-gradle-plugin" "$ROOT_GRADLE"; then
  echo "==> Adicionando classpath kotlin-gradle-plugin em $ROOT_GRADLE"
  sed -i "s#classpath 'com.android.tools.build:gradle.*#&\n        classpath \"org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION\"#" "$ROOT_GRADLE"
fi

if [ -f "$ROOT_GRADLE" ]; then
  sed -i "s#org.jetbrains.kotlin:kotlin-gradle-plugin:\${kotlin_version ?: '1.9.25'}#org.jetbrains.kotlin:kotlin-gradle-plugin:$KOTLIN_VERSION#g" "$ROOT_GRADLE"
fi


# ----- Reescreve MainActivity com registro dos plugins (idempotente) -----
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
  echo "!! MainActivity não encontrada em $MAIN_ACT_JAVA nem $MAIN_ACT_KT" >&2
  exit 1
fi

# ----- Registrar InAppWebViewActivity no AndroidManifest -----
if ! grep -q "InAppWebViewActivity" "$MANIFEST"; then
  echo "==> Registrando InAppWebViewActivity no AndroidManifest"
  sed -i 's#</application>#    <activity android:name=".plugins.InAppWebViewActivity" android:configChanges="orientation|screenSize|keyboardHidden" android:exported="false" />\n    </application>#' "$MANIFEST"
fi

# Garante INTERNET (já vem do Capacitor por padrão, mas a gente reforça)
grep -q "android.permission.INTERNET" "$MANIFEST" || \
  sed -i 's#<application#<uses-permission android:name="android.permission.INTERNET" />\n    <application#' "$MANIFEST"

echo "==> install.sh: OK"
echo "--- MainActivity ---"
cat "${MAIN_ACT_JAVA:-$MAIN_ACT_KT}" 2>/dev/null || cat "$MAIN_ACT_KT"
echo "--- app/build.gradle ---"
cat "$APP_GRADLE"
echo "--- AndroidManifest ---"
cat "$MANIFEST"
