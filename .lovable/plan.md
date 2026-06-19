## Por que o AdSense recusou

O motivo mais comum (e que se aplica direto ao seu site) é **"Conteúdo insuficiente / sem valor"** combinado com problemas técnicos que impedem o robô do Google de ver as páginas. Pontos identificados auditando o projeto:

1. **Redirecionamento forçado para `/onboarding`** logo na 1ª visita (em `src/routes/__root.tsx`). Como o Googlebot sempre é "1ª visita", ele vê apenas a tela de boas-vindas — não acha conteúdo real → reprovação automática.
2. **Política de Privacidade não menciona AdSense / cookies de anúncios / terceiros** — exigência explícita do programa. A página atual (`public/privacidade.html` e `/sobre`) fala genericamente, sem citar Google, DoubleClick, cookies de personalização, opt-out, nem GDPR/LGPD.
3. **Falta de páginas com conteúdo informativo público**. Quase tudo do app exige VPN da intranet PMESP ou é ferramenta interativa que o robô não consegue usar. AdSense quer artigos / textos com valor independente.
4. **Sem página de Contato dedicada** e a página "Sobre" tem apenas ~40 linhas — insuficiente para "About" no padrão AdSense.
5. **Anúncios já implementados antes da aprovação**: os slots `<ins class="adsbygoogle">` aparecem como placeholder "Espaço publicitário". O Google reprova quando vê inventário de anúncio sem conteúdo ao redor. Precisamos **desligar o carregamento do AdSense até aprovar** (mantendo só o `ads.txt` e o snippet de verificação).
6. **SPA sem SSR**: o robô do AdSense é menos tolerante que o Googlebot Search. Garantir que `index.html` traga conteúdo textual mínimo (título + descrição + links para as principais páginas) no HTML estático ajuda muito.

## O que vou fazer

### 1. Não bloquear o robô na onboarding
- Em `src/routes/__root.tsx`, só redirecionar para `/onboarding` quando **não** for um bot. Detectar via `navigator.userAgent` (Googlebot, Mediapartners-Google, AdsBot-Google, bingbot etc.) e pular o redirect nesse caso.

### 2. Política de Privacidade compliant com AdSense
Reescrever `public/privacidade.html` e `src/routes/privacidade.tsx` para incluir, no mínimo:
- Quais dados são coletados (localStorage, push, logs).
- **Uso de Google AdSense / AdMob**: cookies DoubleClick (DART), publicidade personalizada, link para [políticas do Google](https://policies.google.com/technologies/ads), opt-out via [adssettings.google.com](https://adssettings.google.com).
- Provedores terceiros (Supabase / Lovable Cloud).
- Direitos LGPD/GDPR, contato.
- Data da última atualização.

### 3. Página "Sobre" e "Contato" mais robustas
- Expandir `src/routes/sobre.tsx`: missão do app, público, funcionalidades, equipe/autor, e-mail de contato, link para política e termos.
- Criar `src/routes/contato.tsx` com formulário simples (`mailto:` é suficiente) + informações de contato.
- Criar `src/routes/termos.tsx` (Termos de Uso) — AdSense recomenda.

### 4. Conteúdo público com valor (3-4 artigos)
Criar uma seção `/blog` simples com posts em MDX/TSX estáticos, relevantes ao público (policial militar SP):
- "Como funciona a escala Dejem na PMESP"
- "Diferença entre Dejem e Delegada"
- "Dicas de organização de plantão"
- "Como usar VPN AnyConnect com segurança"

Cada artigo: 600–1200 palavras, headings, sem placeholder. Listar no menu lateral e no `sitemap.xml`.

### 5. Suspender o carregamento do AdSense até aprovar
- Em `src/routes/__root.tsx`, comentar/condicionalizar o `loadAds()` por flag de env `VITE_ADSENSE_ENABLED`. Default `false`.
- Em `src/components/adsense-banner.tsx`, retornar `null` quando flag desligada (não renderizar `<ins>` nem placeholder).
- **Manter** `public/ads.txt` e a meta-tag de verificação do site (se houver) para o Google poder validar a propriedade.

### 6. Melhorar `index.html` para o crawler
- Conteúdo textual mínimo dentro de `<body>` (acima do `<div id="root">`) com `<h1>`, breve descrição e links para `/`, `/sobre`, `/manual`, `/privacidade`, `/blog`. Some por `display:none` no JS após hidratação se quiser, mas o HTML estático precisa ter texto.
- Trocar `og:image` por imagem real do app (não só o ícone PNG 512).

### 7. Atualizar `sitemap.xml` e `robots.txt`
- Adicionar `/contato`, `/termos`, `/blog` e os posts.
- Manter `Allow: /` no robots.

### 8. Banner de consentimento de cookies (LGPD)
- Verificar `src/components/privacy-consent.tsx`; se já existe, garantir que mencione "anúncios personalizados" e dê opção de recusar — exigido pelo Google Consent Mode v2 para tráfego brasileiro/UE.

## O que **não** vou mexer
- Lógica do APK Android, AdMob nativo, workflow GitHub Actions, build, Capacitor.
- Funcionalidades existentes (escalas, intranet, calendário).

## Detalhes técnicos

```text
Arquivos novos
  src/routes/contato.tsx
  src/routes/termos.tsx
  src/routes/blog.tsx              (índice)
  src/routes/blog.$slug.tsx        (post dinâmico, dados em src/lib/blog.ts)
  src/lib/blog.ts                  (array de posts estáticos)

Arquivos alterados
  index.html                       (conteúdo textual estático + og:image)
  public/privacidade.html          (texto AdSense-compliant)
  public/sitemap.xml               (novas URLs)
  src/routes/__root.tsx            (skip onboarding p/ bot, gate AdSense)
  src/routes/sobre.tsx             (expandir)
  src/routes/privacidade.tsx       (texto AdSense-compliant)
  src/components/adsense-banner.tsx (gate via env)
  src/components/privacy-consent.tsx (texto cookies de anúncio)
  .env                              (VITE_ADSENSE_ENABLED=false default)
```

## Depois de aplicar
1. Publicar (`Publish`).
2. Aguardar 24h para o Google reindexar.
3. **Reenviar o site para análise** no painel do AdSense.
4. Quando aprovar, mudar `VITE_ADSENSE_ENABLED=true` e republicar.

Posso prosseguir?
