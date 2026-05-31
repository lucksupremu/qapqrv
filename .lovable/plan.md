## Plano: Carrossel do Guia AnyConnect com as imagens reais

### O que será feito

1. **Copiar as 6 imagens** de `user-uploads://` para `src/assets/anyconnect/`:
   - `passo-1.jpg` … `passo-6.jpg`

2. **Limpeza leve (sem IA generativa)** com ImageMagick:
   - `convert <in> -trim +repage -resize 720x -strip -quality 88 <out>` em cada imagem.
   - Remove bordas pretas uniformes em volta, padroniza largura em 720px e mantém proporção. Texto e setas vermelhas ficam **intactos**.

3. **Atualizar `src/routes/anyconnect.tsx`**:
   - Importar as 6 imagens como módulos (`import passo1 from "@/assets/anyconnect/passo-1.jpg"` …).
   - Trocar o array `PASSOS` para `{ src, alt, texto }`.
   - Substituir o bloco placeholder colorido por um `<img>` real (mantendo o container 280px de altura, com `object-contain` e fundo claro).
   - Adicionar `alt` descritivo para acessibilidade.

4. **Textos dos 6 passos** (revisados conforme as setas das imagens):
   1. Abra o Cisco Secure Client e toque nos 3 pontos (⋮) no canto superior direito.
   2. No menu, toque em **Configurações**.
   3. Confirme as opções padrão (todas desmarcadas) — não altere nada e volte.
   4. De volta à tela inicial, toque em **Conexões → PMESP**.
   5. No Editor de conexão, confirme **Descrição: PMESP** e **Servidor: extranet.policiamilitar.sp.gov.br**, depois toque em **Preferências avançadas**.
   6. Em Preferências avançadas, confirme **Certificado: Desabilitado** e **Autenticação: EAP‑AnyConnect**, então toque em **Concluído** ✓.

### Fora do escopo
- Não regenerar imagens com IA (risco de quebrar texto/ícones).
- Não mudar o layout do carrossel nem a navegação por passos.