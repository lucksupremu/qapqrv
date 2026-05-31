## Objetivo
Na tela inicial, substituir o bloco de ação "Intranet PMESP" por "Email iNotes". Ao clicar, deve abrir o link `https://correio.policiamilitar.sp.gov.br/iwaredir.nsf` usando o mesmo mecanismo de navegador interno/externo já existente (`openInAppBrowser`).

## Alterações

### `src/routes/index.tsx`
1. **Import de ícone:** trocar `Globe` por `Mail` no import do `lucide-react`.
2. **Bloco de ação:** no array `blocos`, substituir o último item:
   - `label`: `"Intranet PMESP"` → `"Email iNotes"`
   - `icon`: `Globe` → `Mail`
   - `onClick`: navegação interna `/intranet` → `openInAppBrowser("https://correio.policiamilitar.sp.gov.br/iwaredir.nsf", { titulo: "Email iNotes" })`

O `openInAppBrowser` já trata automaticamente abertura no navegador interno (APK) ou nova aba (web), mantendo o comportamento consistente com os demais links do app.