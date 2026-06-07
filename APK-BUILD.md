# Gerar APK (sem Android Studio)

O APK é compilado automaticamente pelo **GitHub Actions** (`.github/workflows/build-apk.yml`).
O app usa um **WebView interno nativo** — não abre navegador externo nem usa Custom Tabs,
contornando bloqueios de navegadores externos à intranet PMESP.

---

## Passo a passo

### 1. Conectar o projeto Lovable ao GitHub

No editor Lovable: menu **+ (Plus)** no canto inferior do chat → **GitHub** → **Connect project**.
Autorize o app e crie o repositório. A partir daí, todo commit no Lovable vai automaticamente
pro GitHub.

### 2. Disparar o build

Existem 3 formas — qualquer uma funciona:

- **Automático:** todo push na branch `main` dispara o build.
- **Manual:** vá no repositório no GitHub → aba **Actions** → workflow **Build Android APK**
  → botão **Run workflow** → **Run workflow**.
- **Após qualquer alteração no Lovable:** o Lovable faz push sozinho → o build roda sozinho.

### 3. Baixar o APK

1. Repositório no GitHub → aba **Actions**
2. Clique no run mais recente do **Build Android APK** (aguarde ficar ✅ verde, ~5-8 min)
3. Role até **Artifacts** no final da página
4. Baixe **qapqrv-debug-apk** (arquivo `.zip` contendo `app-debug.apk`)
5. Extraia o `.zip`, transfira o `app-debug.apk` pro celular e instale

### 4. Instalar no celular

1. No Android, habilite **Fontes desconhecidas** / **Instalar apps de fonte desconhecida**
   para o app que vai abrir o APK (ex.: navegador ou gerenciador de arquivos).
2. Toque no arquivo `.apk` → **Instalar**.
3. Pronto. O ícone do **QAP, QRV!** aparece na tela inicial.

---

## Atualizar o app

Sempre que você publicar uma nova versão no Lovable:
1. O push automático pro GitHub dispara o workflow.
2. Baixe o APK novo da aba **Actions** e reinstale por cima da versão antiga.
   (Não precisa desinstalar — o Android atualiza por cima.)

---

## Observações técnicas

- **APK debug**, não release — instala sem precisar de Play Store.
- **Navegador interno com motor Mozilla GeckoView** (mesmo motor do Firefox).
  Não depende do Android System WebView nem do Chrome do aparelho — resolve
  a tela branca em celulares onde esses componentes estão bloqueados ou
  desatualizados. Toda navegação a iNotes, intranet PMESP, Folha de Pagamento
  e Marcar/Desmarcar acontece dentro do app.
- **Tamanho do APK maior** (~60-80 MB) porque o motor GeckoView é embutido.
  Isto é esperado e necessário para independer do Chrome.
- **Ícone e splash:** gerados automaticamente a partir de `resources/icon.png`,
  `resources/icon-foreground.png`, `resources/icon-background.png` e
  `resources/splash.png` durante o build.
- **Não precisa de Android Studio nem de SDK local** — tudo roda na nuvem do
  GitHub Actions.

---

# Publicar na Play Store (AAB assinado)

A publicação na Google Play exige um **Android App Bundle (`.aab`)** assinado
com sua keystore privada. O workflow `.github/workflows/build-aab-release.yml`
faz isso automaticamente toda vez que você criar uma tag `v*` no GitHub.

## 1. Adicionar os 4 secrets no GitHub

No repositório no GitHub vá em
**Settings → Secrets and variables → Actions → New repository secret**
e crie **um secret pra cada linha** abaixo (os valores estão no arquivo
`qapqrv-release-credentials.txt` que você baixou junto com a keystore):

| Nome do secret            | Valor                                                                 |
|---------------------------|-----------------------------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64` | linha `ANDROID_KEYSTORE_BASE64=` do `qapqrv-release-credentials.txt`  |
| `KEYSTORE_PASSWORD`       | linha `KEYSTORE_PASSWORD=` do mesmo arquivo                           |
| `KEY_ALIAS`               | `qapqrv`                                                              |
| `KEY_PASSWORD`            | linha `KEY_PASSWORD=` do mesmo arquivo                                |

> ⚠️ A keystore (`qapqrv-release.jks`) é **única e insubstituível**. Faça pelo
> menos **dois backups** em locais separados (Google Drive privado + pendrive
> físico, por exemplo). Sem ela, você nunca mais consegue atualizar o app
> na Play Store — teria que republicar com outro `applicationId` e perderia
> todos os usuários e avaliações.

## 2. Criar a tag de release

Pelo terminal (no clone local):
```bash
git tag v1.0.0
git push origin v1.0.0
```

Ou direto pelo GitHub: **Releases → Draft a new release → Choose a tag →
`v1.0.0` → Create new tag on publish → Publish release**.

## 3. Baixar o AAB assinado

1. No GitHub → aba **Actions**
2. Abra o run mais recente de **Build Android AAB (Release)**
3. Aguarde ficar ✅ verde (~8-12 min)
4. Role até **Artifacts** → baixe **qapqrv-release-aab**
5. Extraia o `.zip` → arquivo final: `app-release.aab`

## 4. Subir na Play Console

1. https://play.google.com/console (conta de US$ 25, uma vez na vida)
2. **Criar app** → idioma `pt-BR` → nome **QAP, QRV!** → gratuito
3. **Configurações da loja**: descrição curta + completa, ícone 512×512,
   gráfico de destaque 1024×500, ≥2 capturas de tela
4. **Classificação etária**: responder o questionário IARC
5. **Privacidade**: link da política → use `https://qapqrv.lovable.app/privacidade`
6. **Anúncios**: marcar **Sim, contém anúncios** (AdMob)
7. **Público e conteúdo**: público-alvo adulto (não voltado pra crianças)
8. **Teste interno** (recomendado): **Versão → Teste interno → Criar versão →**
   upload `app-release.aab` → adicionar e-mails de testadores → **Enviar**
9. Depois de testar OK: promover pra **Produção** → enviar pra revisão (3 a 7 dias)

## Atualizar versões

A cada nova publicação, é obrigatório **aumentar** o `versionCode` (1 → 2 → 3…).
O workflow atual usa `versionCode 1` / `versionName "1.0.0"`. Pra próximas
versões, edite as duas linhas `sed -i 'versionCode ...'` /
`sed -i 'versionName ...'` em `.github/workflows/build-aab-release.yml`,
ou troque pra usar `${{ github.run_number }}` no `versionCode`.
