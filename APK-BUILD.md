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

- **APK debug**, não release — instala sem precisar de Play Store, mas o Android
  marca como "app de origem desconhecida". Para release assinado oficial seria
  necessário gerar uma keystore e adicionar como secret do GitHub.
- **Sem navegador externo embutido:** o app usa o `WebView` do Android (renderiza HTML
  internamente). Toda navegação à intranet PMESP, SEI e iNotes passa por dentro
  do app com User-Agent próprio do navegador interno, sem abrir outro aplicativo.
- **Ícone e splash:** gerados automaticamente a partir de `resources/icon.png`,
  `resources/icon-foreground.png`, `resources/icon-background.png` e
  `resources/splash.png` durante o build.
- **Não precisa de Android Studio nem de SDK local** — tudo roda na nuvem do
  GitHub Actions, gratuito para repositórios públicos e com 2.000 min/mês
  grátis para privados.
