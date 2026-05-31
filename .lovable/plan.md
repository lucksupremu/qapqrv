# Plano: Consultar escala + download em segundo plano sem conflitos

## Diagnóstico

Hoje o fluxo em `src/routes/index.tsx` (`handleConsultar`) mistura três coisas no mesmo `await`:

1. Abre uma aba em branco (`about:blank`) imediatamente para escapar do popup blocker.
2. Espera `isIntranetReachable()` (VPN check) antes de decidir o que fazer.
3. Depois preenche a aba **e** dispara `baixarPdfEmBackground(url)` sobre a **mesma URL** com `credentials: include`.

Isso causa o conflito relatado:

- A aba fica "piscando" em about:blank enquanto a checagem de VPN roda.
- Em alguns ASP.NET, a sessão aberta na intranet via aba do navegador e o `fetch` simultâneo competem pelo mesmo cookie/sessão, o que pode invalidar a navegação do usuário.
- Se a VPN check falha, a aba é fechada — o usuário perde a visualização.
- `fetch` com CORS quase sempre falha no web, mas a tentativa atrasa/embaralha o fluxo.

## Solução

Separar completamente duas trilhas independentes:

### Trilha A — abrir a escala para o usuário (síncrona ao clique)

Roda no `onClick` direto, **sem `await` antes**:

- **Web**: `window.open(url, "_blank")` imediatamente. Sem about:blank intermediário, sem fechamento condicional.
- **APK (Capacitor)**: `openInAppBrowser(url, …)` (já existe).

A checagem de VPN sai do caminho crítico — vira só um aviso pós-clique (toast informativo se a intranet não responder dentro de 2s), mas nunca cancela ou fecha o tab do usuário. O banner "Conecte o AnyConnect primeiro" continua acima do campo como prevenção.

### Trilha B — salvar/baixar em segundo plano (assíncrona, isolada)

Roda em `setTimeout(..., 0)` (microtarefa) totalmente desacoplada da Trilha A, em um módulo novo `src/lib/escala-download.ts`:

1. **Sempre**: `upsertEscala({ id, url, titulo, dataSalva })` — adiciona à lista de "Escalas baixadas" mesmo se o PDF não puder ser obtido (continua abrindo via intranet ao tocar).
2. **APK (Capacitor)** — caminho que de fato funciona offline:
   - Usa `CapacitorHttp` (já disponível em `@capacitor/core` 5+), que faz a requisição **no contexto nativo** e ignora CORS.
   - Salva o blob em `@capacitor/filesystem` na `Directory.Data` como `escalas/<id>.pdf`.
   - Marca `hasPdf: true`, guarda `localPath` no item.
   - Notifica via toast só ao final ("Escala <id> salva offline").
   - Se `@capacitor/filesystem` ainda não estiver instalado, o código falha silenciosamente — comentário TODO explicando `bun add @capacitor/filesystem` + `npx cap sync`.
3. **Web** — tentativa best-effort:
   - `fetch(url, { credentials: "include", mode: "cors" })` numa Promise isolada.
   - **Sem afetar** a aba aberta: se falhar (provável por CORS), apenas marca o item como "sem PDF anexado" e segue.
   - Sem toast de erro (evita ruído). Toast de sucesso só quando realmente baixa.
4. **Concorrência**: um `Set<string>` em memória bloqueia múltiplos downloads do mesmo `id` ao mesmo tempo.

### Atualizações em `escalas-baixadas.ts`

- Adicionar campo opcional `localPath?: string` em `EscalaSalva` (para o caminho do Filesystem nativo).
- Nova função `lerPdfNativo(id)` → lê do Filesystem quando disponível.
- `lerPdfBlob` continua para web (IndexedDB).

### Atualizações em `escalas-baixadas.tsx`

- `handleAbrir`: se nativo + `localPath`, usa Capacitor Browser / `FileOpener` (ou abre o arquivo via `Filesystem.getUri` + `Browser.open`). Se web + IndexedDB blob, mantém comportamento atual. Caso contrário, abre via intranet (como hoje).

### Index `handleConsultar` reescrito

```ts
const handleConsultar = () => {
  const id = idEscala.trim();
  if (!id) { toast.error("Informe o ID da escala."); return; }
  const url = `https://sistemasadmin.intranet.policiamilitar.sp.gov.br/Escala/arrelconesc.aspx?${encodeURIComponent(id)}`;

  // Trilha A — abrir AGORA, sem await
  if (isNativeApp()) {
    void openInAppBrowser(url, { titulo: `Escala ${id}` });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // Trilha B — fire-and-forget, sem bloquear UI
  setTimeout(() => {
    void salvarEscalaEmBackground(id, url);
  }, 0);
};
```

Sem `setConsultando` longo (ou só por 400ms como feedback visual leve).

## Resumo dos arquivos

- **`src/lib/escala-download.ts`** (novo) — `salvarEscalaEmBackground(id, url)` com branches web/nativo.
- **`src/lib/escalas-baixadas.ts`** — adicionar `localPath?: string`; helper `lerPdfNativo`.
- **`src/routes/index.tsx`** — `handleConsultar` enxuto (trilha A + dispatch B).
- **`src/routes/escalas-baixadas.tsx`** — `handleAbrir` usa `localPath` no APK.

Não vou instalar `@capacitor/filesystem` agora (precisa `npx cap sync` na máquina do usuário); o código importa dinamicamente e degrada para "sem PDF anexado" se o plugin não estiver presente. Documento no comentário como ativar.
