Do I know what the issue is? Sim.

O navegador interno atual ainda usa Android WebView. Em muitos aparelhos Samsung/Android, esse WebView é fornecido pelo Chrome/Android System WebView; se ele estiver bloqueado, desatualizado ou com problema de rede, o app abre a Activity, mostra a barra superior e o conteúdo fica branco — exatamente como na imagem.

Plano de correção definitiva:

1. Trocar o motor do navegador interno
   - Substituir o uso de `android.webkit.WebView` por `Mozilla GeckoView`, o mesmo motor usado pelo Firefox.
   - Isso remove a dependência prática do Chrome/Android System WebView.
   - Manter tudo dentro do app, sem abrir navegador externo.

2. Manter a estrutura de navegador normal dentro do aplicativo
   - Barra superior com título, recarregar e fechar.
   - Barra inferior com voltar e avançar.
   - Suporte a JavaScript, cookies, DOM storage, redirecionamentos e páginas de login.
   - Links `target=_blank` / popups devem abrir na mesma aba interna, não em tela branca.

3. Corrigir iNotes, folha e demais links
   - `Email iNotes` e `Folha de Pagamento` abrirão direto no GeckoView interno.
   - Links da intranet continuarão abrindo no mesmo navegador interno quando a VPN estiver ativa.
   - Quando a VPN estiver desligada em link de intranet, exibir erro claro em vez de tela branca.

4. Preservar PDFs de escala
   - Consulta de escala continuará abrindo o fluxo de PDF.
   - O PDF continuará sendo baixado automaticamente e registrado em `Escalas baixadas`.
   - O visualizador offline já criado continuará sendo usado para abrir PDFs salvos sem internet.

5. Ajustar build Android
   - Atualizar `android-plugin/install.sh` para adicionar a dependência do GeckoView e o repositório Maven da Mozilla.
   - Instalar/copiar a nova Activity Kotlin no projeto Android durante o build do APK.
   - Manter permissões de internet, cleartext para domínios PMESP e aceleração de hardware.

Arquivos previstos:

```text
android-plugin/InAppWebViewActivity.kt
android-plugin/install.sh
android-plugin/InAppWebViewPlugin.kt, se precisar adaptar extras
src/lib/in-app-browser.ts, se precisar ajustar user-agent/título
APK-BUILD.md, apenas para documentar que o APK agora usa GeckoView/Firefox engine
```

Resultado esperado após novo APK:

- iNotes não fica mais em tela branca.
- Folha de pagamento abre no navegador interno.
- Marcar/Desmarcar, Agenda e Delegada abrem no navegador interno com VPN ligada.
- Consulta de escala baixa o PDF e aparece em `Escalas baixadas`.
- O app não depende mais do Chrome para renderizar páginas internas.