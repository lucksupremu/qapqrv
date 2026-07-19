## Objetivo

Deixar claro para o usuário que:
- O **Calendário da Home** é uma visão rápida (só consulta) dos plantões.
- A **Agenda** é onde ele efetivamente marca Dejem/Delegada e recebe lembretes/notificações.

## Mudanças

### 1. Home (`src/routes/index.tsx`) — seção "Minha Escala"
Substituir o título atual por um bloco com título + subtítulo explicativo + CTA:

- Título: **"Minha Escala"**
- Subtítulo pequeno abaixo: *"Visão rápida dos seus plantões deste mês"*
- Botão/link discreto à direita: **"Abrir Agenda →"** (navega para `/calendario`) com micro-texto: *"marcar e receber lembretes"*

### 2. Agenda (`src/routes/calendario.tsx`) — cabeçalho da tela
- Título: **"Agenda"**
- Subtítulo logo abaixo: *"Marque seus plantões Dejem/Delegada e receba lembretes automáticos"*
- Pequeno badge/ícone de sino indicando que essa tela dispara notificações.

### 3. Menu lateral (`src/components/side-drawer.tsx`)
Ajustar os rótulos/descritivos das duas entradas para reforçar a diferença:
- **Início** — "Resumo e visão rápida"
- **Agenda** — "Marcar Dejem/Delegada e lembretes"

### 4. Bottom nav (`src/components/bottom-nav.tsx`)
Se houver item "Agenda", garantir o label "Agenda" (não "Calendário") para consistência com a nomenclatura da tela.

## Fora de escopo
- Não altero lógica de notificações, storage de marcas nem layout do calendário em si.
- Não mexo em cores/tema — só textos, um subtítulo e um link de CTA na Home.

## Verificação
Após implementar, confiro por screenshot que Home e Agenda mostram os novos textos e que o link "Abrir Agenda" da Home navega corretamente.
