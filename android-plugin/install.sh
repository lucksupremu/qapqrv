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

echo "==> Copiando plugins Kotlin para $PKG_DIR"
mkdir -p "$PKG_DIR"
cp "$ROOT/android-plugin/VpnStatusPlugin.kt"      "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewPlugin.kt"   "$PKG_DIR/"
cp "$ROOT/android-plugin/InAppWebViewActivity.kt" "$PKG_DIR/"

# ----- Registrar plugins na MainActivity -----
register_in_java() {
  local f="$1"
  echo "==> Patching $f (Java)"
  # Adiciona imports se faltarem
  grep -q "br.com.qapqrv.app.plugins.VpnStatusPlugin" "$f" || \
    sed -i '/^package /a import br.com.qapqrv.app.plugins.VpnStatusPlugin;\nimport br.com.qapqrv.app.plugins.InAppWebViewPlugin;\nimport android.os.Bundle;' "$f"

  # Garante onCreate com registerPlugin. Se a classe não tiver onCreate ainda,
  # injeta o bloco antes do último '}' do arquivo.
  if ! grep -q "registerPlugin(VpnStatusPlugin.class)" "$f"; then
    if grep -q "public void onCreate" "$f"; then
      sed -i 's#public void onCreate(Bundle savedInstanceState) {#public void onCreate(Bundle savedInstanceState) {\n    registerPlugin(VpnStatusPlugin.class);\n    registerPlugin(InAppWebViewPlugin.class);#' "$f"
    else
      # Injeta um onCreate completo antes do último '}'
      sed -i '$ d' "$f"
      cat >> "$f" <<'EOF'
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(VpnStatusPlugin.class);
    registerPlugin(InAppWebViewPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
EOF
    fi
  fi
}

register_in_kotlin() {
  local f="$1"
  echo "==> Patching $f (Kotlin)"
  grep -q "br.com.qapqrv.app.plugins.VpnStatusPlugin" "$f" || \
    sed -i '/^package /a import br.com.qapqrv.app.plugins.VpnStatusPlugin\nimport br.com.qapqrv.app.plugins.InAppWebViewPlugin\nimport android.os.Bundle' "$f"

  if ! grep -q "registerPlugin(VpnStatusPlugin::class.java)" "$f"; then
    if grep -q "override fun onCreate" "$f"; then
      sed -i 's#override fun onCreate(savedInstanceState: Bundle?) {#override fun onCreate(savedInstanceState: Bundle?) {\n        registerPlugin(VpnStatusPlugin::class.java)\n        registerPlugin(InAppWebViewPlugin::class.java)#' "$f"
    else
      sed -i '$ d' "$f"
      cat >> "$f" <<'EOF'
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(VpnStatusPlugin::class.java)
        registerPlugin(InAppWebViewPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
EOF
    fi
  fi
}

if [ -f "$MAIN_ACT_JAVA" ]; then
  register_in_java "$MAIN_ACT_JAVA"
elif [ -f "$MAIN_ACT_KT" ]; then
  register_in_kotlin "$MAIN_ACT_KT"
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
echo "--- AndroidManifest ---"
cat "$MANIFEST"
