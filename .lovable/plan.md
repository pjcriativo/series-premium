
# Edição de Posts no FanClubManager

## Visão Geral

Será adicionado um botão de editar (ícone de lápis) ao lado do botão de excluir em cada card de post. Ao clicar, um Dialog (modal) abre pré-preenchido com os dados do post atual. O admin pode alterar título, corpo, tipo e imagem, e salvar via `UPDATE` no Supabase.

## Arquitetura da Solução

Tudo implementado em um único arquivo `src/pages/admin/FanClubManager.tsx`, sem novos arquivos. O modal de edição é um componente interno `EditPostDialog` que encapsula toda a lógica de estado e upload.

## Mudanças Detalhadas

### 1. Novos imports

- `Pencil` de `lucide-react` (ícone do botão de editar)
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` de `@/components/ui/dialog`

### 2. Novo estado em `FanClubManager`

```typescript
const [editPost, setEditPost] = useState<any | null>(null);
```

`editPost` guarda o objeto completo do post sendo editado. Quando `null`, o modal está fechado.

### 3. Novo componente `EditPostDialog`

Props: `post` (objeto do post), `open` (boolean), `onClose` (callback), `onSaved` (callback para invalidar queries).

Estado interno:
- `form` — título, corpo, tipo (inicializado com os valores do post)
- `imageFile` — novo arquivo selecionado (null = manter imagem atual)
- `imagePreview` — URL de preview (inicializada com `post.image_url`)
- `removeImage` — boolean: se true, a imagem atual será removida (image_url = null)
- `uploading` — estado de upload

Lógica de submit (`UPDATE`):
- Se `imageFile` existir → faz upload e salva nova URL
- Se `removeImage` for true → salva `image_url: null`
- Caso contrário → mantém `image_url` inalterada

Validação de arquivo: reaproveita as mesmas constantes `MAX_IMAGE_SIZE` e `ACCEPTED_TYPES` já definidas.

### 4. Botão de editar no card de post

Adicionado à direita, antes do botão de excluir:

```tsx
<button
  onClick={() => setEditPost(post)}
  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
>
  <Pencil className="h-4 w-4" />
</button>
```

### 5. Renderização do `EditPostDialog`

Adicionado ao final do JSX de `FanClubManager`, junto com o `AlertDialog` de exclusão existente:

```tsx
<EditPostDialog
  post={editPost}
  open={!!editPost}
  onClose={() => setEditPost(null)}
  onSaved={() => {
    qc.invalidateQueries({ queryKey: ["admin-fan-club-posts"] });
    qc.invalidateQueries({ queryKey: ["fan-club-posts"] });
  }}
/>
```

## Layout do Modal de Edição

```text
┌─────────────────────────────────────┐
│ Editar Post                    [X]  │
├─────────────────────────────────────┤
│ Tipo:    [Select ▼]                 │
│ Título:  [________________________] │
│ Conteúdo:[                        ] │
│          [                        ] │
│ Imagem:  [preview ou seletor]       │
│          [× Remover imagem]         │
├─────────────────────────────────────┤
│              [Cancelar] [Salvar]    │
└─────────────────────────────────────┘
```

## Comportamento de Imagem no Modal

| Situação | Ação do Admin | Resultado no DB |
|---|---|---|
| Post tem imagem, não mexe | — | `image_url` inalterado |
| Post tem imagem, clica "Remover" | `removeImage = true` | `image_url = null` |
| Post tem imagem, seleciona nova | novo `imageFile` | upload + nova URL |
| Post sem imagem, seleciona nova | novo `imageFile` | upload + nova URL |

## Arquivo Alterado

- `src/pages/admin/FanClubManager.tsx` — adição de imports, componente `EditPostDialog`, estado `editPost` e botão de editar no card

Nenhuma migration de banco é necessária — o campo `updated_at` já existe na tabela `fan_club_posts` e será atualizado automaticamente pelo `UPDATE`.
