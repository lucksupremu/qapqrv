# Corrigir rejeição do AdSense

## Diagnóstico

O Google rejeitou por dois motivos combinados:

1. **"Anúncios em telas sem conteúdo do editor"** — o robô do AdSense entra em `https://miketools.top/` (home) e vê uma interface de ferramentas (grid de cards, botões, splash), não um artigo. Mesmo com a `ads-allowlist` restringindo o `<AdSlot>`, o **script `adsbygoogle.js` no `index.html` carrega em todas as rotas**, e o crawler interpreta o site como "app sem conteúdo".
2. **"Conteúdo de baixo valor"** — só temos 4 posts curtos no `/blog`. Para AdSense aprovar um domínio novo, o padrão de fato exigido hoje é **10–20 artigos densos** + páginas institucionais robustas.

Além disso, hoje temos `VITE_ADSENSE_ENABLED` desligado no componente, mas o **script global** e o `ads.txt` continuam sinalizando ao Google que o site pediu monetização — então o robô avalia o site inteiro, não só onde o `<ins>` aparece.

## O que fazer

### 1. Isolar completamente o AdSense até nova submissão
- Remover o `<script async src="adsbygoogle.js">` do `index.html` (se estiver lá) e qualquer inclusão global.
- Só injetar o script **sob demanda**, dentro do `AdSenseBanner`, e só quando `isAdsAllowedRoute(pathname) === true` E `VITE_ADSENSE_ENABLED === "true"`.
- Manter `VITE_ADSENSE_ENABLED=false` até a re-aprovação; assim nenhum request para o AdSense sai do site.
- Manter `ads.txt` (é exigido pelo AdSense; não é violação).

### 2. Reforçar a home para o crawler
- Enriquecer o `#seo-fallback` do `index.html` com 3–4 parágrafos editoriais reais (não só lista de links): explicar o que é a Dejem, a Delegada, o AnyConnect, para quem serve o app.
- Adicionar links diretos e visíveis para `/blog`, `/manual`, `/sobre`, `/privacidade`, `/termos`, `/contato` no fallback.
- Manter o fallback removido só após hidratação do React (já é o comportamento atual).

### 3. Ampliar o blog para 12 posts
Escrever 8 novos artigos densos (mínimo 600 palavras cada, com H2/H3/listas), somando 12 no total. Sugestões de pauta (todas úteis pro público-alvo):

- Como consultar sua escala Dejem passo a passo
- Direitos e deveres na Operação Delegada
- O que é BOU, BOP e como diferenciam-se do BO
- Rotina de higidez física para policial em escala 12x36
- Como configurar a VPN AnyConnect no Android
- Erros mais comuns ao acessar a intranet PMESP
- Como usar o QAP, QRV! offline em áreas sem sinal
- Guia rápido de compartilhamento seguro de escalas

Cada post seguirá o formato já existente em `src/lib/blog.ts` (parágrafos + `{h}` + `{list}`).

### 4. Ampliar páginas institucionais
- `/sobre`: adicionar seções "História do projeto", "Como sugerir uma ferramenta", "FAQ" (6–8 perguntas reais).
- `/manual`: já é grande, apenas garantir que está indexável (checar meta robots).
- `/contato`: adicionar tempo médio de resposta, tipos de solicitação aceitas.
- `/privacidade` e `/termos`: revisar para citar explicitamente uso de Google AdSense/AdMob, cookies, DoubleClick.

### 5. Ajustar `robots.txt` e `sitemap.xml`
- Manter bloqueio das rotas de app (`/splash`, `/onboarding`, `/em-construcao`, `/ferramenta/*` etc — já feito).
- **Garantir** que `/` NÃO está no `Disallow` (o crawler precisa acessar a home; hoje está OK).
- Incluir no `sitemap.xml` só rotas com conteúdo editorial: `/`, `/sobre`, `/manual`, `/blog`, cada `/blog/<slug>`, `/contato`, `/privacidade`, `/termos`.

### 6. Só depois de tudo acima
- Ligar `VITE_ADSENSE_ENABLED=true`.
- Solicitar nova revisão no painel do AdSense.

## Detalhes técnicos

**Arquivos a editar:**
- `index.html` — remover script global do AdSense (se existir), enriquecer `#seo-fallback`.
- `src/components/adsense-banner.tsx` — carregar `adsbygoogle.js` sob demanda com `document.createElement("script")`, apenas quando enabled + rota permitida.
- `src/lib/blog.ts` — adicionar 8 posts novos.
- `src/routes/sobre.tsx` — 3 novas seções (História, Sugerir ferramenta, FAQ).
- `src/routes/contato.tsx` — expandir.
- `src/routes/privacidade.tsx` / `src/routes/termos.tsx` — revisar cláusulas de anúncios/cookies.
- `src/routes/sitemap[.]xml.ts` — reconstituir lista.
- `.env` — deixar `VITE_ADSENSE_ENABLED=false` até re-aprovação.

**Não mudar:**
- Estrutura do app, rotas de ferramenta, plugins nativos, AdMob (APK — política diferente).
- `ads-allowlist.ts` já está correta, apenas manter.

## Não faz parte deste plano

- Redesenhar visualmente qualquer tela.
- Alterar lógica de escala, VPN ou notificações.
- Mudar o AdMob do APK — a rejeição foi só do AdSense web.

## Próxima etapa depois do plano aprovado

Implemento tudo em uma passada, começando pelos 8 posts (é o volume que muda a percepção do crawler) e terminando pelo carregamento condicional do `adsbygoogle.js`.
