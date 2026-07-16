O usuário quer reorganizar dois itens de navegação:

1. **Manual** deve aparecer no menu hamburger do topo (Sheet do `AppHeader`), mantendo o ícone `BookOpenCheck`.
2. **PVT** deve ocupar o lugar do Manual no drawer lateral (`SideDrawer`), com link externo `https://ead.pmesp.org/login/index.php` e abertura em navegador externo.

### Alterações propostas

#### 1. `src/components/app-header.tsx`
Adicionar o item **Manual** na lista de links do Sheet que abre pelo botão ☰ no topo esquerdo.

- Incluir a importação do ícone `BookOpenCheck` do `lucide-react`.
- Adicionar `{ to: "/manual", label: "Manual" }` ao array de navegação do Sheet, posicionado junto com Início, Favoritos e Histórico.
- Manter o comportamento atual de fechar o Sheet ao clicar.

#### 2. `src/components/side-drawer.tsx`
Substituir o item **Manual** por **PVT** no grupo inferior do drawer (onde hoje está Configurações / Manual / Vídeo tutorial / Privacidade).

- Trocar o item do tipo route `/manual` para um item do tipo external:
  - `href: "https://ead.pmesp.org/login/index.php"`
  - `label: "PVT"`
  - ícone: `GraduationCap` (ou outro ícone apropriado para treinamento/ead)
- Manter `target="_blank"` e `rel="noopener noreferrer"` para abrir em navegador externo.
- Ajustar a importação de ícones: remover `BookOpenCheck` se não for mais usado no drawer e adicionar `GraduationCap`.

### Resultado esperado
- Menu hamburger do topo: Início, Favoritos, Histórico, **Manual**, Sobre.
- Drawer lateral (botão "Menu" da barra inferior): continua com Configurações, **PVT**, Vídeo tutorial ANYCONNECT, Política de Privacidade.
- Bottom nav e outras rotas não são alteradas.
