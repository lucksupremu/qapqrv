# Corrigir Salvar e Compartilhar no visualizador de PDF (APK)

## Problemas atuais

1. **Compartilhar dá erro** — no Android 11+ a "package visibility" bloqueia `queryIntentActivities` para PDF, e o `EXTRA_INITIAL_INTENTS` é montado sem tipagem `Parcelable[]`, o que pode disparar `ClassCastException` em alguns aparelhos. Sem `<queries>` no manifest, leitores de PDF instalados também ficam invisíveis para o chooser.
2. **Salvar não sai do APK** — o caminho via `MediaStore.Downloads` falha silenciosamente em alguns OEMs (Xiaomi/MIUI, alguns Samsung) e o arquivo nunca aparece em `/Downloads`. Hoje o fallback SAF só roda em Android 9-.

## Solução

### `android-plugin/PdfViewerActivity.kt`

**Salvar (sempre via SAF):**
- Substituir a lógica atual por `ACTION_CREATE_DOCUMENT` em **todas** as versões do Android. O usuário escolhe onde salvar (Downloads, Drive, cartão SD, etc.) e isso funciona em todo OEM sem permissão.
- Sugerir nome `Escala_<id>.pdf`.
- Após salvar com sucesso, mostrar um pequeno diálogo: "PDF salvo. Abrir com leitor de PDF?" — botão "Abrir" dispara `Intent.ACTION_VIEW` na URI escolhida via chooser, listando todos os leitores instalados.

**Compartilhar / Abrir com:**
- Manter `FileProvider` (já configurado em `qapqrv_file_paths.xml` com `<files-path path="."/>` — cobre `filesDir/escalas/...`).
- Corrigir o `EXTRA_INITIAL_INTENTS` tipando como `Array<android.os.Parcelable>`.
- Adicionar `FLAG_GRANT_READ_URI_PERMISSION` também no chooser (não só nas intents internas).
- Envolver tudo em `try/catch` com mensagem de erro detalhada via `Toast`/`Log`.
- Se nenhum app conseguir tratar `ACTION_SEND` para `application/pdf`, cair de volta direto em `ACTION_VIEW`.

### `android-plugin/install.sh`

Adicionar bloco `<queries>` ao `AndroidManifest.xml` (necessário a partir do Android 11 para descobrir apps externos). Inserir antes da tag `<application>`:

```xml
<queries>
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:mimeType="application/pdf" />
    </intent>
    <intent>
        <action android:name="android.intent.action.SEND" />
        <data android:mimeType="application/pdf" />
    </intent>
</queries>
```

Idempotente (`grep -q` antes de injetar), seguindo o padrão dos outros blocos do `install.sh`.

## Resultado esperado

- **Salvar**: abre seletor nativo do Android, usuário escolhe pasta (Downloads, etc.), arquivo fica visível fora do APK, e logo após oferece "Abrir com leitor de PDF".
- **Compartilhar**: lista corretamente WhatsApp, Gmail, Drive, leitores de PDF (Adobe, Xodo, etc.) sem erro.

## Fora do escopo

- Sem mudanças no fluxo web/PWA.
- Sem mexer em `InAppWebViewPlugin.kt` (o download em background continua igual; só muda o que acontece dentro do `PdfViewerActivity`).
- Não vou regenerar APK — você roda o workflow depois para validar.
