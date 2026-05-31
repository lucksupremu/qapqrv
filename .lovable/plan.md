
# QAPQRV — Plano do MVP

App web (TanStack Start) com layout mobile-first, pronto para empacotar em Capacitor e gerar APK. Sem login. Cada ferramenta é um módulo plugável que você expande depois.

## Escopo do MVP

1. **Tela inicial (Início)** — header escuro com logo "QAP, QRV!" (QAP branco, QRV azul), subtítulo, sino de notificações, botão de menu lateral, busca de ferramenta e grid 2 colunas de cards de ferramentas (ícone colorido + título + descrição + seta).
2. **Bottom nav fixo** — Início, Favoritos, Histórico, Sobre.
3. **Splash com anúncio** — tela de abertura que simula o slot do anúncio (placeholder visual). Botão "Continuar" libera o app. No Capacitor, esse slot será substituído pelo AdMob (App Open Ad ou Interstitial).
4. **Páginas de ferramentas (stubs)** — cada card abre uma rota dedicada com header, breadcrumb e área de conteúdo vazia pronta para você implementar a lógica depois.
5. **Favoritos** — usuário marca estrela no card; lista persistida em `localStorage`.
6. **Histórico** — últimas ferramentas abertas, persistido em `localStorage`.
7. **Sobre** — versão do app, créditos, contato, política de privacidade (necessária para Play Store + AdMob).
8. **Menu lateral (drawer)** — links rápidos (Início, Favoritos, Histórico, Sobre, Compartilhar app, Avaliar na Play Store).

Não inclui: backend, login, banco de dados, push real, AdMob real. Tudo isso entra na fase Capacitor.

## Ferramentas iniciais no grid (todas como stub clicável)

- Mapa
- ID de Agenda Ligada
- Biopem-Token (BOPM Token)
- Checklist
- Consultas
- Pessoas
- Escalas
- Documentos
- Relatórios
- Configurações
- Bloco de Notas (novo)
- Minha Localização / GPS (novo)

Cada uma com ícone próprio e cor distinta, seguindo o estilo da imagem.

## Estrutura de rotas

```
/                       -> Splash + anúncio (primeira visita da sessão)
/inicio                 -> Grid de ferramentas (home real)
/favoritos              -> Lista de favoritos
/historico              -> Últimas abertas
/sobre                  -> Sobre + política
/ferramenta/$slug       -> Página genérica de cada ferramenta (stub)
```

A rota `/ferramenta/$slug` lê um registry central de ferramentas. Para adicionar uma ferramenta nova você só edita 1 arquivo (registry) e cria o componente da ferramenta.

## Design

- Tema: header azul-marinho escuro (`#0a1230` aprox.), corpo claro com cards brancos arredondados e sombra suave, ícones em gradient colorido, tipografia bold no título "QAP, QRV!" (QAP branco, QRV azul vibrante). Bottom nav branco com indicador azul no item ativo.
- Mobile-first (390px), expansível para tablet.
- Tokens semânticos em `src/styles.css` (oklch) — sem cores hardcoded nos componentes.

## Persistência

- Favoritos e histórico em `localStorage` (chaves `qapqrv:favorites`, `qapqrv:history`).
- Flag `qapqrv:ad-seen-session` em `sessionStorage` para mostrar o splash/anúncio apenas 1x por abertura.

## Preparação para Capacitor (estrutura, não instalação ainda)

- Slot do anúncio isolado em um componente `<AdSlot type="app-open" />` — depois você troca o placeholder pelo plugin `@capacitor-community/admob`.
- Slot de notificação (sininho) liga a um stub `notifications.ts` — depois conecta `@capacitor/push-notifications`.
- Sem rotas absolutas, sem cookies, sem dependência de servidor — funciona offline empacotado.

## Detalhes técnicos

- TanStack Start + React 19 + Tailwind v4 (já no template).
- File-based routing em `src/routes/` (sem `src/pages/`).
- Registry de ferramentas: `src/lib/tools.ts` exportando array tipado `{ slug, name, description, icon, gradient, component? }`.
- Cada card renderizado a partir do registry — adicionar ferramenta = adicionar 1 item.
- Componentes shadcn já disponíveis (Card, Input, Button, Sheet para drawer).
- `framer-motion` para transição suave do splash → home e hover dos cards.
- SEO básico por rota (title/description) mesmo sendo app — útil pra versão web/iPhone via link.

## O que NÃO entra agora (próximas fases)

- Implementação real de cada ferramenta (você fará uma por uma).
- Empacotamento Capacitor + AdMob + Push (fase 2, quando o MVP web estiver aprovado).
- Política de privacidade real (texto placeholder; você substitui antes de publicar na Play Store).

Aprove para eu construir o MVP com essa estrutura.
