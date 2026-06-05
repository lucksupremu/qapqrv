O erro não é do PDF nem do ID. É diferença entre navegador e APK:

- No navegador/Chrome, o certificado da intranet é aceito pelo próprio navegador, ou ele consegue contornar/usar a sessão da VPN.
- No APK, o download é feito por código nativo (`HttpURLConnection`). Esse caminho é mais rígido e está recusando o certificado da intranet/VPN: `Trust anchor for certification path not found`.
- Quando antes abria em branco, era porque a WebView até entrava no link, mas Android WebView não renderiza PDF direto.

Do I know what the issue is? Sim. O problema é a validação TLS/certificado no download nativo do APK para o domínio da intranet da PMESP.

Plano de correção:

1. Criar configuração de segurança de rede do Android
- Adicionar um `network_security_config.xml` no build Android.
- Permitir, para `policiamilitar.sp.gov.br` e subdomínios, certificados do sistema e certificados instalados no aparelho/VPN.
- Registrar essa configuração no `AndroidManifest.xml` pelo `install.sh`.

2. Blindar o downloader nativo da escala
- Ajustar `InAppWebViewPlugin.downloadPdf` para aplicar a correção apenas nos domínios oficiais da PMESP.
- Manter a validação de que o arquivo baixado começa com `%PDF`, para não salvar página de login/erro como se fosse PDF.
- Se o servidor retornar HTML, mensagem clara: sessão expirada, login/VPN necessário.

3. Eliminar definitivamente a tela branca nesse fluxo
- No botão amarelo de pesquisa por ID, o APK não vai abrir navegador/WebView como fallback.
- Fluxo final: pesquisar ID -> baixar PDF -> salvar em “Escalas Baixadas” -> abrir com app PDF do aparelho.
- Se falhar, apenas mostrar erro útil; não abrir tela branca.

4. Melhorar mensagem de erro para o usuário
- Trocar o erro técnico Java por uma mensagem em português, por exemplo:
  “Não foi possível validar o acesso à intranet. Confirme a VPN ativa e tente novamente.”
- Guardar o detalhe técnico só no log do Android, não no alerta principal.

Arquivos a ajustar:
- `android-plugin/InAppWebViewPlugin.kt`
- `android-plugin/install.sh`
- `src/routes/index.tsx`

Resultado esperado: no APK, pesquisar a escala por ID não abre navegador branco; baixa o PDF, salva em Escalas Baixadas e oferece abrir no app de PDF do celular.