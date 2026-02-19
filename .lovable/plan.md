
# Thumbnail de Imagem na Lista de Posts — FanClubManager

## Situação Atual

Cada card de post (linhas 342–362) renderiza:

```
[ bloco de texto (título, badge, corpo, comentários) ]  [ 🗑 botão ]
```

Posts com `image_url` não exibem nenhum indicador visual de que têm imagem.

## Mudança Proposta

Adicionar um **thumbnail quadrado** (48×48 px) à esquerda do bloco de texto, visível apenas quando `post.image_url` existe. Posts sem imagem mantêm o layout atual.

Layout resultante:

```
[ 🖼 thumb 48×48 ]  [ bloco de texto (título, badge, corpo, comentários) ]  [ 🗑 botão ]
```

### Detalhes do thumbnail

- Tamanho: `w-12 h-12` (48 px) com `shrink-0`
- Forma: `rounded-lg` com `object-cover` para não distorcer
- Fallback: se a imagem falhar ao carregar (`onError`), exibe um placeholder cinza com ícone `ImageIcon` de `lucide-react` (já importado)
- Apenas renderizado quando `post.image_url` é truthy

## Arquivo Alterado

**`src/pages/admin/FanClubManager.tsx`** — somente o bloco `flex items-start gap-3` dentro do `.map()` (linhas 343–361):

```tsx
<div className="flex items-start gap-3">
  {/* NOVO: thumbnail à esquerda */}
  {post.image_url && (
    <img
      src={post.image_url}
      alt=""
      className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  )}

  {/* bloco de texto — sem alteração */}
  <div className="flex-1 min-w-0">
    ...
  </div>

  {/* botão de lixeira — sem alteração */}
  <button ...>
    <Trash2 className="h-4 w-4" />
  </button>
</div>
```

### Por que `onError` em vez de placeholder?

O `onError` esconde a tag `<img>` se a URL for inválida ou o arquivo tiver sido deletado do Storage, evitando um ícone quebrado sem precisar adicionar estado extra ao componente.

## Resumo

| Aspecto | Antes | Depois |
|---|---|---|
| Posts com imagem | Sem indicação visual | Thumbnail 48×48 à esquerda |
| Posts sem imagem | Layout normal | Layout normal (sem mudança) |
| Imagem quebrada | N/A | `<img>` ocultada via `onError` |
| Novos imports | N/A | Nenhum — `ImageIcon` já está importado |

Nenhuma alteração de banco, migration ou query — `image_url` já é retornado pelo `select("*")` existente na linha 290.
