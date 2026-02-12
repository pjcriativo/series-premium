

# Database Restructuring: New Schema, RLS, and TypeScript Types

This is a comprehensive database redesign that replaces the current schema with a new, more structured model. It touches virtually every file in the project.

---

## Summary of Changes

The current schema (7 tables) will be replaced by a new schema (11 tables) with different column names, new business logic (categories, wallets, coin_packages, views, series_unlocks), and updated RLS policies.

### Current vs New Table Mapping

```text
CURRENT                    NEW
-------                    ---
profiles                -> profiles (modified: remove coin_balance, add auto_unlock)
series                  -> series (modified: add slug, synopsis, category_id, free_episodes, is_published)
episodes                -> episodes (modified: add price_coins, is_published; rename coin_cost)
coin_transactions       -> transactions (renamed, new structure)
user_unlocks            -> episode_unlocks + series_unlocks (split into two)
user_progress           -> user_progress (changed to series-based tracking)
user_roles              -> user_roles (kept as-is, per security requirements)
(none)                  -> categories (new)
(none)                  -> wallets (new, replaces coin_balance in profiles)
(none)                  -> coin_packages (new)
(none)                  -> views (new, analytics)
```

---

## Phase 1: Database Migration

A single large SQL migration that:

1. **Drops old tables** (in dependency order): `user_progress`, `user_unlocks`, `coin_transactions`, `episodes`, `series`, then removes the `series_status` enum
2. **Modifies `profiles`**: removes `coin_balance` column, adds `auto_unlock` boolean column
3. **Creates new tables** with all columns, defaults, constraints, and indexes as specified
4. **Creates new enums**: `transaction_type` ('credit','debit') and `transaction_reason` ('purchase','episode_unlock','series_unlock','admin_adjust')
5. **Creates RLS policies** for all tables
6. **Creates indexes** on all foreign keys and composite keys
7. **Creates unique constraints**: episode_unlocks(user_id, episode_id), series_unlocks(user_id, series_id), user_progress(user_id, series_id), wallets(user_id)
8. **Creates a trigger** on `handle_new_user` to also create a wallet row when a new user signs up

### New Table Details

**categories**: id, name, slug (unique)

**series**: id, title, slug (unique), synopsis, cover_url, category_id (FK to categories), total_episodes int, free_episodes int default 3, is_published boolean default false, created_at

**episodes**: id, series_id (FK to series), episode_number int, title, video_url, duration_seconds int, is_free boolean default false, price_coins int default 10, is_published boolean default false, created_at

**wallets**: user_id (PK, unique), balance int default 0, updated_at

**coin_packages**: id, title, coins int, price_cents int, stripe_price_id text null, is_active boolean default true

**transactions**: id, user_id, type (enum: credit/debit), reason (enum: purchase/episode_unlock/series_unlock/admin_adjust), coins int, ref_id text null, created_at

**episode_unlocks**: id, user_id, episode_id (FK), unlocked_at (+ unique user_id, episode_id)

**series_unlocks**: id, user_id, series_id (FK), unlocked_at (+ unique user_id, series_id)

**user_progress**: id, user_id, series_id (FK), last_episode_number int default 1, last_position_seconds int default 0, updated_at (+ unique user_id, series_id)

**views**: id, user_id (nullable), series_id (FK), episode_id (FK), watched_seconds int default 0, created_at

### RLS Policies

- **profiles**: user reads/updates own; admin reads all
- **categories**: public read; admin write (insert/update/delete)
- **series**: public read where is_published = true; admin full CRUD
- **episodes**: public read where is_published = true (via series join); admin full CRUD
- **wallets**: user reads own; admin reads all; no direct client writes (edge function only)
- **coin_packages**: public read where is_active = true; admin write
- **transactions**: user reads own; admin reads all; no direct client writes
- **episode_unlocks**: user reads own; admin reads all; user inserts own
- **series_unlocks**: user reads own; admin reads all; user inserts own
- **user_progress**: user reads/inserts/updates own
- **views**: anyone can insert (analytics); admin reads all
- **user_roles**: kept as-is

---

## Phase 2: Seed Data

Insert demo content into the new schema:

- 3 categories: Romance, Thriller, Comedia
- 3 series (one per category, one is_published = true with different free_episodes values)
- 15 episodes (5 per series, episode 1-3 free based on free_episodes, rest paid)
- 4 coin_packages (Starter 50 coins R$4.90, Popular 150 coins R$12.90, Premium 500 coins R$34.90, Ultra 1200 coins R$69.90)

---

## Phase 3: Edge Functions Update

### `unlock-episode` function
Rewrite to use new tables:
- Read from `wallets` instead of `profiles.coin_balance`
- Write to `transactions` instead of `coin_transactions`
- Write to `episode_unlocks` / `series_unlocks` instead of `user_unlocks`
- Use new column names (`price_coins` instead of `coin_cost`)

### `buy-coins` function
Rewrite to:
- Read package from `coin_packages` table instead of hardcoded array
- Update `wallets.balance` instead of `profiles.coin_balance`
- Write to `transactions` instead of `coin_transactions`

---

## Phase 4: Frontend Updates

### Every file that queries Supabase needs updating for new table/column names:

**`src/hooks/useAuth.tsx`**
- No changes needed (uses `user_roles` which stays the same)

**`src/pages/Index.tsx`**
- Query `series` with `is_published` instead of `status = 'published'`
- Remove `featured` filter, use categories instead
- Join with `categories` to get genre/category name
- Remove `genre` references, use `category` relationship

**`src/components/SeriesCard.tsx`**
- Update type to match new series columns (no more `genre`, use category)

**`src/components/HeroBanner.tsx`**
- Use `synopsis` instead of `description`
- Use category name instead of `genre`

**`src/components/CategoryRow.tsx`**
- Update type references

**`src/pages/SeriesDetail.tsx`**
- Query `episode_unlocks` and `series_unlocks` instead of `user_unlocks`
- Read balance from `wallets` instead of `profiles.coin_balance`
- Use `price_coins` instead of `coin_cost`
- Use `synopsis` instead of `description`
- Access control: check `is_free` OR `episode_number <= series.free_episodes` OR episode_unlock OR series_unlock
- Category display instead of genre badge

**`src/pages/EpisodePlayer.tsx`**
- Check access via `episode_unlocks` and `series_unlocks` instead of `user_unlocks`
- Also check `episode_number <= series.free_episodes` rule
- Save progress to new `user_progress` (series-based: `last_episode_number`, `last_position_seconds`)
- Insert a `views` record for analytics

**`src/pages/CoinStore.tsx`**
- Fetch packages from `coin_packages` table instead of hardcoded array
- Read balance from `wallets` instead of `profiles.coin_balance`
- Show price_cents formatted as BRL

**`src/pages/Search.tsx`**
- Use `is_published` instead of `status = 'published'`
- Use categories for filtering instead of `genre`

**`src/components/Navbar.tsx`**
- Read coin balance from `wallets` instead of `profiles.coin_balance`

**`src/pages/admin/SeriesManager.tsx`**
- Update form fields: `synopsis` instead of `description`, `category_id` dropdown, `total_episodes`, `free_episodes`, `is_published` instead of `status` enum, remove `featured` and `total_coin_price`
- Add slug auto-generation from title

**`src/pages/admin/EpisodeManager.tsx`**
- Use `price_coins` instead of `coin_cost`
- Add `is_published` toggle

**`src/pages/admin/Dashboard.tsx`**
- Update stats queries for new table names (wallets, transactions, etc.)

**`src/pages/admin/UserManager.tsx`**
- Read balance from `wallets` instead of `profiles.coin_balance`
- Update grant coins to modify `wallets` and `transactions`

**`src/lib/demo-covers.ts`**
- Update demo series IDs to match new seed data

**`src/integrations/supabase/types.ts`**
- Will be auto-regenerated after migration (not manually edited)

---

## Phase 5: New Admin Pages

**Categories Manager** (`src/pages/admin/CategoryManager.tsx`)
- CRUD for categories with name and slug
- Add route `/admin/categories` in App.tsx and AdminLayout sidebar

**Coin Packages Manager** (optional, can be added to Dashboard or separate page)
- CRUD for coin_packages

---

## Technical Considerations

- The `handle_new_user` trigger must be updated to also insert a `wallets` row
- The `series_status` enum will be dropped (replaced by `is_published` boolean)
- All existing demo data will be lost and re-seeded
- The `profiles` table keeps `id`, `display_name`, `avatar_url`, `created_at`, `updated_at` but loses `coin_balance` (moved to `wallets`)
- Role is NOT stored on profiles (stays in `user_roles` table per security requirements)
- The `auto_unlock` field on profiles supports future feature where episodes auto-unlock on view

### Files to Create
- `src/pages/admin/CategoryManager.tsx`
- Updated migration SQL

### Files to Modify
- `src/pages/Index.tsx`
- `src/pages/SeriesDetail.tsx`
- `src/pages/EpisodePlayer.tsx`
- `src/pages/CoinStore.tsx`
- `src/pages/Search.tsx`
- `src/pages/admin/SeriesManager.tsx`
- `src/pages/admin/EpisodeManager.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/UserManager.tsx`
- `src/pages/admin/AdminLayout.tsx`
- `src/components/Navbar.tsx`
- `src/components/SeriesCard.tsx`
- `src/components/HeroBanner.tsx`
- `src/components/CategoryRow.tsx`
- `src/hooks/useAuth.tsx` (minor - no schema change needed)
- `src/lib/demo-covers.ts`
- `src/App.tsx`
- `supabase/functions/unlock-episode/index.ts`
- `supabase/functions/buy-coins/index.ts`

### Execution Order
1. Run database migration (drop old + create new tables/RLS/indexes)
2. Insert seed data
3. Update edge functions
4. Update all frontend files
5. Test end-to-end

