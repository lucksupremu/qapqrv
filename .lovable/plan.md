
## Problema

Hoje `handleConsultar` em `src/routes/index.tsx` usa `openInAppBrowser`, que já tenta detectar nativo vs web. Porém quando rodando no navegador web a chamada está dando erro (provavelmente bloqueio de pop-up por ser `await` antes do `window.open`, ou import dinâmico do Capacitor falhando silenciosamente e atrasando).

## Solução

Dividir explicitamente o fluxo de abertura conforme o ambiente, sem depender de uma única função genérica para o caso da escala:

1. **Detecção síncrona de plataforma**
   - Criar helper `isNativeApp()` em `src/lib/in-app-browser.ts` (ou novo `src/lib/platform.ts`) que retorna boolean síncrono via `Capacitor.isNativePlatform()` importado estaticamente. Import estático evita o `await import()` que atrasa o `window.open` e dispara bloqueio de pop-up no navegador.

2. **`handleConsultar` em `src/routes/index.tsx`**
   - Montar a URL da escala.
   - Se `isNativeApp()` → chamar `openInAppBrowser(url, { titulo })` (InAppBrowser do Capacitor, fluxo atual do APK).
   - Senão (web/PWA) → abrir direto via `window.open(url, "_blank", "noopener,noreferrer")` de forma síncrona, dentro do mesmo tick do clique, para não ser bloqueado pelo navegador.
   - Manter o `try/catch` que salva em "Escalas baixadas" em segundo plano, sem bloquear a abertura.
   - Garantir `setConsultando(false)` no `finally`.

3. **Não mexer** em outros botões (Marcar/Desmarcar, etc.) — eles continuam usando `openInAppBrowser`, que segue funcionando para casos onde o delay não importa.

## Detalhes técnicos

- `@capacitor/core` já é dependência do projeto (usado em `in-app-browser.ts` e `open-anyconnect.ts`); import estático é seguro tanto em build web quanto nativo — `Capacitor.isNativePlatform()` retorna `false` no web.
- O ponto-chave da correção é remover o `await` antes do `window.open` no caminho web: navegadores só permitem `window.open` se chamado de forma síncrona dentro do handler de clique do usuário; com `await` no meio, o pop-up é bloqueado e aparece o erro.
- Nenhuma alteração de UI, rotas ou lógica de salvamento offline.

## Arquivos

- `src/lib/in-app-browser.ts` — exportar `isNativeApp()` síncrono (ou criar `src/lib/platform.ts`).
- `src/routes/index.tsx` — reescrever `handleConsultar` com o branch nativo vs web.
