
# Melhorar "Continue Assistindo": ir direto ao episódio exato

## Situação atual

A query `continueWatching` em `src/pages/Index.tsx` (linha 19-31) busca:
- `series_id`
- `last_episode_number`
- dados da série (id, title, cover_url)

O `<Link>` na linha 204 usa `to={`/series/${item.series.id}`}` — leva para a página da série, não para o player do episódio exato onde o usuário parou.

## Causa raiz

O `episode_id` do episódio onde o usuário parou nunca é buscado. A tabela `user_progress` armazena `last_episode_number`, não `episode_id` diretamente — então precisamos fazer um join/lookup adicional para obter o `episode_id` correto.

## Solução

### Passo 1 — Enriquecer a query `continueWatching`

Após buscar o `user_progress`, fazer um segundo fetch na tabela `episodes` para obter os `episode_id`s correspondentes a cada `(series_id, last_episode_number)`:

```ts
// Após buscar user_progress:
const seriesEpPairs = (data || []).map((item: any) => ({
  series_id: item.series_id,
  ep_number: item.last_episode_number,
}));

// Buscar todos os episódios correspondentes de uma vez
const { data: episodeIds } = await supabase
  .from("episodes")
  .select("id, series_id, episode_number")
  .in("series_id", seriesEpPairs.map(p => p.series_id))
  .eq("is_published", true);

// Montar mapa: series_id + episode_number => episode_id
const epMap = new Map(
  (episodeIds || []).map((ep: any) => [`${ep.series_id}-${ep.episode_number}`, ep.id])
);

return (data || []).map((item: any) => ({
  ...item,
  resume_episode_id: epMap.get(`${item.series_id}-${item.last_episode_number}`) || null,
}));
```

### Passo 2 — Atualizar o `<Link>` do card

```tsx
// Antes (linha 204):
<Link to={`/series/${item.series.id}`} ...>

// Depois:
<Link
  to={item.resume_episode_id
    ? `/watch/${item.resume_episode_id}`
    : `/series/${item.series.id}`}
  ...
>
```

O fallback `/series/:id` é mantido para o caso de nenhum `episode_id` ser encontrado (ex.: episódio despublicado).

## Resumo das mudanças

| Arquivo | Onde | Mudança |
|---|---|---|
| `src/pages/Index.tsx` | Query `continueWatching` | Adicionar segundo fetch para mapear `(series_id, episode_number)` → `episode_id` |
| `src/pages/Index.tsx` | `<Link>` do card "Continue Assistindo" | Usar `resume_episode_id` para ir direto ao player |

## O que NÃO será alterado
- Estrutura do carrossel "Continue Assistindo"
- Badge "Ep. X" que já aparece no card
- Qualquer outra seção da home
- Lógica de progresso e salvamento
