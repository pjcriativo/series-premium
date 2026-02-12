

# Series Detail Page Enhancement

## Current State
The `SeriesDetail.tsx` page already has most of the requested features working:
- Cover image, title, synopsis, episode count
- Category badge
- Episode list ordered by `episode_number`
- Episode states: "Gratis", "Desbloqueado", "Bloqueado" with coin prices
- Unlock logic (inline via edge function)
- "Desbloquear Serie" bulk button

A `PaywallModal` component also already exists.

## What's Missing
Two things need to be added/improved:

### 1. "Retomar" (Resume) Button
Fetch `user_progress` for the current series and show a prominent "Retomar Ep. X" button that navigates to the last watched episode. This appears above the episode list when the user has progress.

### 2. PaywallModal Integration
Currently, clicking a locked episode triggers an inline unlock (no modal confirmation). The plan changes this to open the `PaywallModal` instead, showing price, balance, and a confirm button -- matching the UX described in the prompt.

### 3. "X episodios gratis" Indicator
Add a visible indicator showing how many free episodes the series offers (e.g., "3 episodios gratis").

---

## Technical Details

### Files Modified

**`src/pages/SeriesDetail.tsx`**
- Add a `useQuery` for `user_progress` table filtered by `user_id` + `series_id` to get `last_episode_number`
- Add a "Retomar" button that finds the episode matching `last_episode_number` and navigates to `/watch/:episodeId`
- Add a badge/text showing `series.free_episodes` count (e.g., "3 primeiros episodios gratis")
- Replace `handleEpisodeClick` for locked episodes: instead of calling `handleUnlock` directly, open `PaywallModal` with the episode's details
- Add state for `paywallEpisode` (the episode selected for unlocking) and pass it to `PaywallModal`
- On `PaywallModal.onUnlocked`, invalidate queries (episode-unlocks, wallet)

### No New Files
All components already exist. Only `SeriesDetail.tsx` is modified.

### Data Flow
```
user_progress query:
  SELECT * FROM user_progress
  WHERE user_id = :userId AND series_id = :seriesId
  -> returns { last_episode_number, last_position_seconds }

Resume button:
  Find episode where episode_number === last_episode_number
  Navigate to /watch/:episodeId
```

### PaywallModal Integration
```
State: paywallEpisode: { id, title, price_coins } | null

On locked episode click:
  -> if not logged in: navigate to /auth
  -> if logged in: set paywallEpisode to that episode (opens modal)

PaywallModal props:
  episodeId = paywallEpisode.id
  episodeTitle = paywallEpisode.title
  priceCoin = paywallEpisode.price_coins
  balance = wallet.balance
  onUnlocked = invalidate queries + clear paywallEpisode
```

### UI Additions (in order on the page)
1. Cover image with back button (existing)
2. Category badge + episode count + wallet balance (existing)
3. **NEW**: Badge "X primeiros episodios gratis" if `series.free_episodes > 0`
4. Title + synopsis (existing)
5. **NEW**: "Retomar Ep. X" button (if user has progress)
6. "Desbloquear Serie" button (existing)
7. Episode list (existing, but click behavior changes for locked episodes)
8. **NEW**: `PaywallModal` rendered at bottom of component
