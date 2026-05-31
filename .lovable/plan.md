## Problema

A função `checarVpn()` em `src/routes/index.tsx` faz um `fetch(..., { mode: "no-cors" })` ao domínio da intranet. Em WebView/navegador, essa requisição falha em muitos cenários mesmo com a VPN ativa (certificado interno, CSP, mixed content, bloqueios de rede do WebView). O resultado é um falso negativo: o app pensa que a VPN está offline e abre o AnyConnect, mesmo quando o usuário já está conectado.

## Solução

Remover a verificação prévia de VPN. Tentar abrir a escala diretamente — se a VPN estiver ativa, o navegador interno carrega a página normalmente; se não estiver, o próprio site falhará e o usuário tem o botão "Abrir AnyConnect" sempre disponível no card de ações.

## Mudanças em `src/routes/index.tsx`

1. Remover a função `checarVpn()`.
2. Em `handleConsultar()`:
   - Remover o bloco `if (!vpnOk) { ... openAnyConnect(); return; }`.
   - Chamar direto `upsertEscala(...)`, `baixarPdfEmBackground(...)` e `abrirComCredenciais(url, ...)`.
3. Remover o estado `vpnAviso` e o bloco JSX do aviso amarelo (não é mais acionado automaticamente). O botão "Abrir AnyConnect" do card continua disponível para quando o usuário perceber que precisa conectar.
4. Limpar imports não usados (`AlertTriangle`, `openAnyConnect` continua sendo usado pelo botão do card).

## Resultado

Consultar escala passa a abrir a intranet diretamente, sem precheck que pode falhar. O usuário decide se precisa do AnyConnect pelo botão dedicado.
