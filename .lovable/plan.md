# Ativar salvamento de credenciais (autofill nativo) no navegador interno

## Objetivo
Permitir que gerenciadores de senha do Android (Google, Samsung Pass, 1Password etc.) detectem os campos de login das páginas da PMESP (intranet, iNotes, CIAF) abertas no WebView interno, oferecendo "Salvar senha?" e autopreenchimento nos próximos acessos.

## Por que não funciona hoje
O `WebView` do Android suporta o Autofill Framework desde Android 8, mas precisa de algumas flags habilitadas explicitamente — caso contrário o sistema operacional ignora os campos e o gerenciador de senhas não aparece. Hoje o `InAppWebViewActivity` não liga nenhuma dessas flags.

## Mudanças (apenas Android nativo)

Arquivo: `android-plugin/InAppWebViewActivity.kt`

Dentro de `configureWebView(...)`, acrescentar:

1. **Salvar dados de formulário** (necessário para o gerenciador identificar o par usuário/senha):
   - `s.saveFormData = true` (deprecated mas ainda usado pelo Chromium do WebView para sinalizar autofill).
   - Remover qualquer chamada futura a `WebSettings.setSavePassword(false)`.

2. **Marcar a WebView como elegível para autofill** (Android 8+):
   - `webView.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_YES_EXCLUDE_DESCENDANTS`
   - Restringir o autofill aos hosts confiáveis: em `onPageStarted`, se o host **não** terminar em `policiamilitar.sp.gov.br`, trocar para `IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS`; senão voltar para `YES_EXCLUDE_DESCENDANTS`. Isso atende o escopo "só PMESP".

3. **Notificar o framework quando o usuário sair do campo** (algumas ROMs só disparam o "Salvar senha?" se isso for chamado):
   - No `onPageFinished`, chamar `getSystemService(AutofillManager::class.java)?.commit()` antes de qualquer navegação interna (também acionado no `onBackPressed`).

4. **Garantir que a Activity não esteja excluída do autofill**:
   - Conferir que não há `android:importantForAutofill="no"` no bloco da `InAppWebViewActivity` no `AndroidManifest.xml`. Se o `install.sh` registrar a activity sem esse atributo, está OK; nada a mudar. Se ele injetar `no`, removo do template.

## Não muda
- `src/lib/in-app-browser.ts`, rotas, JS do app: nada.
- Sem armazenamento próprio de senha, sem JS injetado, sem criptografia custom — quem guarda é o gerenciador de senhas do próprio Android escolhido pelo usuário.
- iOS/PWA: fora de escopo (o app é Android).

## Como testar depois do novo APK
1. Abrir "Marcar/Desmarcar Dejem" → intranet PMESP → digitar usuário/senha → entrar.
2. O Android deve mostrar a barra "Salvar senha para policiamilitar.sp.gov.br?" do gerenciador padrão.
3. Sair do app, abrir de novo a mesma página: os campos devem aparecer com sugestão de autopreenchimento.
4. Repetir para iNotes (`correio.policiamilitar.sp.gov.br`) e CIAF (`ciaf.policiamilitar.sp.gov.br`).
5. Abrir um site fora do domínio PMESP: confirmar que o autofill **não** é oferecido (escopo restrito).

## Observação
O comportamento depende de o usuário ter um gerenciador de senhas configurado em **Configurações → Senhas e contas → Serviço de preenchimento automático**. Se estiver "Nenhum", nada aparece — isso é configuração do aparelho, não do app.
