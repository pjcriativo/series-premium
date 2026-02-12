

# Enhanced User Profile Page (/me)

## Overview

Transform the current simple Profile page into a rich user area with auto-unlock toggle, continue watching, watched series, transaction history, and logout.

## Current State

The Profile page currently shows: avatar, name, email, wallet link, purchases link, admin link, and logout button. It's a simple menu-style page.

## Planned Sections (top to bottom)

1. **Header** -- Avatar, display name, email (already exists, keep as-is)
2. **Auto-unlock toggle** -- Switch for `profile.auto_unlock`, updates the `profiles` table on toggle
3. **Wallet row** -- Quick link to `/wallet` with balance (already exists, keep)
4. **Continuar Assistindo** -- Horizontal scroll of series cards based on `user_progress`, each card shows series cover + "Ep. X" badge, links to `/watch/:episodeId` for the last watched episode
5. **Series Assistidas** -- Horizontal scroll of all series where the user has progress records, linking to `/series/:id`
6. **Historico** -- Last 20 transactions displayed as a list with type icon (credit/debit), reason, coins, and date
7. **Admin link** -- If admin role (keep existing)
8. **Logout button** -- (keep existing)

## Technical Details

### File Modified: `src/pages/Profile.tsx` (rewrite)

**New queries added:**

1. **User progress with series data:**
```typescript
const { data: progressList } = useQuery({
  queryKey: ["user-progress-all", user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("user_progress")
      .select("series_id, last_episode_number, last_position_seconds, updated_at")
      .order("updated_at", { ascending: false });
    return data;
  },
  enabled: !!user,
});
```

2. **Series details for progress items:**
```typescript
// Fetch series info for all progress entries
const { data: watchedSeries } = useQuery({
  queryKey: ["watched-series", seriesIds],
  queryFn: async () => {
    const { data } = await supabase
      .from("series")
      .select("id, title, cover_url, slug, total_episodes")
      .in("id", seriesIds);
    return data;
  },
  enabled: seriesIds.length > 0,
});
```

3. **Episodes for "continue watching" (to get episode IDs for navigation):**
```typescript
// For each progress entry, find the episode matching last_episode_number
const { data: continueEpisodes } = useQuery({
  queryKey: ["continue-episodes", progressList],
  queryFn: async () => {
    // Batch query: get episodes matching series_id + episode_number pairs
    const promises = progressList.map(p =>
      supabase.from("episodes")
        .select("id, title, episode_number, series_id")
        .eq("series_id", p.series_id)
        .eq("episode_number", p.last_episode_number)
        .maybeSingle()
    );
    const results = await Promise.all(promises);
    return results.map(r => r.data).filter(Boolean);
  },
  enabled: !!progressList?.length,
});
```

4. **Recent transactions:**
```typescript
const { data: transactions } = useQuery({
  queryKey: ["transactions", user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    return data;
  },
  enabled: !!user,
});
```

**Auto-unlock toggle:**
```typescript
const handleAutoUnlockToggle = async (checked: boolean) => {
  await supabase.from("profiles").update({ auto_unlock: checked }).eq("id", user.id);
  // Refresh profile in auth context
};
```
The `useAuth` hook's `fetchProfile` is not exposed, so after updating, we invalidate and also optimistically update the local profile state. Since `profile` comes from the auth context, we can call `fetchProfile` if we expose it, or simply reload. The simplest approach: add a `refreshProfile` method to the auth context, or just update the profiles table and show a toast -- the auth context will pick it up on next mount.

**Better approach**: Expose `refreshProfile` from `useAuth` by adding it to the context value. This is a small change to `src/hooks/useAuth.tsx`.

### File Modified: `src/hooks/useAuth.tsx`

Add `refreshProfile` to the context:
- Extract `fetchProfile` so it can be called externally
- Add `refreshProfile: () => Promise<void>` to `AuthContextType`
- Include it in the provider value

### UI Components Used

- `Switch` from `@/components/ui/switch` for auto-unlock toggle
- `SeriesCard` or inline card component for continue watching / watched series (horizontal scroll)
- `Card` for transaction history items
- Existing `Avatar`, `Button`, `Link` components

### Section: "Continuar Assistindo"

Each item is a small card showing:
- Series cover image (2:3 aspect ratio, same as SeriesCard)
- Series title
- Badge overlay: "Ep. {N}"
- Click navigates to `/watch/:episodeId`

### Section: "Series Assistidas"

Reuses the same horizontal scroll pattern but links to `/series/:id` instead of the player.

### Section: "Historico"

Each transaction row shows:
- Icon: green arrow up for credit, red arrow down for debit
- Reason label mapped from enum (purchase -> "Compra de moedas", episode_unlock -> "Desbloqueio de episodio", series_unlock -> "Desbloqueio de serie", admin_adjust -> "Ajuste admin")
- Coins amount with +/- prefix
- Relative date (using `date-fns` formatDistanceToNow)

## Files Summary

| File | Action |
|------|--------|
| `src/pages/Profile.tsx` | Rewrite with new sections |
| `src/hooks/useAuth.tsx` | Add `refreshProfile` to context |

## No Database Changes

All required tables and RLS policies already exist. The `profiles` table already has an UPDATE policy for own profile (`auth.uid() = id`).
