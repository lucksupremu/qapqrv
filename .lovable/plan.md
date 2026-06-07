## Realidade do que será entregue

Eu **não consigo** gerar o `.aab` final dentro do Lovable (sem Android SDK aqui) nem subir na Play Console por você. O que vou deixar pronto:

1. **Keystore** (`qapqrv-release.jks`) gerada por mim, com senha aleatória forte, válida por 27 anos — entregue como artefato pra download.
2. **Workflow CI assinado** (`.github/workflows/build-aab-release.yml`) — toda vez que você criar uma tag `v*` no GitHub, o GitHub Actions compila e assina o `.aab` automaticamente.
3. **Gradle release config** aplicado no build via patch (já que `android/` é regenerado a cada CI).
4. **`capacitor.config.ts` + versão** ajustados pra release (`versionName 1.0.0`, `versionCode 1`).
5. **Lista enxuta** dos secrets pra adicionar no GitHub e do roteiro Play Console.

Depois disso, **3 passos manuais inevitáveis** sobram pra você:

- Adicionar 4 secrets no GitHub (eu te dou os valores prontos pra colar).
- Criar a release tag (`v1.0.0`).
- Baixar o `.aab` do Actions e subir na Play Console (+ preencher ficha da loja).

---

## O que vou fazer

### 1. Gerar a keystore

Rodar `keytool` aqui no sandbox:

```text
arquivo:   /mnt/documents/qapqrv-release.jks
alias:     qapqrv
validade:  10000 dias (~27 anos)
algoritmo: RSA 2048
DN:        CN=QAP QRV, O=QAP QRV, C=BR
senha:     32 caracteres aleatórios (mesma pra store e key)
```

Output entregue como `<presentation-artifact>`:
- `qapqrv-release.jks` (binário, ~2-3 KB)
- `qapqrv-release-credentials.txt` (alias + senha + base64 do .jks pra colar no secret)

⚠️ **Aviso forte ao usuário no final do plano**: se essa keystore for perdida, a Play Store **nunca mais aceita atualizações** desse app (precisaria republicar com outro applicationId, perdendo todos os usuários e avaliações).

### 2. Novo workflow `.github/workflows/build-aab-release.yml`

Dispara em `push tags v*` e manualmente. Mantém o atual `build-apk.yml` (debug pra testes locais).

Pipeline:
1. checkout + bun + Java 21 + Android SDK
2. `bun install --frozen-lockfile`
3. `bun run build` (gera `dist/`)
4. `bunx cap add android` (se faltar) + `bunx capacitor-assets generate --android`
5. `bunx cap sync android`
6. `bash android-plugin/install.sh`
7. Patch `AndroidManifest.xml` com `APPLICATION_ID` do AdMob (igual ao workflow atual)
8. **Decodificar keystore** do secret `ANDROID_KEYSTORE_BASE64` em `android/app/qapqrv-release.jks`
9. **Patch do `android/app/build.gradle`** injetando bloco `signingConfigs.release` que lê das envs `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD` e setando `buildTypes.release.signingConfig`
10. **Patch do `android/app/build.gradle`** sobrescrevendo `versionCode 1` e `versionName "1.0.0"`
11. `./gradlew bundleRelease --no-daemon`
12. `upload-artifact` do `app-release.aab` (retenção 90 dias)

Patch do build.gradle feito via `sed` no workflow (assim funciona mesmo com `android/` regenerada).

### 3. Capacitor + tela inicial

- `capacitor.config.ts` sem mudanças funcionais (appId `br.com.qapqrv.app` já está correto pra Play Store).
- Não mexer no SplashScreen / AdMob (já configurados).

### 4. Documentação

Atualizar `APK-BUILD.md` adicionando seção **"Publicar na Play Store (AAB assinado)"** com:
- Como adicionar os 4 secrets no GitHub (passo-a-passo com prints textuais).
- Como criar tag de release (`git tag v1.0.0 && git push --tags` ou via UI do GitHub).
- Como baixar o AAB do Actions.
- Roteiro mínimo Play Console: criar app → upload AAB no canal "Produção" ou "Teste interno" → preencher ficha → enviar pra revisão.

---

## Secrets que VOCÊ adiciona no GitHub

Repositório → **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Valor |
|------|-------|
| `ANDROID_KEYSTORE_BASE64` | conteúdo do arquivo `qapqrv-release-credentials.txt` (linha `KEYSTORE_BASE64=`) |
| `KEYSTORE_PASSWORD` | senha gerada (linha `KEYSTORE_PASSWORD=`) |
| `KEY_ALIAS` | `qapqrv` |
| `KEY_PASSWORD` | mesma senha (linha `KEY_PASSWORD=`) |

---

## Roteiro Play Console (manual, depende de você)

1. Criar conta Play Console (US$ 25, uma vez na vida).
2. Criar app → idioma pt-BR → nome "QAP, QRV!" → gratuito.
3. **Ficha da loja**: descrição curta, descrição completa, ícone 512×512, gráfico de destaque 1024×500, ≥2 capturas de tela do app.
4. **Classificação etária**: responder questionário (IARC).
5. **Privacidade**: link pra `/privacidade` do app já está ok.
6. **Anúncios**: marcar "Sim, meu app contém anúncios" (você usa AdMob).
7. **Público e conteúdo**: público-alvo, app destinado a crianças? Não.
8. **Test interno** (recomendado primeiro): criar release → upload `app-release.aab` → adicionar e-mails de testadores → enviar.
9. Depois de testar OK: promover pra **Produção** → enviar pra revisão (3 a 7 dias).

---

## Arquivos tocados

**Novo**
- `.github/workflows/build-aab-release.yml`

**Editado**
- `APK-BUILD.md` (nova seção "Publicar na Play Store")

**Gerado fora do repo (artefato pra download)**
- `/mnt/documents/qapqrv-release.jks`
- `/mnt/documents/qapqrv-release-credentials.txt`

**NÃO mexido**
- `capacitor.config.ts` (já correto)
- `android-plugin/*` (já correto)
- workflow `build-apk.yml` (continua gerando APK debug pra teste local)

---

## Aviso crítico final

A keystore `.jks` é **única e insubstituível**. Faça pelo menos 2 backups em locais separados (Google Drive privado + pendrive físico, por exemplo) **assim que baixar**. Sem ela você perde controle sobre as atualizações do app na Play Store pra sempre.
