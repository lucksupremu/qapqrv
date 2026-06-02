## Objetivo
Deixar o AdSense 100% operacional, sem duplicação de script e em conformidade com as exigências do Google.

## Mudanças

### 1. Remover script duplicado do `index.html`
Remover as linhas 27–31 do `index.html` (a tag `<script async src="...adsbygoogle.js...">`). O carregamento fica somente no `src/routes/__root.tsx`, que já faz lazy-load via `requestIdleCallback` e pula o carregamento quando rodando como APK nativo (boa prática + evita violação de política do AdSense em WebView).

### 2. Criar `public/ads.txt`
Novo arquivo com o conteúdo exigido pelo Google:
```
google.com, pub-4966192764194561, DIRECT, f08c47fec0942fa0
```
Servido em `https://miketools.top/ads.txt` automaticamente pelo Vite.

### 3. Inserir `<AdSlot />` em telas estratégicas
Inserir um banner discreto, responsivo, com rótulo "Publicidade" acima, em:

- **`/inicio`** — no final da página, antes do `BottomNav` (maior volume de tráfego).
- **`/manual`** — ao final do conteúdo (sessões longas, boa visibilidade).
- **`/sobre`** — no rodapé do conteúdo.

O componente `AdSlot` já existe e usa `AdSenseBanner` com slot `7036302359`. Não é necessário criar slots novos — o mesmo slot responsivo do AdSense pode ser reaproveitado em múltiplas posições.

### 4. Não mexer no APK nativo
O `AdSlot` já detecta `Capacitor.isNativePlatform()` e mostra placeholder do AdMob ali — comportamento preservado.

## Detalhes técnicos
- `index.html`: remover o bloco `<script async src="...adsbygoogle.js?client=ca-pub-4966192764194561" crossorigin="anonymous"></script>` (linhas 27–31).
- `public/ads.txt`: criar com uma única linha de texto puro.
- `src/routes/inicio.tsx`, `src/routes/manual.tsx`, `src/routes/sobre.tsx`: importar `AdSlot` de `@/components/ad-slot` e renderizar `<AdSlot type="banner" />` envolvido em um `<div>` com `aria-label="Publicidade"` e o texto "Publicidade" acima em `text-xs text-muted-foreground`.

## Pontos fora do escopo
- Não cria página nova de política de cookies (já existe `/privacidade`).
- Não habilita Consent Management Platform (CMP) para GDPR — pode ser adicionado depois se você publicar para usuários da UE.
