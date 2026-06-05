## Diagnóstico

O plugin nativo `InAppWebView` está sendo aberto (a Activity sobe), mas a WebView mostra **tela branca**. Três causas prováveis, todas tratáveis de uma vez:

1. **Cleartext HTTP bloqueado**. A intranet PMESP tem endpoints `http://ms.policiamilitar.sp.gov.br/...`. Desde o Android 9, WebView **bloqueia HTTP por padrão** e mostra página em branco sem mensagem. Falta `android:usesCleartextTraffic="true"` no `<application>` do `AndroidManifest.xml`.
2. **Sem feedback de erro**. Hoje o `WebViewClient` não implementa `onReceivedError`/`onReceivedHttpError` — se a URL falha (VPN desligada, DNS, timeout, certificado), a tela simplesmente fica branca em vez de explicar o motivo.
3. **VPN AnyConnect desligada**. Domínios `*.intranet.policiamilitar.sp.gov.br` e `correio.policiamilitar.sp.gov.br` exigem AnyConnect ativo. Sem feedback (item 2), parece bug do app.

## Mudanças

### 1) `android-plugin/install.sh`
Adicionar passo idempotente que injeta `android:usesCleartextTraffic="true"` no `<application>` do `AndroidManifest.xml` (só se ainda não estiver lá).

### 2) `android-plugin/InAppWebViewActivity.kt`
- Implementar `onReceivedError`, `onReceivedHttpError` e `onReceivedSslError` para renderizar uma **página de erro HTML embutida** dentro da própria WebView, com:
  - Título do erro + URL que falhou
  - Código/descrição (ex: `ERR_CLEARTEXT_NOT_PERMITTED`, `ERR_NAME_NOT_RESOLVED`, `ERR_CONNECTION_TIMED_OUT`)
  - Aviso visível: "Verifique se o AnyConnect está conectado"
  - Botão "Tentar de novo" (recarrega) e "Abrir no Chrome externo"
- Logar via `android.util.Log.e("InAppWebView", …)` pra facilitar `adb logcat`.
- Manter `onReceivedSslError` aceitando certs (já está) mas só pra hosts `.policiamilitar.sp.gov.br`.

### 3) Nada muda no frontend
O fluxo TS (`openInAppBrowser` → `InAppWebView.open`) já está correto. Tudo é correção no lado Android nativo + script de instalação.

## Como validar depois do próximo build

1. Build do APK no GitHub Actions deve continuar verde (mudanças são em `install.sh` e `.kt`, não em Gradle).
2. Instalar APK novo, abrir "Email iNotes" SEM AnyConnect → deve mostrar a tela de erro com mensagem clara (e não mais tela branca).
3. Conectar AnyConnect, abrir o mesmo link → deve carregar normalmente.
4. Abrir "Marcar / Desmarcar" (HTTPS intranet) com VPN → deve carregar.

## O que NÃO faz parte

- Não mexer no fluxo de VPN nem em `vpn-guard.tsx`.
- Não mexer no `package.json`/Gradle/Kotlin (já estabilizado em 2.1.0).
- Não trocar o plugin por `@capacitor/inappbrowser` — já foi descartado por incompatibilidade com `.gov.br`.
