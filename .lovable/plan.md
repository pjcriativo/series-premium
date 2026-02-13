
# Icone Play do SeriesCard: navegar direto para o episodio

## Problema
O icone de Play no hover do SeriesCard faz parte de um `<Link>` que aponta para `/series/:id` (pagina intermediaria). O usuario quer que ao clicar no Play, va direto para `/watch/:episodeId` do primeiro episodio.

## Solucao

### 1. Buscar o primeiro episodio de cada serie (Index.tsx)
Na query `browse-series`, apos obter as series, buscar o primeiro episodio publicado (`episode_number = 1`, `is_published = true`) de cada serie. Injetar `first_episode_id` nos dados da serie.

### 2. Passar `first_episode_id` pelo fluxo de dados
- Adicionar `first_episode_id` na interface de `CategoryRowProps` e `SeriesCardProps`
- Passar o campo de `Index.tsx` -> `CategoryRow` -> `SeriesCard`

### 3. Alterar o icone Play no SeriesCard (SeriesCard.tsx)
- Transformar o icone Play (linha 57-59) de `<span>` para um `<button>` ou `<a>` com `onClick` que:
  - Chama `e.preventDefault()` e `e.stopPropagation()` para nao acionar o `<Link>` pai
  - Navega para `/watch/${first_episode_id}` se disponivel
  - Fallback: navega para `/series/${series.id}` se nao houver episodio
- O restante do card (clicar na capa, titulo) continua levando para `/series/:id`

## Detalhes tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Buscar primeiro episodio de cada serie e adicionar `first_episode_id` ao objeto da serie no `categoryGroups` |
| `src/components/CategoryRow.tsx` | Adicionar `first_episode_id?: string` na interface e passar para SeriesCard |
| `src/components/SeriesCard.tsx` | Adicionar `first_episode_id` na interface; transformar icone Play em botao com navegacao direta para `/watch/:episodeId`; usar `useNavigate` |

## Fluxo resultante
- Clicar no icone Play do card -> vai direto para `/watch/:episodeId`
- Clicar em qualquer outra area do card -> continua indo para `/series/:id`
