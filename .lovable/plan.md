

# Enhanced PaywallModal + Unlock Service

## Overview

Upgrade the existing `PaywallModal` to support both episode-level and series-level unlocking in a single modal, and extract all unlock/access logic into a reusable `unlockService.ts`.

## What Changes

### 1. New File: `src/lib/unlockService.ts`

A service module with three exported functions that encapsulate all access and unlock logic:

- **`canAccessEpisode(userId, episodeId)`**: Checks if an episode is free, within the series free limit, or if the user has an episode or series unlock record. Returns `boolean`.
- **`unlockEpisode(userId, episodeId)`**: Calls the `unlock-episode` edge function with `{ episode_id }`. Returns the response (success, new balance, etc.).
- **`unlockSeries(userId, seriesId)`**: Calls the same `unlock-episode` edge function with `{ series_id }`. Returns the response.

All three functions use the Supabase client internally -- no new edge functions needed since the existing `unlock-episode` already supports both `episode_id` and `series_id` parameters.

### 2. Rewrite: `src/components/PaywallModal.tsx`

The modal gains a new "Desbloquear serie completa" option alongside the existing episode unlock.

**New props added:**
- `seriesId: string` -- the series ID for the full-series unlock option
- `seriesTitle: string` -- display name for the series
- `seriesTotalCost: number` -- total cost of all paid episodes in the series (calculated by the caller)
- `onNavigateToWatch?: (episodeId: string) => void` -- optional callback to navigate after unlock

**UI layout:**
- Episode price row (existing)
- Series price row (new): "Desbloquear serie completa -- {seriesTotalCost} moedas"
- Current balance row (existing)
- Two action buttons side by side (or stacked):
  1. "Desbloquear episodio -- {priceCoin} moedas"
  2. "Desbloquear serie -- {seriesTotalCost} moedas" (only if `seriesTotalCost > 0`)
- If balance is insufficient for both, show "Comprar moedas" button
- After successful unlock of either type: close modal, call `onUnlocked`, optionally navigate to `/watch`

**Unlock calls use the new `unlockService`** instead of direct `supabase.functions.invoke`.

### 3. Update Callers

**`src/pages/SeriesDetail.tsx`**:
- Pass new props (`seriesId`, `seriesTitle`, `seriesTotalCost`) to `PaywallModal`
- Replace inline `isEpisodeAccessible` logic with `canAccessEpisode` from the service (or keep local for performance since it avoids async calls -- the service version is for server-side validation)

**`src/pages/Index.tsx`**:
- Pass new series props to `PaywallModal` from the `ReelEpisode` data (series_id, series_title are already available)
- Calculate `seriesTotalCost` for the selected episode's series (fetch paid episodes count or pass a pre-computed value)

**`src/hooks/useEpisodePlayer.ts`**:
- Replace direct `supabase.functions.invoke("unlock-episode", ...)` call in `handleNext` with `unlockService.unlockEpisode()`
- The PaywallModal in EpisodePlayer also receives the new series props

## Technical Details

### `unlockService.ts` Implementation

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function canAccessEpisode(userId: string, episodeId: string): Promise<boolean> {
  // Fetch episode + series free_episodes
  const { data: ep } = await supabase
    .from("episodes")
    .select("is_free, episode_number, series_id")
    .eq("id", episodeId).single();
  if (!ep) return false;
  if (ep.is_free) return true;

  const { data: series } = await supabase
    .from("series").select("free_episodes")
    .eq("id", ep.series_id).single();
  if (series && ep.episode_number <= series.free_episodes) return true;

  // Check unlocks
  const { data: su } = await supabase
    .from("series_unlocks").select("id")
    .eq("user_id", userId).eq("series_id", ep.series_id).maybeSingle();
  if (su) return true;

  const { data: eu } = await supabase
    .from("episode_unlocks").select("id")
    .eq("user_id", userId).eq("episode_id", episodeId).maybeSingle();
  return !!eu;
}

export async function unlockEpisode(episodeId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("unlock-episode", {
    body: { episode_id: episodeId },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw res.error;
  return res.data;
}

export async function unlockSeries(seriesId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke("unlock-episode", {
    body: { series_id: seriesId },
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw res.error;
  return res.data;
}
```

### PaywallModal New Interface

```typescript
interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeId: string;
  priceCoin: number;
  balance: number;
  seriesId?: string;
  seriesTitle?: string;
  seriesTotalCost?: number;
  onUnlocked: () => void;
  onNavigateToWatch?: (episodeId: string) => void;
}
```

### Series Cost Calculation

Each caller computes `seriesTotalCost` from the episodes it already has loaded:
```typescript
const seriesTotalCost = episodes
  .filter(ep => !ep.is_free && ep.episode_number > series.free_episodes)
  .filter(ep => !episodeUnlocks?.has(ep.id))
  .reduce((sum, ep) => sum + ep.price_coins, 0);
```

## Files Summary

| File | Action |
|------|--------|
| `src/lib/unlockService.ts` | Create |
| `src/components/PaywallModal.tsx` | Rewrite |
| `src/pages/SeriesDetail.tsx` | Update (pass new props) |
| `src/pages/Index.tsx` | Update (pass new props) |
| `src/hooks/useEpisodePlayer.ts` | Update (use unlockService) |

## No Database/Edge Function Changes

The existing `unlock-episode` edge function already handles both `episode_id` and `series_id` parameters, so no backend changes are needed.

