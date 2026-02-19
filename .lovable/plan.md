
# Correção — Série Recém-Cadastrada Não Aparece no Formulário de Episódio

## Diagnóstico Completo

### Problema Principal: Cache não invalidado

Quando o admin cadastra uma nova série em `SeriesForm.tsx`, o `onSuccess` invalida:
- `["admin-series"]` — query do gerenciador de séries
- `["admin-series-detail"]` — query de detalhe de uma série

Mas **não invalida** `["admin-series-list"]`, que é a query usada pelo `EpisodeForm` e `EpisodeManager` para popular o select de séries. O React Query mantém esses dados em cache e não refaz a busca — por isso a série nova não aparece na lista.

### Problema Secundário: staleTime padrão

Sem configuração de `staleTime`, o React Query considera os dados "fresh" por 0ms — porém, como a query não foi invalidada, o cache antigo permanece sem disparar novo fetch até que o componente seja desmontado e remontado.

## Mudanças

### 1. `src/pages/admin/SeriesForm.tsx` — invalidar `admin-series-list` no `onSuccess`

Adicionar uma linha no `onSuccess` da `saveMutation`:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["admin-series"] });
  queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] });
  queryClient.invalidateQueries({ queryKey: ["admin-series-list"] }); // ← NOVA LINHA
  toast({ title: id ? "Série atualizada" : "Série criada" });
  navigate("/admin/series");
},
```

### 2. `src/pages/admin/EpisodeForm.tsx` — adicionar `staleTime: 0` e `refetchOnMount: "always"` na query de séries

Garantir que toda vez que o formulário de episódio é aberto, a lista de séries é sempre buscada do servidor:

```typescript
const { data: seriesList } = useQuery({
  queryKey: ["admin-series-list"],
  queryFn: async () => {
    const { data, error } = await supabase.from("series").select("id, title").order("title");
    if (error) throw error;
    return data;
  },
  staleTime: 0,           // ← dados sempre considerados desatualizados
  refetchOnMount: "always", // ← revalida sempre que o componente monta
});
```

### 3. `src/pages/admin/EpisodeManager.tsx` — mesma correção na query de séries

A mesma query `admin-series-list` existe no gerenciador de episódios para popular o filtro por série:

```typescript
const { data: seriesList } = useQuery({
  queryKey: ["admin-series-list"],
  queryFn: async () => { ... },
  staleTime: 0,
  refetchOnMount: "always",
});
```

## Por Que Três Mudanças?

| Arquivo | Mudança | Motivo |
|---|---|---|
| `SeriesForm.tsx` | Invalidar `admin-series-list` | A fonte do dado: quando uma série é salva, todos os consumidores da lista devem ser notificados |
| `EpisodeForm.tsx` | `staleTime: 0` + `refetchOnMount` | Defesa secundária: garante que ao abrir o form, a lista sempre reflete o estado atual do banco |
| `EpisodeManager.tsx` | `staleTime: 0` + `refetchOnMount` | Mesma defesa para o filtro de séries no gerenciador de episódios |

## Arquivo Alterados

- `src/pages/admin/SeriesForm.tsx` — 1 linha adicionada no `onSuccess`
- `src/pages/admin/EpisodeForm.tsx` — 2 propriedades adicionadas na query `admin-series-list`
- `src/pages/admin/EpisodeManager.tsx` — 2 propriedades adicionadas na query `admin-series-list`

Nenhuma alteração de banco de dados necessária.
