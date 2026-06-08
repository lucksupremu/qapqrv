# Aviso sutil no topo da Home

Adicionar uma faixa discreta logo abaixo do header da Home (`src/routes/index.tsx`), avisando que, se o Chrome bloquear o acesso a escalas ou a marcação Dejem/Delegada, basta abrir em outro navegador (Firefox/Edge).

## Comportamento

- Faixa fina, com ícone `Info` à esquerda e texto curto.
- Cor âmbar suave (mesma família do logo / `--gradient-gold`), borda arredondada, sem fundo chamativo — visual de "dica", não de erro.
- Botão "X" minúsculo à direita para dispensar.
- Dispensa persistida em `localStorage` com chave `home_browser_hint_dismissed_v1` — uma vez fechado, não reaparece.
- Renderiza só na web (não no APK nativo, já que ali o WebView interno cuida disso). Usa o hook `useIsNative` que já está importado.

## Texto

> Se o Chrome bloquear o acesso a escalas ou à marcação Dejem/Delegada, abra em outro navegador (Firefox ou Edge).

## Posicionamento

Entre o `</header>` (linha 316) e a `section` da Consulta (linha 321) — onde já existe um espaço vazio (linha 318). Substitui esse espaço por um componente inline `BrowserHintBanner`.

## Diferença do que já existe

O `BrowserWarningModal` é um modal que aparece uma vez na primeira visita. Esta faixa é persistente no topo até o usuário dispensar — funciona como lembrete contextual visível enquanto ele estiver na Home, sem precisar lembrar do modal de boas-vindas.

## Arquivos

- `src/routes/index.tsx` — adicionar componente `BrowserHintBanner` (definido no mesmo arquivo, ~20 linhas) e renderizá-lo abaixo do header.
