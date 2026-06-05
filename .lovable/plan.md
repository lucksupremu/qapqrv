# Ajuste do formato da URL de consulta de escala

## O que muda

Hoje a URL gerada (web e APK) é:

```text
https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?nuesc=8666
```

Passa a ser:

```text
https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?8666
```

Ou seja, o número digitado (ex.: `8666`) vai direto depois do `?`, sem `nuesc=`.

Como a URL é construída em um único ponto e usada tanto pelo fluxo web quanto pelo APK, a correção em um lugar já cobre os dois.

## Alterações

1. `src/routes/index.tsx` (linha 121) — trocar a montagem da URL:
   - de: `…/arrelconesc.aspx?nuesc=${encodeURIComponent(id)}`
   - para: `…/arrelconesc.aspx?${encodeURIComponent(id)}`
   
   Isso afeta automaticamente:
   - Web/PWA: `window.open(url, "_blank")` abrirá a nova URL.
   - APK: `InAppWebView.downloadPdf({ id, url })` baixará a nova URL.

2. `src/routes/intranet.tsx` (linha 95) — ajustar a regex que detecta o ID quando o usuário navega pela intranet. Hoje aceita `nuesc=<id>` ou `arrelconesc.aspx?<id>`. Mantemos as duas formas (a nova já é coberta pelo segundo padrão), apenas confirmando que continua funcionando — nenhuma mudança de comportamento aqui, só verificação.

## Pontos de atenção

- Escalas já salvas no dispositivo guardam a URL antiga no `localStorage`. Novas consultas vão gravar o novo formato; as antigas continuam abrindo pelo PDF local já baixado (o link é só metadado).
- Nenhuma mudança no plugin Android (`InAppWebViewPlugin.kt`) é necessária — ele apenas recebe a URL pronta.
