## Atualizar IDs do AdMob no APK

Vou trocar os IDs antigos do AdMob pelos novos que você passou. Mudança simples — só substituir constantes.

### Arquivos afetados

1. **`capacitor.config.ts`** (linha 12)
   - `appId` do AdMob: `ca-app-pub-4966192764194561~2515666476` → **`ca-app-pub-9197484743954603~4917243774`**

2. **`src/lib/admob.ts`** (linhas 11–12)
   - `ADMOB_APP_ID` → **`ca-app-pub-9197484743954603~4917243774`**
   - `ADMOB_APP_OPEN_ID` → **`ca-app-pub-9197484743954603/8424254265`**

3. **`android-plugin/AppOpenAdPlugin.kt`** (linha 40)
   - `AD_UNIT_ID` (App Open) → **`ca-app-pub-9197484743954603/8424254265`**

### O que NÃO vou alterar

- **AdSense (web)** em `adsense-banner.tsx` e `__root.tsx` (`ca-pub-4966192764194561`) — é outro produto (anúncios na web), você não passou novo ID.
- **`ADMOB_INTERSTITIAL_ID`** — você não passou ID novo de intersticial e ele já está sem uso no fluxo atual (ver comentário no `admob.ts`). Deixo a constante como está para não quebrar tipos; podemos remover/atualizar quando você gerar esse bloco.

### Lógica do App Open Ad
A lógica nativa já está implementada conforme o guia do Google (cold start + retorno do background, cooldown de 4 min entre exibições, expiração de 4 h do ad carregado, pré-carregamento após dismiss). Não precisa mudar — só os IDs.

Depois é gerar APK novo pra validar.
