## Botão "Manual" + página de manual detalhado

### O que será criado
Um novo botão **"Manual"** na tela inicial (e no menu lateral) que abre uma página com um manual completo, escrito em linguagem simples para usuários leigos, explicando passo a passo cada função do app.

### Conteúdo do manual (seções)
1. **Boas-vindas** — para que serve o app QAP, QRV!.
2. **Primeiros passos** — instalar como APK/PWA, abrir, permissões.
3. **Tela inicial** — explicação de cada bloco:
   - Marcar / Desmarcar Dejem/Delegada
   - Email iNotes
   - Calendário
   - Escalas baixadas (somente APK)
   - Guia AnyConnect
   - Folha de Pagamento
   - Campo de consulta de escala por ID
4. **VPN AnyConnect** — por que é necessária, como conectar passo a passo, como abrir pelo botão do app.
5. **Calendário e marcações** — como adicionar, editar e remover plantões; como funciona o histórico.
6. **Escalas baixadas (APK)** — onde ficam, como reabrir offline.
7. **Folha de Pagamento** — como acessar e dicas de login.
8. **Email iNotes** — como acessar.
9. **Ferramentas** — Consulta de Escala e Minha Localização.
10. **Tema claro/escuro** — como alternar.
11. **Menu lateral** — atalhos disponíveis.
12. **Privacidade e dados** — onde ficam os dados (somente no aparelho) e link para a política.
13. **Solução de problemas** — "página não abre", "VPN não conecta", "iNotes fica carregando", "Folha abre em desktop", etc.
14. **Contato/suporte** — orientação final.

### Arquivos a criar/alterar
- **Criar** `src/routes/manual.tsx` — nova rota `/manual` com layout consistente (header, dark mode, cards de seção, navegação por âncoras).
- **Editar** `src/routes/index.tsx` — adicionar bloco "Manual" (ícone `BookOpenCheck` ou `HelpCircle`) que navega para `/manual`.
- **Editar** `src/components/side-drawer.tsx` — adicionar item "Manual" no grupo de ajuda, junto ao "Guia AnyConnect".

### Detalhes técnicos
- Rota TanStack Start padrão `createFileRoute("/manual")` com `head()` (title + description SEO).
- Estrutura semântica: `<h1>` único, `<section>` com `<h2>`, sumário no topo com links âncora `#secao`.
- Usa tokens de tema existentes (`bg-[#f1f5fb] dark:bg-[#050b18]`, gradients `var(--gradient-primary)`).
- Sem dependências novas; ícones do `lucide-react` já instalado.
- Sem alteração de backend.