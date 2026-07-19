Plano para aumentar a conformidade com AdSense:

1. Remover bloqueios que aparecem antes do conteúdo público
- Não redirecionar visitantes web para `/onboarding` automaticamente.
- Manter onboarding apenas no app nativo.
- Transformar o aviso de privacidade em um banner não bloqueante, para não esconder o conteúdo editorial da home, blog, manual e páginas institucionais.
- Não mostrar modais/prompts globais nas rotas públicas de conteúdo.

2. Garantir que o Google veja conteúdo real nas URLs indexáveis
- Considerar como conteúdo público: `/`, `/blog`, posts do blog, `/manual`, `/sobre`, `/contato`, `/privacidade` e `/termos`.
- Manter `noindex` dinâmico nas telas de ferramenta/app, mas sem aplicar nas páginas editoriais.
- Manter `robots.txt` e `sitemap.xml` apontando apenas para páginas indexáveis.

3. Remover qualquer impressão de “inventário de anúncio” antes da aprovação
- Remover o bloco visual de publicidade do manual enquanto `VITE_ADSENSE_ENABLED=false`.
- Manter o script AdSense e os slots sem renderizar até aprovação.

4. Verificar após implementar
- Testar `/`, `/manual`, `/blog`, `/sobre`, `/privacidade`, `/termos` e uma tela bloqueada como `/calendario`.
- Confirmar que páginas públicas abrem diretamente com conteúdo e telas de app continuam sem indexação.

Observação: não dá para garantir aprovação, porque a decisão é do Google, mas isso corrige o problema técnico visível agora: o domínio publicado entrega onboarding e modais antes do conteúdo, o que pode ser lido como conteúdo de baixo valor.