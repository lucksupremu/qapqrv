## Objetivo

Na versão web (PWA/navegador), parar de tentar detectar a VPN — o probe HTTP `no-cors` não é confiável (browser pode bloquear, cache, CORS, rede lenta) e por isso o botão "Verificar" parece não fazer nada quando o usuário está conectado. Em vez disso, mostrar um aviso claro de que é necessário estar conectado no Cisco AnyConnect e oferecer um botão que abre o app direto (Android ou iOS).

A detecção nativa continua intacta no APK Android (plugin Kotlin via `TRANSPORT_VPN`).

## Mudanças

### 1. `src/lib/vpn-status.ts`
- Remover `probeIntranet()` e o cache de probe.
- `isVpnActive()` passa a:
  - Tentar o plugin nativo Android (Capacitor). Se responder → retorna `true/false`.
  - Se o plugin não existir (web/iOS sem plugin) → retornar `null` (= "desconhecido, assuma que precisa de VPN").
- Exportar um helper `isNativeVpnAvailable()` para os componentes saberem se devem mostrar o botão "Verificar" ou apenas o aviso estático.

### 2. `src/routes/index.tsx` e `src/routes/ferramenta.consulta-escala.tsx`
- Quando `isVpnActive()` retornar `null` (web):
  - Esconder o botão "Verificar" / "Verificar novamente" (não faz sentido sem detecção real).
  - Mostrar mensagem fixa: "Para usar esta ferramenta é necessário estar conectado à VPN da PMESP pelo Cisco AnyConnect."
  - Manter o botão "Abrir AnyConnect" como ação principal — `openAnyConnect()` já trata Android (intent + Play Store fallback) e iOS (scheme + App Store fallback).
- Quando `isVpnActive()` retornar `true/false` (Android nativo): manter o comportamento atual (badge verde/amarelo + botão Verificar).

### 3. Tooltips
- Atualizar tooltip do ícone na web para refletir "status não verificável no navegador — conecte o AnyConnect".

## Fora de escopo
- Plugin nativo Kotlin (já existe, sem mudanças).
- Lógica de abertura do AnyConnect em `src/lib/open-anyconnect.ts` (já cobre Android + iOS corretamente).
