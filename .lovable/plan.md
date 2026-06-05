## Problema

Ao clicar **Consultar** na home (com um ID de escala):

1. A WebView abre em branco, porque a URL é montada como
   `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?123456` — **sem o nome do parâmetro**. O sistema da PMESP espera `?nuesc=123456` (já está documentado no próprio código em `src/routes/intranet.tsx:95` no regex `(?:nuesc=|arrelconesc\.aspx\?)(\d+)`). Sem o nome do parâmetro, o ASP.NET devolve uma página vazia.

2. A escala não aparece em **Escalas baixadas** porque `salvarEscalaEmBackground(...)` (que faz o `upsertEscala`) só é chamado quando `isNativeApp() === true`. No navegador (preview/web) o registro nunca é salvo, mesmo quando o usuário pediu para consultar. Em outras palavras: hoje a lista de "Escalas baixadas" só é alimentada no APK.

## Correção

Arquivo: `src/routes/index.tsx`, função `handleConsultar` (linhas ~114–136).

1. **Montar a URL correta** com o nome do parâmetro:
   ```ts
   const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?nuesc=${encodeURIComponent(id)}`;
   ```

2. **Registrar a escala em "Escalas baixadas" em todos os ambientes**, não só no APK. No web, basta criar o registro via `upsertEscala` (o download do PDF continua sendo apenas no APK, por causa de CORS):
   - Sempre chamar `upsertEscala({ id, url, titulo: \`Escala ${id}\`, dataSalva: new Date().toISOString() })` antes de abrir.
   - No APK, continuar chamando `salvarEscalaEmBackground(id, url)` em segundo plano (ele já faz o `upsertEscala` + tenta baixar o PDF).
   - No web, manter o `window.open(url, "_blank")` como hoje (vai exigir VPN/intranet para carregar, mas o registro fica salvo).

3. Garantir que `setConsultando(false)` é sempre chamado, inclusive quando o `guardIntranet` rejeita.

## Detalhes técnicos

- Importar `upsertEscala` de `@/lib/escalas-baixadas` em `src/routes/index.tsx`.
- Não alterar `salvarEscalaEmBackground` nem a tela `escalas-baixadas.tsx`. A tela já lida com itens sem PDF (mostra badge "Intranet PMESP" e tenta abrir via `openInAppBrowser` quando o usuário toca em "Abrir").
- O aviso "Disponível apenas no aplicativo" na tela de Escalas baixadas (mostrado quando `!native`) continua válido para download offline do PDF, mas o registro do ID/URL passará a aparecer também no preview/web — ajustar a cópia desse aviso para deixar claro que **a lista funciona, só o download offline do PDF exige o APK**.

## Fora do escopo

- Não mexer no plugin Android, no build do APK, nem em outras telas/intranet.
- Não alterar o mock `consultarEscala` em `src/lib/escala.ts` nem a rota `/ferramenta/consulta-escala` (essa não é a tela usada pelo botão "Consultar" da home).
