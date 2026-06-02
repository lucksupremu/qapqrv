## Objetivo

Refatorar `src/routes/manual.tsx` para ficar coerente com o app real (versão web e APK), uniformizar as credenciais e remover seções que não correspondem a botões visíveis na tela inicial.

## Incoerências encontradas

1. **Credenciais misturadas** — a seção VPN diz "CPF + senha Procedimentos", mas as seções 5 (Marcar), 9 (Folha) e 10 (iNotes) ainda dizem "RG e senha da intranet" / "RG funcional + senha CIAF" / "usuário e senha do iNotes". Pelo confirmado: **tudo usa CPF + senha da aba Procedimentos**.
2. **Seção 3 (Tela inicial)** descreve áreas que não batem 100% com a home atual — falta o **chip "VPN Ativa/Off"** e o **aviso vermelho "Conectar VPN — acesso às escalas"** que aparecem dentro do card de consulta no APK.
3. **Seção 11 (Ferramentas)** lista "Consulta de Escala" e "Minha Localização" como se houvesse um menu de Ferramentas — mas a home não tem esse botão e `tools.ts` só tem `consulta-escala`. Confunde o usuário leigo.
4. **Ordem** das seções não segue o fluxo da tela (Consulta aparece depois de Marcar, sendo que é a primeira coisa da home).
5. **Seção 13 (Menu lateral)** não menciona o botão "Instalar app" nem o toggle de tema que vivem no drawer.
6. **Seção 2 (PWA iPhone)** — manter, mas deixar claro que o APK é só Android.
7. Texto de boas-vindas no sumário ainda diz "toque para ir direto" — agora os cards expandem inline, então ajustar.

## Mudanças (somente UI/conteúdo de `src/routes/manual.tsx`)

### Reordenar e renomear seções (16 → 14, mais lógicas)

```text
1.  Boas-vindas
2.  Primeiros passos (APK Android / PWA Android+iPhone)
3.  Tela inicial — o que é cada coisa
4.  VPN AnyConnect — obrigatória pra tudo
5.  Consulta de escala por ID
6.  Marcar / Desmarcar Dejem-Delegada
7.  Calendário e histórico de plantões
8.  Escalas baixadas (somente APK)
9.  Folha de Pagamento (CIAF)
10. Email iNotes
11. Menu lateral, tema e instalação
12. Privacidade e dados
13. Solução de problemas
14. Suporte
```

Fundir "Tema claro/escuro" e "Menu lateral" em uma única seção (11), e remover "Ferramentas" (a Consulta de Escala já tem seção própria, e Minha Localização vira nota dentro de "Menu lateral").

### Padronizar credenciais em todas as seções de intranet

Criar um componente reutilizável `BoxLogin` no próprio arquivo que renderiza um card destacado com:

> **Usuário:** seu CPF (somente números)
> **Senha:** a mesma da aba **Procedimentos** da intranet PMESP

Usar nas seções 4 (VPN — adiciona o Grupo 13), 5 (Consulta), 6 (Marcar), 9 (Folha) e 10 (iNotes). Isso elimina as variações "RG / RG funcional / usuário iNotes".

### Reescrever Seção 3 (Tela inicial) fiel à home

Descrever de cima pra baixo o que o usuário realmente vê:

1. **Topo:** logo, botão sol/lua (tema) e ícone ☰ (menu).
2. **Banner "Instalar app"** (aparece no navegador quando dá pra instalar como PWA).
3. **Card "Consulta escala Dejem/Delegada"** com campo de ID, botão amarelo de seta e — no APK — chip verde "VPN Ativa" ou aviso vermelho "Conectar VPN — acesso às escalas" com botão "Abrir Cisco AnyConnect".
4. **Próximas Escalas** — lista das 5 próximas com etiqueta "Hoje / Amanhã / Em N dias".
5. **Acesso Rápido** — grid com Marcar/Desmarcar, iNotes, Calendário, Escalas Baixadas (APK), Guia AnyConnect, Folha, Manual.
6. **Minha Escala** — calendário visual do mês.
7. Rodapé com link da Política de Privacidade.

### Atualizar Seção 4 (VPN)

Mencionar explicitamente o **chip "VPN Ativa / VPN Off"** no card de consulta e o botão "Abrir Cisco AnyConnect" do aviso vermelho como atalho equivalente ao "Guia AnyConnect".

### Limpar Seção 13 (problemas)

Remover repetições e adicionar:
- "Aparece 'VPN Off' em vermelho" → conectar AnyConnect e usar "Verificar conexão".
- "Botão da home não abre nada" → garantir que o app está atualizado e a VPN ativa.

### Ajustes no sumário

Trocar texto "Toque em uma seção abaixo para ir direto ao tópico" por "Toque em uma seção para abrir o conteúdo." (mais condizente com o comportamento colapsável).

## Arquivos alterados

- `src/routes/manual.tsx` — reescrita das seções e adição do componente interno `BoxLogin`. Sem mudança em rotas, ícones do home, drawer ou backend.
