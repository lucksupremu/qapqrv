# Plano: Agenda mais clara + funcionalidades do Plantão Fácil

## 1. Contorno quadrado no dia (visual da célula)

Arquivo: `src/components/escala-calendar-card.tsx`

- Remover o círculo de fundo suave do dia de hoje (`rounded-full` com `COR_BG_SOFT`) e o preenchimento colorido atual das células com plantão.
- Cada célula do calendário passa a ter:
  - Borda quadrada (`border-2`, `borderRadius: 6px`) em volta do número do dia.
  - Cor da borda = cor do plantão do dia (laranja/azul-marinho). Se houver plantão dia + noite no mesmo dia, borda dividida (metade laranja em cima, metade azul embaixo) via gradiente.
  - Sem plantão → borda transparente. Hoje → borda fina cinza (`#94a3b8`) + número em negrito.
- Número do dia sempre centralizado, sem fundo colorido — só o contorno indica o plantão.
- Marcas (Dejem/Delegada) continuam como bolinha no canto superior direito; eventos como bolinha inferior esquerda.

## 2. Duas cores fixas: dia e noite

Cores escolhidas:
- 🌞 **Diurno**: `#F59E0B` (laranja âmbar)
- 🌙 **Noturno**: `#1E3A8A` (azul-marinho)

Arquivos:
- `src/lib/escala-trabalho.ts`:
  - Adicionar constantes `COR_DIURNO` e `COR_NOTURNO` exportadas.
  - Nova função `classificarPeriodo(horaInicio, minutoInicio, duracaoHoras)` → `"dia" | "noite"` usando **meio do plantão**: se o midpoint cair entre 20:00 e 05:59 → noite, senão dia.
  - `loadEscalas()` migra automaticamente: sobrescreve `regra.cor` (e `alternada` implícita) com a cor calculada pelo período de cada turno. Escalas com alternada (12x24/12x48) já ficam com 2 cores certas porque cada turno é classificado independente.
- `src/lib/escala-presets.ts`: presets deixam de definir cor (calculada dinamicamente).
- `src/components/escala-config-modal.tsx`: remover seletor de cor da UI. Mostrar preview "Este plantão será exibido em 🌞 laranja / 🌙 azul-marinho" calculado a partir do horário.
- `ESCALA_CORES` (paleta antiga) pode ser removida.

Marcas (Dejem/Delegada) continuam com suas cores próprias — só as **escalas de trabalho** ficam limitadas a dia/noite.

## 3. Emoji sol/lua na célula

Como agora o contorno já indica período pela cor, o emoji fica opcional:
- Manter emoji pequeno no canto inferior direito da célula para acessibilidade (daltônicos).
- Usar a nova função `classificarPeriodo` (não mais `isNoturno(horaInicio)` simples).

## 4. Melhorias inspiradas no Plantão Fácil

Selecionei o que faz sentido e ainda não existe no app:

**a) Contador de horas do mês** (badge no topo do calendário)
- "Julho: 168h trabalhadas · 12 plantões" calculado a partir das regras.

**b) Toque no dia mostra resumo rápido**
- Já existe modal do dia — adicionar total de horas e valor estimado (se usuário informou valor/hora nas configurações).

**c) Exportar mês para .ics (Google/Apple Calendar)**
- Botão "Exportar" no header do calendário → gera `.ics` com todos os plantões do mês visível. Zero dependências externas (string builder).

**d) Anotação livre por dia**
- Já existe `evento-livre-modal` — expor um atalho "Adicionar nota" no modal do dia junto de "Configurar escala".

**e) Modo compacto vs. expandido**
- Toggle no header: compacto (só contorno) ou expandido (mostra "Dia" / "Noite" em texto pequeno abaixo do número na célula).

**f) Ir para hoje**
- Botão discreto "Hoje" ao lado da navegação do mês (só aparece quando o cursor não está no mês corrente).

Escopo desta implementação: **a, c, f** de cara (baixo custo, alto valor). **b, d, e** ficam como próxima rodada se quiser.

## Detalhes técnicos

- **Migração de cores**: rodada uma vez em `loadEscalas()`. Se `regra.cor` não for `#F59E0B` ou `#1E3A8A`, recalcula e persiste via `saveEscalas`.
- **Borda dividida** (dia+noite mesma data): 
  ```css
  border: 2px solid transparent;
  background: 
    linear-gradient(#fff,#fff) padding-box,
    linear-gradient(180deg, #F59E0B 50%, #1E3A8A 50%) border-box;
  ```
- **Corte noturno**: midpoint = `inicio + duracao/2`. Noturno se `midpoint.hour >= 20 || midpoint.hour < 6`.
- **.ics**: função pura em `src/lib/escala-ics.ts`, download via `Blob` + `<a download>`.
- Nenhuma mudança de banco de dados. Tudo localStorage.

## Arquivos afetados

```text
src/components/escala-calendar-card.tsx   (visual + botão exportar + botão hoje + contador)
src/components/escala-config-modal.tsx    (remove seletor de cor)
src/lib/escala-trabalho.ts                (classificarPeriodo, migração, constantes)
src/lib/escala-presets.ts                 (limpa cores)
src/lib/escala-ics.ts                     (novo — gerador .ics)
```
