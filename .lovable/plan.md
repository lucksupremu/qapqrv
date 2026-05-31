# Plano: Nova versão do QAP, QRV! — Foco em Consulta de Escala

## Visão geral

O projeto já possui a base montada (TanStack Start, Splash com AdSlot, tela `/inicio` com grid de cards, ferramenta "Minha Localização" funcional, header, bottom nav, favoritos e histórico). Esta entrega adiciona a ferramenta principal **Consulta de Escala DEJEM / Delegada** e prepara os demais cards como "Em desenvolvimento", mantendo a arquitetura modular para crescer sem refatorar.

## Escopo desta entrega

1. **Splash Screen**: ajustar contagem regressiva de 3s → **5s** (requisito do briefing).
2. **Tela inicial**: garantir que **Consulta de Escala seja o primeiro card**, seguido por Minha Localização (já pronta) e demais cards marcados como "Em desenvolvimento".
3. **Ferramenta Consulta de Escala** (nova rota `/ferramenta/consulta-escala`):
   - Campo numérico para ID da escala (somente dígitos, validação com Zod).
   - Botão "Consultar".
   - Stub da lógica de consulta (`consultarEscala(id)` em `src/lib/escala.ts`) retornando dado mock por enquanto — pronto para plugar API real depois.
   - Área de resultado em cartões: ID, Tipo, Data, Horário inicial, Horário final, Qtd. horas, Unidade, Valor da hora, Valor total previsto.
   - Persistência em **IndexedDB** (via `idb-keyval`) das consultas realizadas.
   - Seção "Consultas Recentes" abaixo do formulário com ações: reabrir, favoritar, excluir.
   - Sistema de favoritos integrado ao `/favoritos` existente.
4. **Cards "Em desenvolvimento"**: BOPM Token, Bloco de Notas, Telefones Úteis, Códigos Q, Escalas, Checklist Operacional, CTB Rápido, Hospitais Próximos, Delegacias Próximas — todos passando pela rota genérica `/ferramenta/$slug` que já exibe estado de "em construção".
5. **PWA-ready / Capacitor-ready**: adicionar `manifest.webmanifest` simples (ícone, nome, `display: standalone`, theme color) — sem service worker, conforme diretriz. Deixar o projeto pronto para `npx cap add android` futuramente (sem instalar Capacitor agora).

## Estrutura de arquivos

```text
src/
  lib/
    tools.ts                 (atualizar ordem + flags em-desenvolvimento)
    escala.ts                (novo: tipos + consultarEscala stub)
    escala-storage.ts        (novo: IndexedDB via idb-keyval)
  hooks/
    use-escala-historico.ts  (novo: histórico + favoritos reativos)
  routes/
    index.tsx                (splash: 3s → 5s)
    ferramenta.consulta-escala.tsx  (novo)
    ferramenta.$slug.tsx     (já trata "em desenvolvimento")
public/
  manifest.webmanifest       (novo)
```

## Detalhes técnicos

- **Armazenamento**: `idb-keyval` (leve, ~600B) com chaves `escala:historico` e `escala:favoritos`. Limite de 50 itens no histórico (FIFO).
- **Validação**: Zod schema `z.string().regex(/^\d+$/).min(1).max(12)`.
- **UI**: Reutiliza tokens semânticos de `src/styles.css` (`brand-navy`, `brand-blue`, `--shadow-card`). Cards com `rounded-2xl`, sombras suaves, ícone `CalendarClock` (lucide).
- **Resultado**: Componente `<EscalaResultCard>` exibindo os 9 campos em duas colunas; botão "Favoritar" e "Nova consulta".
- **Recentes**: Lista com swipe-actions simples (botões inline reabrir / ★ / 🗑) — sem libs adicionais.
- **Consulta stub**: retorna `Promise<Escala | null>` com `setTimeout` de 600ms simulando rede; documentado onde plugar a API real depois.
- **Favoritos globais**: `/favoritos` lista todas as ferramentas favoritadas + consultas favoritadas (mescla as duas fontes).
- **SEO**: `head()` por rota com title e description específicos.

## Fora de escopo (próximas iterações)

- Integração real da API de Consulta de Escala (apenas stub agora).
- Implementação efetiva dos demais módulos (ficam como "Em desenvolvimento").
- Capacitor / AdMob / Firebase Push / AdSense — apenas estrutura preparada, sem instalação.
- Service worker / offline cache.

## Critérios de aceitação

- Splash conta 5s e habilita "Continuar".
- Card "Consulta de Escala" aparece em primeiro na tela inicial.
- Inserir ID numérico + consultar exibe resultado mockado nos 9 campos.
- Consulta aparece em "Consultas Recentes" e persiste após reload.
- Favoritar/desfavoritar e excluir funcionam.
- Demais cards abrem a página genérica "Em desenvolvimento".
- Nenhum erro de console; build passa.
