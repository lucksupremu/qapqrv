## Problema

O workflow `build-aab-release.yml` (e provavelmente `build-apk.yml`) usa a variável `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"` para forçar as actions antigas a rodarem em Node 24. Isso gera o warning porque as versões fixadas ainda declaram Node 20 internamente.

A correção limpa é **atualizar as actions para as versões que já rodam nativamente em Node 24** e remover o `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`.

## Mudanças

Em `.github/workflows/build-aab-release.yml` e `.github/workflows/build-apk.yml`:

1. Remover o bloco:
   ```yaml
   env:
     FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"
   ```

2. Atualizar versões das actions:
   - `actions/checkout@v4` → `@v5`
   - `actions/github-script@v7` → `@v8`
   - `actions/setup-java@v4` → `@v5`
   - `android-actions/setup-android@v3` → `@v4`
   - `softprops/action-gh-release@v2` → manter (v2 já roda em Node 24 nas releases recentes; se ainda warn, fixar tag mais nova)
   - `oven-sh/setup-bun@v2` → manter (já em Node 24)

3. Não mexer em nada de build, signing, versionCode/Name ou plugins — só atualização de runner.

## Resultado esperado

Próximo run do workflow não emite mais o warning de deprecação do Node 20, e o build continua igual (mesmo AAB/APK assinados).
