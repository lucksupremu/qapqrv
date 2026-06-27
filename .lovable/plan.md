## Problema

O Play Store rejeitou o AAB porque o `versionCode` enviado era **4**, e a Play já tem uma versão igual ou superior publicada. Cada novo upload precisa de `versionCode` **estritamente maior** que qualquer versão já enviada (mesmo em trilhas de teste/interno).

Bumpei pra 5 no último turno, mas pra evitar esse problema voltar toda vez (e pra garantir que o próximo upload passe), vou fazer duas coisas:

## Mudanças em `.github/workflows/build-apk.yml`

1. **Bump seguro imediato**: pular `versionCode` de 5 → **20** e `versionName` para **1.2.0**. Margem grande pra ultrapassar qualquer versão já existente na Play (interna/fechada/produção).

2. **Auto-incremento baseado em `github.run_number`**: trocar o `sed` fixo por:
   ```
   BASE=20
   VCODE=$((BASE + GITHUB_RUN_NUMBER))
   sed -i "s/versionCode [0-9][0-9]*/versionCode ${VCODE}/" "$GRADLE"
   ```
   Assim cada build do CI gera um `versionCode` único e crescente automaticamente — você nunca mais precisa lembrar de bumpar manualmente antes de subir pra Play.

3. **`versionName`** continua fixo em `1.2.0` (ou o que você quiser); só o `versionCode` precisa ser sempre único pra Play.

## O que você precisa fazer depois

- Push pro GitHub → Actions gera o novo AAB em `Releases → AAB Release Latest`.
- Se a Play ainda reclamar (versão interna já passou de 20), me avisa o número exato que aparece na mensagem que eu ajusto o `BASE`.
