## Problema

O build do APK falha em `:app:processDebugMainManifest` com:

```
uses-sdk:minSdkVersion 24 cannot be smaller than version 26
declared in library [io.ionic.libs:ioninappbrowser-android:2.0.0]
```

Causa: o `@capacitor/inappbrowser` (que é justamente o que dá o "navegador interno robusto que não é Chrome") exige **Android 8.0+ (minSdk 26)**. O `npx cap add android` gera o projeto com `minSdkVersion = 24` por padrão. Como a pasta `android/` é criada do zero a cada run do GitHub Actions, qualquer ajuste tem que ser feito pelo próprio workflow.

## Correção

Editar `.github/workflows/build-apk.yml` para, **logo após** o `cap add android` e **antes** do `gradlew assembleDebug`, sobrescrever `android/variables.gradle` elevando `minSdkVersion` de 24 → 26.

### Passo novo no workflow

Adicionar entre "Add Android platform" e "Generate APK assets":

```yaml
- name: Patch minSdkVersion to 26 (required by @capacitor/inappbrowser)
  run: |
    sed -i 's/minSdkVersion = 24/minSdkVersion = 26/' android/variables.gradle
    echo "--- variables.gradle ---"
    cat android/variables.gradle
```

Impacto prático: o APK passa a exigir Android 8.0+ em vez de 7.0+. Android 8.0 é de 2017 e cobre >97% dos aparelhos ativos — perda irrelevante, e é o mínimo do plugin.

### Por que não usar `tools:overrideLibrary`

A alternativa que o próprio Gradle sugere (`tools:overrideLibrary`) força a build mas o plugin pode crashar em runtime no Android 7 porque usa APIs novas. Subir o minSdk é o caminho correto e o que a doc do `@capacitor/inappbrowser` recomenda.

### Arquivos alterados

- `.github/workflows/build-apk.yml` — adiciona o step de patch do `variables.gradle`.

Nada de código TypeScript / app web é tocado. Só o workflow.

## Como usar depois

Mesmo fluxo: push pra `main` (ou Run workflow manual) → aguardar ~5–8 min → baixar o artifact `qapqrv-debug-apk` → instalar no celular. Agora o build vai até o fim.
