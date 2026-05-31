# Redesign da interface — Midnight Indigo

Atualização visual completa do app mantendo todas as funcionalidades atuais (home, guia AnyConnect, credenciais, navegador interno, drawer lateral). Foco em uma estética moderna, escura, profissional, mobile-first, com tipografia Sora/Manrope e paleta indigo profundo.

## Direção visual

- **Paleta (oklch em `src/styles.css`)**
  - `--background`: indigo quase-preto `#0a0a1a`
  - `--card` / superfícies elevadas: `#141432` com leve gradiente
  - `--border`: indigo translúcido sobre superfície
  - `--primary`: `#4f46e5` com `--primary-glow` mais claro para gradientes
  - `--accent`: variante indigo `#1e1e5a`
  - `--muted-foreground`: cinza-azulado para textos secundários
  - Tokens novos: `--gradient-primary`, `--gradient-surface`, `--shadow-elegant`, `--shadow-glow`
- **Tipografia**
  - Sora (600/700) para títulos via `<link>` Google Fonts no `__root.tsx`
  - Manrope (400/500/600) para corpo
  - Mapear em `src/styles.css` como `--font-display` e `--font-sans` e aplicar via Tailwind v4 `@theme`
- **Composição**: layout single-column centrado, largura máx ~520px no mobile, generoso espaçamento vertical, hierarquia clara
- **Profundidade**: cards com borda 1px translúcida + sombra suave + gradiente sutil de superfície; botão primário com gradiente indigo e glow no hover
- **Motion**: micro animações com framer-motion (já instalado) — fade/slide-up dos cards na entrada da home, tap scale nos botões, transição suave do drawer

## Telas afetadas

1. **Home (`src/routes/index.tsx`)**
   - Header com logo/título em Sora, subtítulo discreto
   - Card hero com botão primário grande (conectar/ação principal) com gradiente
   - Lista de atalhos como cards uniformes em coluna única (AnyConnect, Credenciais, etc.)
   - Animação de entrada escalonada
2. **Drawer lateral (`src/components/side-drawer.tsx`)**
   - Fundo `--card` com blur, borda indigo, itens com ícone + label em Manrope, item ativo com pill indigo
3. **Guia AnyConnect (`src/routes/anyconnect.tsx`)**
   - Mantém imagens do passo a passo (sem alteração de conteúdo)
   - Atualiza chrome: header sticky translúcido, indicador de passo redesenhado (dots + número), botões de navegação com novo estilo, texto do passo em card com tipografia nova
4. **Credenciais (`src/routes/credenciais.tsx`)**
   - Inputs com novo estilo (fundo `--card`, borda sutil, foco com ring indigo)
   - Botões com gradiente primário
5. **PIN modal (`src/components/pin-modal.tsx`)**
   - Visual atualizado com mesma linguagem (card escuro, dots de PIN destacados, botões numéricos com hover/tap states)
6. **Root layout (`src/routes/__root.tsx`)**
   - `<link>` Google Fonts (Sora + Manrope)
   - Meta theme-color = `#0a0a1a`
   - Body com background base e classe de fonte padrão

## Fora do escopo

- Nenhuma mudança de lógica, rotas, backend, navegador interno, Capacitor, fluxo de credenciais ou conteúdo do guia
- Sem regenerar imagens do AnyConnect
- Sem adicionar novas páginas ou funcionalidades

## Detalhes técnicos

- Tokens em `oklch()` no `:root` de `src/styles.css`; expor utilitários via `@theme` do Tailwind v4 (`--color-primary`, `--color-card`, `--font-display`, etc.)
- Reaproveitar componentes shadcn existentes; criar variante `premium` no Button (gradiente + shadow-glow) via `cva`
- Não usar classes de cor cruas (`bg-black`, `text-white`); somente tokens semânticos
- Garantir contraste AA em fundo escuro
- framer-motion já está nas deps; usar `motion.div` com `initial/animate` discretos para não pesar
