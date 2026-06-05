Vou corrigir o navegador interno com uma abordagem mais estável e observável:

1. Ajustar o GeckoView nativo
- Aplicar o User-Agent recebido do app na sessão do GeckoView.
- Ativar configurações essenciais de compatibilidade para páginas antigas/intranet.
- Garantir foco, visibilidade e carregamento correto do GeckoView após abrir a Activity.

2. Corrigir popups e novas janelas
- Trocar o tratamento atual de `onNewSession`, que pode deixar a tela branca, para carregar a nova URL na sessão atual sempre que possível.
- Manter iNotes, folha e links internos abrindo na mesma tela do navegador interno.

3. Adicionar fallback visual contra tela branca
- Mostrar uma mensagem dentro da própria Activity se o carregamento travar por tempo demais.
- Exibir botão para tentar novamente e dica de VPN quando for domínio da intranet.

4. Melhorar diagnóstico do APK
- Adicionar logs nativos claros no GeckoView: URL inicial, início/fim de carregamento, erros e popups.
- Assim, se ainda houver falha específica de VPN/certificado/site, o próximo log dirá exatamente onde parou.

5. Validar sem mexer no fluxo web
- Manter o app web e as rotas atuais como estão.
- A correção fica concentrada em `android-plugin/InAppWebViewActivity.kt` e, se necessário, em `android-plugin/install.sh` para permissões/configuração Android.