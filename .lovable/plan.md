

# Botao "Assistir" do banner: ir direto para o episodio

## Problema atual
O botao "Assistir" no HeroSlider navega para `/series/:id` (pagina de detalhes da serie), que mostra a imagem da capa esticada/distorcida. No site de referencia, o clique leva direto ao player do episodio.

## Solucao

### 1. Buscar o primeiro episodio de cada serie do banner (Index.tsx)
Na query de banners em `src/pages/Index.tsx`, apos obter os banners, buscar o primeiro episodio publicado de cada serie vinculada. Passar o `first_episode_id` como parte dos dados do banner para o HeroSlider.

### 2. Atualizar o HeroSlider para navegar ao episodio (HeroSlider.tsx)
- Adicionar `first_episode_id` na interface `Banner`
- Alterar o `onClick` do botao "Assistir" (linha 73):
  - Se tiver `first_episode_id`, navegar para `/watch/${first_episode_id}`
  - Senao (fallback), manter navegacao para `/series/${link_series_id}`

## Detalhes tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Index.tsx` | Apos query de banners, buscar primeiro episodio (episode_number = 1, is_published = true) de cada serie vinculada e injetar `first_episode_id` nos dados |
| `src/components/HeroSlider.tsx` | Adicionar `first_episode_id` na interface Banner; alterar navegacao do botao para `/watch/${first_episode_id}` quando disponivel |

## Fluxo resultante

- Usuario clica "Assistir" no banner -> vai direto para `/watch/:episodeId` (player do primeiro episodio)
- SeriesCard nas categorias continua levando para `/series/:id` normalmente (para navegar entre episodios)

