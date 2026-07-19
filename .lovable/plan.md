## Objetivo

Na versão web, esconder recursos que só funcionam no APK, deixando a Home limpa e sem promessas quebradas. No APK, tudo continua igual.

## O que é exclusivo do APK (esconder na web)

Recursos que dependem de plugins nativos e não funcionam no navegador:

- **Marcar / Desmarcar Dejem/Delegada** — depende de VPN/intranet PMESP, que praticamente só funciona via o WebView interno do APK
- **Email iNotes** — mesmo motivo (intranet + WebView com UA mobile)
- **Escalas Baixadas** — já é `nativeOnly`
- **Folha de Pagamento** — intranet PMESP, mesmo caso
- **Consulta de escala por ID** (card do topo) — depende de VPN + download de PDF nativo
- **Chip/aviso de VPN** (`InlineVpnChip` e `VpnDetailRow`) — só faz sentido no APK
- **Banner "Conectar VPN"** — idem

Recursos que continuam na web:
- **Minha Escala** (calendário local, funciona 100% offline no navegador)
- **Vídeo tutorial ANYCONECT** e **PVT** (links externos)
- Menu lateral, tema, conteúdos, blog, etc.

## Mudanças

### 1. `src/routes/index.tsx`

- **Card de consulta de escala** (seção com input "Insira o ID da Escala", chip VPN, banner VPN): envolver em `{native && ( ... )}`. Na web some por completo.
- **Grid Acesso Rápido**: filtrar itens marcando com `nativeOnly: true` os que dependem de intranet (Marcar/Desmarcar, Email iNotes, Folha de Pagamento). O filtro existente `native || !nativeOnly` já cuida do resto.
- Na web sobram apenas: **Vídeo tutorial ANYCONECT** e **PVT**. Como só 2 blocos ficariam meio soltos, renomeio o título da seção para **"Links úteis"** quando `!native`, mantendo "Acesso Rápido" no APK.
- Se `!native`, promovo a seção **"Minha Escala"** para logo abaixo do header (fica como a peça central da home web).

### 2. `src/components/bottom-nav.tsx`

- Item **"Escalas"** (Escalas Baixadas) só aparece no APK — envolver com `useIsNative`. Na web, mostrar 3 itens: Início, Agenda, Menu.

### 3. `src/components/side-drawer.tsx`

- Já filtra `grupo1NativeOnly` (Escalas Baixadas) por `native`. Sem mudança.
- Nenhuma mudança nos demais itens do menu — todos funcionam na web ou já têm tratamento próprio.

### 4. Textos / meta

- Sem mudança na meta description da Home — continua válida para ambas as versões.

## Fora de escopo

- Não mexo em lógica de VPN, download de PDF, calendário ou notificações.
- Não crio página comparativa "Web x APK" nem badges (usuário escolheu esconder, não sinalizar).
- Não altero paleta, tipografia ou layout dos cards restantes.

## Verificação

Após implementar:
1. Screenshot da Home no preview web (deve mostrar apenas: header, Minha Escala, seção com PVT + Vídeo ANYCONECT, sem card de consulta, sem chip VPN).
2. Confirmar via `rg` que todas as referências `nativeOnly` estão consistentes.
3. Rodar build (`tsgo`) para garantir tipos.
