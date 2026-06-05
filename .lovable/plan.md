## Objetivo

iNotes (`correio.policiamilitar.sp.gov.br`) e CIAF (`www.ciaf.policiamilitar.sp.gov.br`) são serviços públicos da PMESP — abrem com ou sem AnyConnect. Hoje os dois botões na tela inicial passam por `guardIntranet(...)`, que é a mesma função usada para serviços que exigem VPN (ex.: "Marcar/Desmarcar"). Mesmo sendo hoje um pass-through, isso mistura semântica e abre brecha para qualquer mudança futura de `guardIntranet` impactar indevidamente esses dois acessos.

## Mudança

Arquivo único: `src/routes/index.tsx`

1. Botão **"Email iNotes"** (linhas ~225-239): trocar
   ```
   onClick: () => void guardIntranet(() => openInAppBrowser(...), "o Email iNotes")
   ```
   por chamada direta:
   ```
   onClick: () => openInAppBrowser("https://correio.policiamilitar.sp.gov.br/iwaredir.nsf", {
     titulo: "Email iNotes",
     modo: "webview",
     forceMobileUA: true,
   })
   ```

2. Botão **"Folha de Pagamento" (CIAF)** (linhas ~262-276): mesma troca, removendo o wrapper `guardIntranet`, mantendo `openInAppBrowser` com os mesmos parâmetros atuais.

3. Manter `guardIntranet` no botão **"Marcar / Desmarcar Dejem/Delegada"**, que de fato depende da intranet.

4. Se após a remoção `guardIntranet` deixar de ser usado em `index.tsx`, remover o import correspondente para evitar warning de unused.

## Fora do escopo

- Não mexer em `src/lib/vpn-guard.tsx`, `vpn-status`, `intranet-warmup`, nem no plugin Android.
- Nenhuma mudança de lógica de VPN/warmup — só desacoplar esses dois botões.
