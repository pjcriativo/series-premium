

# Admin Dashboard: Metricas Simples

## Overview

Rewrite the Dashboard page to display rich metrics across 5 sections: summary cards, views by series, sales revenue, coin purchases, and retention indicators. All data is fetched client-side from existing tables using the admin's RLS policies.

## Changes

### 1. `src/pages/admin/Dashboard.tsx` (Rewrite)

Replace the current 3-card layout with a comprehensive metrics dashboard.

**Section 1 -- Summary Cards (top row, grid of 5)**

| Card | Source | Query |
|------|--------|-------|
| Total Views | `views` | `select("id", { count: "exact", head: true })` |
| Users | `profiles` | `select("id", { count: "exact", head: true })` |
| Series | `series` | `select("id", { count: "exact", head: true })` |
| Episodes | `episodes` | `select("id", { count: "exact", head: true })` |
| Coin Purchases Revenue | `transactions` | `select("coins").eq("type","credit").eq("reason","purchase")` then sum client-side |

**Section 2 -- Views por Serie (table)**

- Query `views` with `select("series_id")`, group client-side by `series_id`, count per series
- Join with series titles by fetching `series` separately and mapping by id
- Display as a sorted table: Series Title | Views count
- Limit to top 10

**Section 3 -- Sales (Vendas)**

Two sub-metrics displayed as cards:
- **Episode unlocks revenue**: `transactions` where `type = "debit"` and `reason = "episode_unlock"`, sum `coins`
- **Series unlocks revenue**: `transactions` where `type = "debit"` and `reason = "series_unlock"`, sum `coins`

**Section 4 -- Coin Purchases (Compras de moedas)**

- Total coins purchased: `transactions` where `type = "credit"` and `reason = "purchase"`, sum `coins`
- Number of purchases: count of those rows

**Section 5 -- Retention**

- **% users with progress in more than 1 episode**: Query `user_progress` select all, then count distinct `user_id` where `last_episode_number > 1`. Divide by total users count. Display as percentage.
- **Most resumed series**: Query `user_progress` select all, group by `series_id` client-side, count entries per series (each entry = a user who has progress). Sort descending, show top 5 with series title.

### Data Fetching Strategy

Use a single `useQuery` that runs all queries in `Promise.all` to avoid waterfall requests:

```text
Promise.all([
  profiles count,
  series (id, title),
  episodes count,
  views (series_id) -- up to 1000,
  transactions (type, reason, coins),
  user_progress (user_id, series_id, last_episode_number),
])
```

All aggregation happens client-side since the dataset sizes are manageable for an admin dashboard.

### UI Layout

```text
+-----------------------------------------------------+
| Dashboard                                            |
+-----------------------------------------------------+
| [Views] [Users] [Series] [Episodes] [Purchases]     |  <-- summary cards
+-----------------------------------------------------+
| Views por Serie          | Vendas                    |
| (table top 10)           | Episode unlocks: X coins  |
|                          | Series unlocks: Y coins   |
+-----------------------------------------------------+
| Compras de Moedas        | Retencao                  |
| Total: X coins           | % users >1 ep: X%        |
| Purchases: N             | Top series retomadas      |
|                          | (list top 5)              |
+-----------------------------------------------------+
```

Uses existing `Card`, `Table`, and `Progress` components. Recharts `BarChart` for the views-by-series visualization as an alternative to the table (recharts is already installed).

### Icons

- Eye for views, Users for users, Film for series, Tv for episodes, Coins for purchases, TrendingUp for sales, BarChart3 for retention

## Files Summary

| File | Action |
|------|--------|
| `src/pages/admin/Dashboard.tsx` | Rewrite |

## No Database or Route Changes

All data is already accessible via admin RLS policies. The route `/admin` already renders `Dashboard`.
