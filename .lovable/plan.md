## Visão geral

São **11 melhorias** que vou implementar em **5 fases** ordenadas por dependência. Cada fase é independente — se quiser cortar alguma, só me avisar.

| Fase | Itens | Esforço |
|---|---|---|
| 1. Design tokens & dark mode | Tema escuro real (#3) + acessibilidade (#15) | médio |
| 2. UX core | Bottom sheet (#4) + Busca global (#6) + Erros de rede (#12) + Status VPN no header (#11) | médio |
| 3. Cofre + autopreenchimento intranet | (#1) | grande |
| 4. Offline real escalas baixadas | (#2) | médio |
| 5. Nativo Android | Onboarding (#5) + Atalhos rápidos long-press (#14) + Widget próxima escala (#7) | grande |

---

## FASE 1 — Design tokens e tema escuro real

**O que está errado hoje:** dezenas de arquivos usam `style={{ background: "#2e6b8a", color: "#fff" }}` em vez de tokens. À noite o app continua branco e queima a vista. Já existe `.dark` em `styles.css` mas quase ninguém consome.

**O que vou fazer:**
1. Auditar e centralizar tokens em `src/styles.css` (já tem base — vou padronizar): `--bg`, `--surface`, `--surface-2`, `--primary`, `--primary-fg`, `--text`, `--text-muted`, `--border`, `--danger`, `--success`.
2. Refatorar componentes críticos (`MarcarModal`, `app-header`, `bottom-nav`, `tool-card`, `side-drawer`, `intranet`, `anyconnect`, `escala-calendar-card`, `escalas-baixadas`, `historico`, `favoritos`, `configuracoes`) trocando hex inline por `style={{ background: "var(--surface)" }}` ou classes Tailwind como `bg-[var(--surface)]`.
3. Toggle de tema em **Configurações**: Auto (segue sistema) / Claro / Escuro — persiste em `localStorage`.
4. Aplicar `.dark` no `<html>` via `src/lib/theme.ts` (já existe — ampliar).
5. **Acessibilidade (#15):** ajustar `--text-muted` para passar WCAG AA, adicionar `aria-label` em botões de ícone, respeitar `prefers-reduced-motion`, suportar fonte do sistema (`text-base` em rem em vez de px).

**Saída:** botão "Tema" em Configurações funcionando, todas as telas legíveis no escuro.

---

## FASE 2 — UX core

### 2.1 Bottom sheet para MarcarModal (#4)
O `Dialog` atual ocupa a tela inteira. Vou trocar pelo `Drawer` (já existe em `src/components/ui/drawer.tsx`) com handle de arrastar, snap em 90% da altura, fecha ao arrastar pra baixo. Mesmo conteúdo, melhor ergonomia mobile.

### 2.2 Busca global (#6)
- Componente novo `src/components/global-search.tsx` (Command Palette estilo).
- Indexa em memória: ferramentas (`src/lib/tools.ts`), escalas baixadas (`escalas-baixadas`), histórico (`use-escala-historico`), marcas (`marcas.ts`), favoritos.
- Ícone de lupa no `app-header` → abre overlay com input + resultados agrupados por categoria.
- Atalho `Ctrl+K` no web; toque no ícone no mobile.

### 2.3 Centralizar erros de rede (#12)
- Novo `src/lib/network-error.ts` com função `formatNetworkError(err)` que mapeia para 3 estados: `offline`, `vpn-off`, `server-down`.
- Componente `<NetworkErrorState kind="vpn-off" onRetry={...} />` reutilizável (atualmente cada tela renderiza seu próprio erro).
- Aplicar em `intranet.tsx`, `escala-viewer`, `ferramenta.consulta-escala`.

### 2.4 Indicador VPN no header (#11)
- Novo `src/components/vpn-indicator.tsx`: bolinha 🟢/🔴 + texto curto "VPN" no `app-header`.
- Usa `vpn-status.ts` (já existe) com poll a cada 5s.
- Toque → abre `/anyconnect`.

---

## FASE 3 — Cofre + autopreenchimento intranet (#1)

**Decisão de arquitetura:**

Como o login da intranet (https://ms.policiamilitar.sp.gov.br/login.aspx) acontece **dentro da WebView nativa** (`InAppWebViewActivity.kt`), o autofill precisa rodar **no Kotlin**, não no React. JavaScript injetado via `evaluateJavascript()` preenche os campos.

**Implementação:**

1. **Cofre local (web/React):**
   - `src/lib/credential-vault.ts`: armazena CPF + senha em `localStorage` **criptografados com AES-GCM** usando uma chave derivada por PBKDF2 a partir de um PIN de 4 dígitos que o usuário define uma vez.
   - Sem PIN salvo em lugar nenhum — se esquecer, tem que cadastrar de novo. Trade-off de segurança.
   - API: `vault.has()`, `vault.set(cpf, senha, pin)`, `vault.get(pin)`, `vault.clear()`.

2. **Tela de configuração de credenciais:**
   - Em `/configuracoes` → nova seção "Login automático intranet".
   - Form: CPF, Senha, PIN (4 dígitos), confirmar PIN.
   - Toggle "Usar autofill ao abrir intranet".

3. **Ponte para o WebView nativo:**
   - Estender `InAppWebViewPlugin.kt` com método `setAutofillCredentials({ cpf, senha })` que guarda em variáveis na Activity (memória da sessão, não disco).
   - Antes de abrir `openInAppBrowser('http://ms.policiamilitar.sp.gov.br/login.aspx')`, o React chama `InAppWebView.setAutofillCredentials({ cpf, senha })` (após o usuário digitar o PIN).
   - **PIN é pedido no app web, credenciais decifradas e enviadas ao plugin via Capacitor bridge.** Senha plain só vive em memória da Activity Kotlin enquanto a WebView está aberta.

4. **Injeção JS no Android:**
   - `InAppWebViewActivity.kt` no `onPageFinished`: se URL contém `login.aspx` e credenciais setadas, injetar:
     ```js
     document.querySelector('#txtUsuario').value = '<CPF>';
     document.querySelector('#txtSenha').value = '<SENHA>';
     document.querySelector('#btnEntrar').click();
     ```
   - Seletores reais a confirmar inspecionando a página (vou usar nomes prováveis do ASP.NET: `txtCpf`, `txtSenha`, `btnLogin`).

5. **Tela de PIN ao abrir intranet:**
   - Novo modal `<UnlockPinModal />` mostrado quando autofill está ativo. Usuário digita 4 dígitos → decifra → envia ao plugin → abre WebView. Se errar 3x, bloqueia 30s.

**Limites/segurança explicados pro usuário:**
- Credenciais ficam só no aparelho, criptografadas.
- Não há cópia em servidor, nem backup automático.
- Se trocar de celular, cadastra de novo.
- App não vê a senha em texto puro até o PIN ser digitado.

---

## FASE 4 — Modo offline real para escalas baixadas (#2)

**Estado atual:** `escalas-baixadas.ts` já tem `baixarPdfEmBackground()`. Falta garantir que o `escala-viewer.$id.tsx` abra **sem rede nenhuma**.

**O que vou fazer:**

1. **Cache do PDF na Cache API do navegador** (além do salvamento atual em IndexedDB/SharedPreferences nativo).
2. **Service Worker:** ampliar `public/sw.js` (hoje só lida com notificações) para:
   - Pré-cachear shell da rota `/escala-viewer/:id` e `/escalas-baixadas`.
   - Estratégia `NetworkFirst` para HTML; `CacheFirst` para o PDF baixado.
   - Manter o handler de notificações atual intacto.
3. **Indicador offline no header da escala:** badge "📴 Offline" quando `!navigator.onLine` mas o conteúdo está disponível.
4. **Lista offline-ready:** marcar escalas com PDF baixado com selo ✅ "Offline OK".
5. **Sem rede + sem PDF cacheado:** tela vazia com mensagem clara ("Baixe esta escala quando estiver com VPN para usar offline").
6. **Plugin nativo:** garantir `openPdf({ path })` no `InAppWebViewPlugin.kt` (já existe) é o fallback usado no APK — não depende de rede.

---

## FASE 5 — Nativo Android

### 5.1 Onboarding 3 telas (#5)
- Nova rota `/onboarding` com 3 slides (swipe horizontal):
  1. "O que é o QAP, QRV!" — ilustração + 3 bullets de features.
  2. "Configure o AnyConnect" — botão direto pra `/anyconnect` ou "pular".
  3. "Permissões" — pede notificações (Android 13+), localização (opcional para a ferramenta de localização).
- Mostrado **só na 1ª abertura** (flag `onboarding-seen` em localStorage).
- Botão "Pular" sempre visível.
- Botão "Refazer onboarding" em Configurações.

### 5.2 Atalhos rápidos long-press (#14)
- Editar `AndroidManifest.xml` (via `android-plugin/`) adicionando `<meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts" />`.
- Criar `android/app/src/main/res/xml/shortcuts.xml` (no projeto template — vou documentar onde no workflow de build) com 3 atalhos:
  1. "Nova marca" → deep link para `/?action=nova-marca`.
  2. "Próxima escala" → `/calendario`.
  3. "Abrir intranet" → `/intranet`.
- React lê `?action=` na home e abre o `MarcarModal` automaticamente.

### 5.3 Widget Android de próxima escala (#7)
- Novo provider `android-plugin/ProximaEscalaWidget.kt` (AppWidgetProvider).
- Layout `res/layout/widget_proxima_escala.xml`: card escuro com "Próximo Dejem" + data/hora.
- Dados vêm de um `SharedPreferences` que o React grava via novo plugin `WidgetDataPlugin.setProximaEscala({ tipo, data, valor })`.
- Atualiza ao salvar/remover marca.
- Atualização periódica (`updatePeriodMillis`) a cada 30min como fallback.
- Toque no widget abre o app na `/calendario`.

---

## Detalhes técnicos consolidados

**Novos arquivos React:**
- `src/lib/credential-vault.ts`, `src/lib/network-error.ts`, `src/lib/widget-bridge.ts`
- `src/components/global-search.tsx`, `src/components/vpn-indicator.tsx`, `src/components/network-error-state.tsx`, `src/components/unlock-pin-modal.tsx`
- `src/routes/onboarding.tsx`

**Arquivos modificados (React):**
- `src/styles.css` (tokens consolidados), `src/lib/theme.ts` (toggle Auto/Claro/Escuro)
- `src/components/marcar-modal.tsx` (Drawer)
- `src/components/app-header.tsx` (busca + VPN indicator)
- `src/routes/configuracoes.tsx` (tema, cofre, autofill toggle, refazer onboarding)
- `src/routes/intranet.tsx`, `src/routes/escala-viewer.$id.tsx`, `src/routes/index.tsx`
- `public/sw.js` (cache PDF/HTML mantendo notificações)
- ~15 componentes refatorados para usar tokens em vez de hex inline

**Plugins Android:**
- `InAppWebViewPlugin.kt` + `InAppWebViewActivity.kt`: método `setAutofillCredentials` + injeção JS no `onPageFinished`
- Novo: `WidgetDataPlugin.kt` + `ProximaEscalaWidget.kt` + recursos XML
- `AndroidManifest.xml`: shortcuts + receiver do widget + meta-data

**Build & QA:**
- Tudo testado no preview (web).
- Plugins Android só entram em vigor no próximo build via `build-aab-release.yml` (já configurado no projeto).
- Onboarding, widget, shortcuts e autofill nativo **só funcionam no APK instalado**, não no preview do navegador — vou avisar isso na entrega.

---

## Ordem de entrega sugerida (posso fazer tudo em sequência ou parar entre fases pra você testar)

1. **Fase 1** → ganho visual imediato, tudo no web.
2. **Fase 2** → UX cotidiana melhor.
3. **Fase 3** → mata a maior dor (relogar intranet). Precisa APK pra testar autofill.
4. **Fase 4** → offline real, web + APK.
5. **Fase 5** → polimento Play Store, só APK.

**Recomendação minha:** entregar Fase 1 + 2 primeiro (≈ 1 entrega), testar com você, depois 3, depois 4+5. Mas se quiser tudo de uma vez, eu vou.

Diga se aprova como está ou se quer ajustar/cortar algo antes de eu começar.