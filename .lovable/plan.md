
# Corrigir Navegação: Clicar em Episódio vai direto para o Player

## Problema identificado

Ao clicar em qualquer card de série na home (carrosséis de categorias, "Em Alta", "Continue Assistindo"), o usuário é redirecionado para a página de detalhes da série (`/series/:id`) em vez de ir diretamente ao player do primeiro episódio (`/watch/:episodeId`).

### Causa raiz

**1. `src/components/SeriesCard.tsx` — linha 42**
```tsx
// ATUAL: leva para a página da série
<Link ref={ref} to={`/series/${series.id}`} className="group block w-full">
```
O card inteiro é um `<Link>` para `/series/:id`. O botão play no hover navega corretamente para `/watch/`, mas o clique no card em si vai para a série.

**2. `src/pages/Index.tsx` — linhas 203 e 243**
```tsx
// "Continue Assistindo" — leva para a série
<Link to={`/series/${item.series.id}`} ...>

// "Em Alta" — leva para a série
<Link to={`/series/${s.id}`} ...>
```

---

## Solução

### 1. `src/components/SeriesCard.tsx`
Alterar o `<Link>` principal do card para navegar direto para o player do primeiro episódio quando houver `first_episode_id`, e para `/series/:id` somente como fallback:

```tsx
// Antes:
<Link ref={ref} to={`/series/${series.id}`} ...>

// Depois:
<Link ref={ref} to={series.first_episode_id ? `/watch/${series.first_episode_id}` : `/series/${series.id}`} ...>
```

### 2. `src/pages/Index.tsx` — Seção "Continue Assistindo"
A seção de "Continue Assistindo" registra o último episódio assistido (`last_episode_number`). A navegação correta é buscar o episódio exato e ir para o player. Por ora, já que temos o `series_id`, a melhor opção é navegar para `/series/:id` mantendo o comportamento de "retomar" — esta seção **não precisa mudar**, pois ela leva corretamente para a página da série onde o usuário clica em "Retomar".

### 3. `src/pages/Index.tsx` — Seção "Em Alta"
O query de trending já busca `first_episode_id` para cada série. Alterar o link:

```tsx
// Antes:
<Link to={`/series/${s.id}`} ...>

// Depois:
<Link to={s.first_episode_id ? `/watch/${s.first_episode_id}` : `/series/${s.id}`} ...>
```

---

## Resumo das mudanças

| Arquivo | Onde | Mudança |
|---|---|---|
| `src/components/SeriesCard.tsx` | Link wrapper do card | `/series/:id` → `/watch/:first_episode_id` (fallback para `/series/:id`) |
| `src/pages/Index.tsx` | Seção "Em Alta" | `/series/:id` → `/watch/:first_episode_id` (fallback para `/series/:id`) |

### O que NÃO será alterado
- Seção "Continue Assistindo" permanece indo para `/series/:id` (correto — usa o botão "Retomar" na página da série)
- O botão Play no hover do `SeriesCard` (já navega corretamente)
- A página `SeriesDetail` (`/series/:id`) permanece acessível como destino de fallback
- Lógica de paywall e desbloqueio de episódios

