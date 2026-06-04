# Build do APK (Android Studio / AI Studio)

Este projeto roda como web/PWA no Lovable **e** como APK Android via
Capacitor. A pasta `android/` **não fica versionada** — ela é gerada
localmente na sua máquina (ou no AI Studio) com os passos abaixo.

## Pré-requisitos

- Node 20+ e npm
- Android Studio (com SDK 34+) ou AI Studio
- JDK 17

## Passo a passo (do zero ao APK)

```bash
# 1. Instalar deps
npm install

# 2. Build web (gera dist/)
npm run build

# 3. Adicionar plataforma Android (só na 1ª vez)
npx cap add android

# 4. Sincronizar web + gerar ícones/splash a partir de resources/
npm run cap:sync
```

O comando `cap:sync` faz três coisas:
1. `npm run build` — gera o `dist/`
2. `npx cap sync android` — copia o web para o projeto Android e atualiza plugins
3. `npm run cap:assets` — gera **todos** os ícones (mipmap-*, adaptive icon)
   e o splash screen a partir de `resources/icon*.png` e `resources/splash*.png`.

Depois, abra no Android Studio e gere o APK:

```bash
npx cap open android
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

Ou via linha de comando:

```bash
cd android && ./gradlew assembleRelease
# APK em: android/app/build/outputs/apk/release/
```

## Plugin nativo VpnStatus (opcional)

Se quiser detecção offline de VPN, veja [android-plugin/README.md](android-plugin/README.md).

## Ícone e splash

Editáveis em `resources/`:
- `icon.png` — 1024×1024 opaco (ícone principal/legacy)
- `icon-foreground.png` — 1024×1024 transparente (camada da frente do adaptive icon)
- `icon-background.png` — 1024×1024 cor sólida (camada de fundo do adaptive icon)
- `splash.png` / `splash-dark.png` — 2732×2732 (splash screen)

Para regenerar depois de trocar a logo:
```bash
npm run cap:assets
```

## Navegador interno (intranet PMESP)

Toda navegação para sistemas PMESP (`policiamilitar.sp.gov.br`, intranet,
SEI, Correio iNotes, etc.) é aberta na **WebView interna do app** (plugin
`@capacitor/inappbrowser`), nunca no Chrome / Custom Tabs do sistema —
isso é proposital, pois o Chrome do dispositivo está bloqueando o acesso a
esses sites. O User-Agent enviado é de Android Chrome 120 Mobile, então o
servidor aceita a requisição normalmente.
