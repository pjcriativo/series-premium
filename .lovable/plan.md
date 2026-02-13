

# Adicionar botao "Trocar Imagem" nos banners da tabela

## O que sera feito

Adicionar um botao de troca de imagem diretamente na linha de cada banner na tabela, sem precisar abrir o modal de edicao completo. Ao clicar, um input de arquivo invisivel sera acionado, o upload sera feito para o Storage e o `image_url` do banner sera atualizado automaticamente.

## Alteracoes no arquivo `src/components/admin/BannerManager.tsx`

### 1. Input de arquivo oculto com ref
- Adicionar um `useRef` para um input file invisivel
- Adicionar um estado `changingImageId` para saber qual banner esta tendo a imagem trocada

### 2. Funcao `handleChangeImage`
- Recebe o banner ID e dispara o clique no input file oculto
- No `onChange` do input, faz upload para `covers/banners/` no Storage
- Atualiza o campo `image_url` do banner diretamente via `supabase.from("banners").update()`
- Invalida a query para atualizar a tabela
- Exibe toast de sucesso

### 3. Botao na coluna de acoes
- Adicionar um botao com icone `ImageIcon` (ou `RefreshCw`) entre o botao de editar e o de excluir
- Tooltip ou title "Trocar imagem"
- Mostra spinner/disabled enquanto faz upload

### 4. Preview no modal de edicao
- Manter o comportamento atual: ao editar, a imagem aparece com o input file abaixo para trocar
- Adicionar um botao "Remover imagem" que limpa o `image_url` do form

## Detalhes tecnicos

```text
Fluxo:
  Clique no botao "Trocar imagem" na tabela
    -> Abre file picker nativo
    -> Upload para covers/banners/{uuid}.{ext}
    -> UPDATE banners SET image_url = nova_url WHERE id = banner_id
    -> Invalidate query -> tabela atualiza
```

Arquivos modificados: apenas `src/pages/admin/BannerManager.tsx`

