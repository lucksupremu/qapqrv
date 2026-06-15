## Problema

A injeção de viewport mobile + CSS de saneamento em `injectMobileViewport()` (em `android-plugin/InAppWebViewActivity.kt`) está sendo aplicada em **toda** página cujo host termine em `policiamilitar.sp.gov.br`. Isso resolveu o login da intranet (`ms.policiamilitar.sp.gov.br/login.aspx`), mas quebrou o layout de páginas que já funcionavam bem: webmail (`correio.policiamilitar.sp.gov.br` — iNotes), folha (`ciaf.policiamilitar.sp.gov.br/.../mobileview.aspx`) e outras páginas internas.

## Correção

Restringir a injeção apenas às páginas de **login** da intranet, deixando o resto exatamente como estava antes.

Em `android-plugin/InAppWebViewActivity.kt`, função `injectMobileViewport(url)`:

- Em vez de aplicar quando `host.endsWith("policiamilitar.sp.gov.br")`, aplicar somente quando o **path** da URL casar com a allowlist abaixo (case-insensitive):
  - `/login.aspx` (intranet PMESP — `ms.policiamilitar.sp.gov.br/login.aspx`)
  - `/autenticacaosegura.aspx` (login da folha/CIAF, mesmo template legado)

- Nada mais muda: o CSS injetado, os botões flutuantes, o auto-fade e o resto da Activity continuam iguais.

### Pseudocódigo da mudança

```text
private fun injectMobileViewport(url):
    if url vazio: return
    parsed = Uri.parse(url)
    host = parsed.host  (lowercase)
    path = parsed.path  (lowercase)
    if host NÃO termina em "policiamilitar.sp.gov.br": return
    if path NÃO termina em "/login.aspx"
       E path NÃO termina em "/autenticacaosegura.aspx": return
    // injeta meta viewport + CSS (igual ao atual)
```

## Resultado esperado

- Login da intranet (e Delegada via login.aspx) continua com o fix de zoom/teclado.
- Webmail iNotes, folha de pagamento mobile, escalas internas e demais páginas voltam a renderizar exatamente como antes do fix (sem CSS extra, sem padding superior forçado, sem `max-width:340px` em inputs).
- Sem mudanças em build, versionCode, plugins, ou em qualquer outra parte do app.