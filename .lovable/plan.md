
# Diagnóstico: Cache do preview — o código já está correto

## O que foi encontrado

Ao ler o arquivo `src/pages/admin/FanClubManager.tsx`, o código **já contém toda a implementação de upload** solicitada:

- Linha 114: `useState<File | null>(null)` para o arquivo
- Linha 115: `useState<string | null>(null)` para o preview
- Linha 116: `useState(false)` para o estado de upload
- Linhas 118–122: `handleImageChange` que gera preview local via `URL.createObjectURL`
- Linhas 124–130: `uploadImage` que envia para `covers/fan-club/` no Supabase Storage
- Linhas 201–231: UI completa com área clicável tracejada e `ImageIcon`, preview com botão `X`

## Por que o preview ainda mostra o campo de URL antiga

O preview do browser está mostrando uma versão em **cache** do componente. O arquivo fonte já foi atualizado corretamente — o Vite HMR (Hot Module Replacement) às vezes não reaplica mudanças quando o componente estava montado antes da edição ser salva.

## Solução

Fazer um **ajuste mínimo no arquivo** (reformatar um comentário interno) para forçar o Vite a recompilar e recarregar o módulo `FanClubManager.tsx` no preview. Isso vai garantir que o browser carregue a versão mais recente com o seletor de arquivo.

Nenhuma mudança de lógica ou UI é necessária — o código já está implementado corretamente. Apenas forçar o reload do módulo.

## Arquivo a ser alterado

- `src/pages/admin/FanClubManager.tsx` — ajuste mínimo no comentário da seção `New post form` para triggerar HMR
