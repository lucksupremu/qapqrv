
## Proposta: abrir tudo no navegador padrão do aparelho (Chrome externo)

### Resposta direta
Sim — abrir diretamente no Chrome (ou navegador padrão do usuário) resolve a **maior parte** dos problemas que estamos enfrentando, mas **não 100%**. Vale a pena fazer. Abaixo o que muda, o que melhora e o que continua sendo limitação externa.

### O que melhora ao abrir no Chrome externo

1. **Menu completo do Chrome disponível** — botão de 3 pontos com "Site para computador", recarregar, compartilhar, etc.
2. **Sem timeout / fallback / SSL handler customizado** — sumimos com toda a lógica frágil de `browserPageLoaded`, `sslError`, listeners do plugin.
3. **Cookies e sessão persistentes** — o Chrome guarda login do iNotes/Intranet entre sessões; o WebView interno reseta com mais facilidade.
4. **Certificado interno (ICP-Brasil)** — se o usuário já aceitou uma vez no Chrome, fica aceito. No WebView interno cada app tem seu próprio cache de certificados.
5. **Compatibilidade com a página da PMESP** — algumas páginas (iNotes principalmente) só funcionam bem no Chrome completo, não no WebView.
6. **Código muito mais simples** — basta `window.open(url, '_blank')` no web e `InAppBrowser.openInExternalBrowser({url})` no APK.

### O que NÃO se resolve (limitação externa, não do app)

1. **Chrome bloqueando certificado** — se o Chrome do aparelho do usuário decidiu bloquear o certificado da PMESP (versões 124+), continua bloqueando. Isso é uma decisão do Chrome, não temos como contornar de dentro do app.
2. **Usuário precisa estar na VPN/Intranet** — já tratado pelo `guardIntranet`.
3. **iNotes em mobile** — depende do servidor da PMESP decidir qual interface entregar.

### Trade-offs (o que o usuário perde)

- **Sai do app** — abre o Chrome em outra aba. Para voltar, usa o botão "voltar" do Android (volta direto pro app, geralmente).
- **Sem barra "Fechar"** dentro do app — mas o botão de voltar do sistema cumpre esse papel.
- **Sem User-Agent forçado mobile** — mas é justamente o que o usuário pediu (poder alternar entre desktop/mobile pelo menu do Chrome).

### Implementação proposta

**Arquivo único alterado: `src/lib/in-app-browser.ts`**

Simplificar drasticamente a função `openInAppBrowser`:
- **No APK (Capacitor)**: sempre usar `InAppBrowser.openInExternalBrowser({url})` → abre o Chrome do aparelho.
- **No navegador web (PWA/desktop)**: `window.open(url, '_blank')` → abre nova aba do próprio navegador.
- Remover todo o código de WebView interno, listeners de erro, timeouts, fallback, `forceMobileUA`, `ANDROID_CHROME_UA`.

**Arquivo `src/routes/index.tsx`**
- Remover os parâmetros `modo`, `forceMobileUA`, `titulo` das chamadas — ficam só `openInAppBrowser(url)`. As 3 chamadas (Marcar/Desmarcar, iNotes, e outras se houver) ficam idênticas.

**Manter intactos**
- `guardIntranet` (toast de "precisa estar na VPN").
- `isNativeApp()` (detecção de plataforma).
- Resto do app não muda.

### Resumo técnico

```text
ANTES                                    DEPOIS
─────                                    ──────
openInAppBrowser(url, {                  openInAppBrowser(url)
  modo: "webview" | "system",            ↓
  titulo, forceMobileUA, timeout         APK   → Chrome externo
})                                       Web   → nova aba
↓
WebView interno + UA custom + 
listeners de SSL + timeout + 
fallback p/ Custom Tabs
```

### Próximo passo

Posso aplicar agora — é uma mudança pequena (1 arquivo principal + ajuste em 2-3 chamadas) e remove muita complexidade. Quer prosseguir?
