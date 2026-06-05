Do I know what the issue is? Sim.

O problema real é: o PDF está baixando, mas o app tenta abrir com um leitor externo via Intent Android. Quando essa abertura falha por qualquer motivo, o código mostra a mensagem incorreta “não há leitor de PDF disponível”, mesmo que exista leitor instalado. Além disso, depender de app externo/Google/Chrome pode voltar para tela branca ou não receber permissão para ler o arquivo local.

Plano de correção:

1. Criar um visualizador de PDF nativo dentro do próprio app
   - Adicionar uma Activity Android própria para visualizar PDFs salvos.
   - Usar o renderizador nativo do Android para desenhar as páginas do PDF dentro do app.
   - Assim o APK não depende mais de leitor externo instalado no aparelho.

2. Alterar a abertura após baixar a escala
   - Depois de `downloadPdf`, abrir automaticamente o PDF no visualizador interno.
   - Manter o arquivo salvo em “Escalas baixadas”.
   - Não abrir navegador nem WebView branca ao pesquisar pelo ID.

3. Corrigir “Escalas baixadas”
   - Ao tocar em “Abrir”, usar o mesmo visualizador interno.
   - Se for uma escala antiga sem caminho local, baixar novamente e abrir no visualizador interno.

4. Manter fallback externo apenas como emergência
   - Se o visualizador interno falhar, aí sim tentar abrir com apps externos como Google/Chrome/leitor de PDF.
   - Trocar a mensagem de erro para mostrar o erro real, sem afirmar falsamente que não há leitor.

5. Ajustar o instalador Android
   - Garantir que a nova Activity do leitor PDF seja copiada e registrada no APK.
   - Preservar o FileProvider e o download nativo já existentes.

Resultado esperado:

- Inserir o ID e tocar no botão amarelo baixa o PDF.
- O PDF abre imediatamente dentro do app.
- A escala aparece em “Escalas baixadas”.
- Não abre navegador branco.
- Não aparece mais a mensagem falsa dizendo que não existe leitor de PDF.