## Plano: Empacotar como app Android nativo com navegador interno e autofill

### Como vai funcionar
- O projeto Lovable continua sendo o mesmo app web (React/TanStack).
- Adicionamos o **Capacitor** (wrapper nativo da Ionic) que embrulha o build do Vite num app Android real.
- Para o navegador interno usamos o plugin **`@capacitor/inappbrowser`** (WebView nativa), que aceita **injeção de JavaScript** no site carregado — é isso que permite preencher login/senha do `login.aspx` da intranet PMESP, algo impossível no iframe do browser.
- Salvamos as credenciais do usuário no `localStorage` do app, protegidas por **PIN de 4 dígitos**. Ao abrir um link da intranet, perguntamos o PIN uma vez por sessão, e o WebView injeta o login automaticamente quando a página de autenticação carrega.

### O que será criado no projeto

1. **Instalar dependências** (necessárias mesmo que o build nativo seja feito fora do Lovable):
   - `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/inappbrowser`, `@capacitor/preferences`

2. **`capacitor.config.ts`** na raiz com `appId` (ex.: `br.com.qapqrv.app`), `appName: "QAP, QRV!"`, `webDir: "dist"` e `server.androidScheme: "https"`.

3. **`src/lib/credenciais.ts`** — cofre local:
   - Funções `saveCredenciais({usuario, senha})`, `loadCredenciais(pin)`, `hasCredenciais()`, `clearCredenciais()`.
   - Criptografia simétrica simples (AES via `crypto.subtle`) usando o PIN como chave derivada (PBKDF2). Persistido em `Capacitor Preferences` quando nativo / `localStorage` no web.

4. **`src/lib/in-app-browser.ts`** — abertura unificada:
   - Detecta plataforma via `Capacitor.isNativePlatform()`.
   - **No app nativo**: abre `InAppBrowser` com script de autofill que detecta os campos da intranet (`input[name*='usuario'], input[type='password']`), preenche e (opcional) submete o form.
   - **No navegador web**: fallback para a rota atual `/intranet` (iframe) ou abre nova aba, já que injeção não é possível.

5. **Nova rota `src/routes/credenciais.tsx`** — tela "Minhas credenciais PMESP":
   - Definir/alterar PIN (4 dígitos).
   - Salvar usuário e senha (campos com botão "mostrar/ocultar").
   - Botão "Apagar credenciais".
   - Aviso claro: dados ficam apenas no aparelho, nunca enviados a servidor.

6. **Modal "Digite o PIN"** (`src/components/pin-modal.tsx`) acionado antes de abrir o navegador interno quando houver credenciais salvas.

7. **Integração nos pontos que abrem a intranet**:
   - `src/routes/index.tsx` (botão Consultar) e qualquer outro lugar que hoje navegue para `/intranet` passam a chamar `openInAppBrowser(url, { titulo })`.
   - Item novo no menu lateral (`side-drawer.tsx`): "Credenciais PMESP".

### O que o usuário precisa fazer fora do Lovable (uma vez)

```text
git clone <repo do projeto exportado>
npm install
npx cap add android
npm run build && npx cap sync
npx cap open android   # abre Android Studio e gera o APK assinado
```

O Lovable Cloud/preview continua mostrando a versão web (com fallback de iframe). O autofill real só funciona dentro do APK instalado.

### Limitações que serão comunicadas na UI
- iOS exige Mac + conta Apple Developer; este plano cobre Android primeiro. iOS pode ser adicionado depois com `npx cap add ios`.
- Se a intranet mudar os nomes dos campos do formulário, o seletor de autofill precisa ser ajustado em `in-app-browser.ts`.
- No preview do Lovable nada muda visualmente: a tela de credenciais funciona, mas o "navegador interno" cai no fallback do iframe.

### Resultado
Depois de instalado o APK: usuário cadastra usuário/senha + PIN uma vez. Toca em qualquer link da intranet → digita PIN → WebView abre já logado.