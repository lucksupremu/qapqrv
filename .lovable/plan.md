## Objetivo

Refinar a tela `/anyconnect` para deixar o passo a passo mais dinâmico e fácil de seguir, mantendo as imagens existentes (passo-1 a passo-6) como referência visual, e adicionar um botão para copiar o endereço do servidor `extranet.policiamilitar.sp.gov.br`.

## Alterações em `src/routes/anyconnect.tsx`

### 1. Reformular cada passo
Trocar os textos longos por estrutura escaneável:
- **Título curto** (ex.: "Abra o menu", "Vá em Configurações", "Mantenha o padrão", "Acesse PMESP", "Confira o servidor", "Preferências avançadas")
- **Descrição enxuta** em 1 linha
- **Chips/destaques** com os valores exatos a conferir (ex.: `Descrição: PMESP`, `Servidor: extranet…`, `Certificado: Desabilitado`, `Auth: EAP-AnyConnect`)
- Ícone numerado grande (badge "1/6") sobreposto ao card

### 2. Botão "Copiar servidor"
- Aparece **sempre** num bloco fixo logo acima do carrossel (visível em todos os passos, já que é a informação-chave da configuração)
- Também aparece em destaque dentro do passo 5 (onde o usuário digita o servidor)
- Usa `navigator.clipboard.writeText("extranet.policiamilitar.sp.gov.br")`
- Feedback visual: ícone troca de `Copy` para `Check` por ~2s + texto "Copiado!" (estado local `copied`)
- Layout: caixa branca com label "Servidor", o endereço em fonte mono, e o botão à direita

### 3. Dinamismo / UX
- **Swipe horizontal por toque**: adicionar handlers `onTouchStart/onTouchEnd` para trocar passo arrastando (threshold ~50px)
- **Barra de progresso** fina acima dos dots (`width: ((step+1)/total)*100%`) com transição suave
- **Animação de entrada** do texto a cada passo: fade + slide (`key={step}` num wrapper com classes utilitárias já existentes ou inline `animation`)
- **Teclas ←/→** para navegar (listener em `useEffect`)
- **Auto-scroll ao topo** do card ao trocar de passo
- Botão "Próximo" vira "Abrir AnyConnect" no último passo (consolidando o CTA, em vez de duplicar com o botão fixo) — manter ainda o botão fixo inferior "Abrir AnyConnect" como já existe

### 4. Acessibilidade
- `aria-live="polite"` no bloco de texto do passo atual
- `aria-label` no botão copiar incluindo estado ("Copiar endereço do servidor" / "Endereço copiado")

## Sem mudanças
- Imagens (`passo-1.jpg` a `passo-6.jpg`) permanecem as mesmas
- `openAnyConnect` e botão fixo inferior continuam iguais
- Sem novas dependências, sem mudanças de rota/backend

## Detalhes técnicos
- Apenas frontend, um arquivo editado: `src/routes/anyconnect.tsx`
- Ícones novos do `lucide-react`: `Copy`, `Check` (já instalado)
- Cores via tokens inline existentes no arquivo (mesma paleta `#2e6b8a`, `#e8f0f8`, etc.)
