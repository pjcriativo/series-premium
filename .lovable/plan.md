
# Página /purchases — Conteúdo Desbloqueado do Usuário

## O que existe hoje

A rota `/purchases` já existe em `App.tsx` (protegida por `ProtectedRoute`) e aponta para `src/pages/Purchases.tsx`. Porém, essa página atualmente exibe apenas o **histórico de transações de moedas** — não o conteúdo desbloqueado.

As tabelas relevantes no banco são:
- `episode_unlocks` — `{ id, user_id, episode_id, unlocked_at }`
- `series_unlocks` — `{ id, user_id, series_id, unlocked_at }`
- `episodes` — `{ id, title, episode_number, series_id, ... }`
- `series` — `{ id, title, cover_url, ... }`

O Supabase suporta **foreign key joins** via `.select()`, então é possível buscar os dados relacionados em uma única query.

---

## Estratégia de dados

**Episódios desbloqueados:** buscar `episode_unlocks` com join em `episodes(id, title, episode_number, series_id, series:series_id(id, title, cover_url))`

**Séries desbloqueadas:** buscar `series_unlocks` com join em `series(id, title, cover_url)`

Ambos ordenados por `unlocked_at` desc.

Os dois resultados serão **mesclados em uma lista unificada** e reordenados por data — assim o usuário vê tudo em ordem cronológica inversa.

---

## O que será alterado

### `src/pages/Purchases.tsx` — reescrita completa

A página atual (histórico de transações) será **substituída** pela nova página de conteúdo desbloqueado. O histórico de transações já existe na página `/me` (componente `TransactionHistory`), então não se perde nada.

A nova estrutura:

```
/purchases
├── Header com botão "Voltar para /me"
├── Tabs: "Episódios" | "Séries" (ou lista unificada)
└── Cards com capa, título, tipo e botão Assistir/Ver série
```

### Layout dos cards

Cada item desbloqueado exibe:
- Capa da série/episódio (usando `getSeriesCover` para fallback)
- Badge de tipo: "Episódio" (roxo) ou "Série completa" (dourado)
- Título da série e, para episódios, "Ep. N — Título do episódio"
- Data de desbloqueio formatada em pt-BR
- Botão "Assistir" → `/watch/{episodeId}` ou, para séries, "Ver série" → `/series/{seriesId}`

### Skeletons e estados vazios

- Skeleton loading com 6 cards fantasmas enquanto carrega
- Se não houver nada desbloqueado: ilustração + mensagem "Você ainda não desbloqueou nenhum conteúdo" + botão "Explorar séries" → `/`

---

## Technical details

**Queries Supabase (dados do próprio usuário — RLS já garante segurança):**

```ts
// Episódios desbloqueados com dados do episódio e série
supabase
  .from("episode_unlocks")
  .select("id, unlocked_at, episodes:episode_id(id, title, episode_number, series_id, series:series_id(id, title, cover_url))")
  .eq("user_id", user.id)
  .order("unlocked_at", { ascending: false })

// Séries desbloqueadas com dados da série
supabase
  .from("series_unlocks")
  .select("id, unlocked_at, series:series_id(id, title, cover_url)")
  .eq("user_id", user.id)
  .order("unlocked_at", { ascending: false })
```

**Merge e ordenação:**
Os dois arrays são unidos em uma lista tipada e reordenados por `unlocked_at` decrescente, usando `sort()` simples no frontend.

**Sem alteração de banco de dados** — todas as tabelas e RLS já existem e funcionam corretamente.

---

## Arquivo afetado

| Arquivo | Ação |
|---|---|
| `src/pages/Purchases.tsx` | Reescrita completa com nova lógica e UI |

Nenhuma migração de banco necessária. Nenhum outro arquivo precisa ser modificado.
