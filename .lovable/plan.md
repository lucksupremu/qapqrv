## Plano para reativar a instalação PWA de forma completa

O problema principal aqui é que o app depende do evento nativo `beforeinstallprompt`, mas esse evento é único e hoje fica preso em estados locais de vários `usePwaInstall()`. Se ele dispara na Home, a tela de Configurações pode não receber o mesmo evento depois. Além disso, o item “Instalar app” está escondido quando `canPrompt` ainda não está pronto, então para o usuário parece que não existe opção.

Também há um limite do navegador: Firefox/Safari não permitem abrir o pop-up nativo de instalação com 1 toque como Chrome/Edge/Brave/Samsung. Neles dá para mostrar a opção de instalação, mas o navegador não entrega uma API para forçar o diálogo nativo.

## O que vou implementar

1. **Centralizar a instalação PWA em um único serviço global**
   - Criar um gerenciador único para capturar `beforeinstallprompt` uma vez e manter o evento disponível para qualquer tela.
   - Evitar que Home, menu lateral, banner e Configurações tenham estados separados e inconsistentes.

2. **Liberar o botão “Instalar app” para todos os usuários web não instalados**
   - O item “Instalar app” volta a aparecer no menu mesmo antes do `canPrompt` estar pronto.
   - A tela de Configurações sempre mostra a área de instalação quando o app não está instalado e não está rodando como APK.

3. **Instalação com 1 toque quando o navegador permitir**
   - Se `beforeinstallprompt` estiver disponível, o botão “Instalar agora” chama diretamente o diálogo nativo.
   - Depois de instalar, o card/banner somem automaticamente via evento `appinstalled`.

4. **Fallback sem tutorial longo para navegadores sem API nativa**
   - Para Chrome/Edge/Brave/Samsung: botão nativo.
   - Para iPhone/iPad: mensagem curta inevitável, porque a Apple não libera prompt automático.
   - Para Firefox/Safari/Outros: mostrar uma mensagem objetiva de incompatibilidade com instalação por 1 toque, sem passo-a-passo/tutorial.

5. **Melhorar o registro do Service Worker sem quebrar preview**
   - Manter registro apenas no app publicado/domínio real, nunca no preview/editor.
   - Registrar cedo o suficiente para Chrome considerar o app instalável.
   - Manter `/sw.js`, manifesto e ícones válidos.
   - Não mexer no APK nativo.

6. **Remover textos que mandam procurar menu do navegador**
   - Tirar mensagens como “abra o menu ⋮ e toque em instalar”, já que você não quer tutorial.
   - Substituir por botão nativo quando possível e fallback curto quando não for possível.

## Resultado esperado

- No Chrome/Edge/Brave/Samsung Android: tocar em **Instalar app** abre o pop-up nativo de instalação.
- No app já instalado/APK: a opção some.
- No Firefox/Safari: a opção aparece, mas informa de forma curta que esse navegador não permite instalação por 1 toque.
- O comportamento fica mais parecido com o app Sentinela porque o evento nativo passa a ser guardado globalmente e reaproveitado em qualquer tela.