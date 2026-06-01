## Diagnóstico

No Chrome do Android (PWA/navegador) o toque em **Escalas Baixadas** (tile da Home, item do menu lateral e botão da bottom-nav) não navega. A causa não é a VPN — a rota `/escalas-baixadas` está registrada e os 3 caminhos usam `<Link>` / `navigate()` corretos.

O culpado é um **erro de hidratação** na Home (`src/routes/index.tsx`) que aparece nos logs do preview:

```
Hydration failed because the server rendered HTML didn't match the client.
…
+ <ul className="space-y-2">
- <div className="flex items-center gap-3 rounded-[16px] border…">
```

O que acontece:

1. `useState(() => loadMarcas())` lê o `localStorage` no momento do render. No SSR não há `localStorage`, então o servidor sempre envia HTML do estado **vazio** ("Nenhuma escala agendada", que é um `<div>`).
2. No cliente, no primeiro render já existem marcas, então a árvore vira `<ul>...<li>`. Tipos de elemento diferentes → React 19 descarta o subtree e re-renderiza.
3. Em alguns Chromes Android esse "regen" deixa a página em estado parcialmente interativo: os handlers `onClick` dos botões irmãos (incluindo o tile "Escalas baixadas") **não disparam** até um reload completo. Daí "nada acontece, nem a URL muda".

O mesmo padrão (`useState(() => lerLista())` lendo `localStorage` no render inicial) está em `src/routes/escalas-baixadas.tsx` — preventivamente também precisa corrigir.

## Mudanças

### 1. `src/routes/index.tsx`
- Inicializar `marcas` como `[]` (estado consistente entre SSR e primeiro render do cliente).
- Adicionar `useEffect` que, ao montar, chama `setMarcas(loadMarcas())` — depois disso o React já está hidratado e mudar `<div>` → `<ul>` é re-render normal, sem mismatch.
- Manter o `useEffect` existente de `focus`/`visibilitychange`/`storage` que já recarrega via `setMarcas(loadMarcas())`.
- Manter `saveMarcas(marcas)` no efeito atual (sem regressão).

### 2. `src/routes/escalas-baixadas.tsx`
- Mesmo padrão: `useState<EscalaSalva[]>([])` e popular via `useEffect` no mount com `lerLista()`. Evita futuras hidratações desencontradas se a lista crescer/encolher.

### 3. Verificação
- Após a alteração, abrir a Home no preview, abrir o console e confirmar que **não aparece** mais o aviso de hydration mismatch.
- Testar os 3 caminhos para `/escalas-baixadas`: tile da Home, item "Escalas Baixadas" no menu lateral, botão "Escalas" da bottom-nav.

## Fora de escopo

- Nada de mudança em VPN/AnyConnect — o problema é puramente de SSR/hidratação.
- Sem alterar `routeTree.gen.ts`, `__root.tsx` ou o `PrivacyConsent`.
