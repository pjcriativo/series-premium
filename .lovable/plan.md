
# Hover Overlay nos Cards (Estilo ReelShort)

## O que sera feito

Ao passar o mouse sobre um card de serie, aparecera um overlay na parte inferior com:
- **Categoria** da serie (ex: "Romance", "Drama")
- **Sinopse** truncada (2-3 linhas)
- **Botao "Play"** estilizado em rosa/primary
- **Icones** de favoritar e compartilhar (decorativos por enquanto)

## Alteracoes

### 1. Buscar `synopsis` na query (`Index.tsx`)

A tabela `series` ja possui o campo `synopsis`. Basta adicionalo ao SELECT da query `browse-series`:

```
.select("id, title, cover_url, synopsis, category_id, categories:category_id(name), episodes(id)")
```

### 2. Passar `synopsis` para o `SeriesCard` via `CategoryRow`

Atualizar a interface `SeriesCardProps` para incluir `synopsis`:

```typescript
series: {
  id: string;
  title: string;
  cover_url: string | null;
  category_name?: string | null;
  episode_count?: number;
  synopsis?: string | null;  // novo campo
};
```

### 3. Redesenhar o `SeriesCard.tsx` com hover overlay

Substituir o gradiente atual por um overlay que aparece no hover, contendo:

- Categoria em texto pequeno (usa `category_name` que ja existe na prop)
- Synopsis truncada com `line-clamp-3`
- Botao "Play" com icone, estilizado em primary (rosa)
- Icones de estrela e compartilhar ao lado do botao
- Transicao suave com `opacity-0 group-hover:opacity-100`
- Fundo semi-transparente escuro (`bg-black/80`)

O overlay so aparece em telas desktop (hidden em mobile via `md:group-hover:opacity-100`).

### 4. Remover o `hover:scale-105` do card

No ReelShort, o card nao aumenta de tamanho no hover - apenas o overlay aparece. O zoom sera removido para evitar sobreposicao visual.

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Adicionar `synopsis` ao SELECT da query |
| `src/components/SeriesCard.tsx` | Adicionar overlay com play, sinopse e icones no hover |
| `src/components/CategoryRow.tsx` | Passar `synopsis` no objeto de serie |

## Detalhes Tecnicos

O overlay fica posicionado na parte inferior do card (`absolute bottom-0`) com padding e ocupa cerca de metade da altura do card. A animacao usa classes Tailwind nativas (`transition-opacity duration-300`). Os icones de estrela e compartilhar serao do Lucide (`Star`, `Share2`). O botao Play navega para `/series/{id}`.
