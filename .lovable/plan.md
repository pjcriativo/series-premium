

# Player /watch Enhancement

## Overview

Rewrite `EpisodePlayer.tsx` to be a vertical 9:16 player with end-of-video CTA, 5s auto-save, mute toggle, and auto-unlock support for the next episode.

## Changes

### File: `src/pages/EpisodePlayer.tsx` (full rewrite)

**Layout**
- Full-screen dark background, no Navbar/BottomNav
- Video centered in 9:16 aspect ratio (max-height: 100vh)
- Top overlay: back arrow + "Serie - Episodio N" text
- Bottom overlay: thin progress bar, play/pause + mute buttons, time display
- Tap on video toggles play/pause with brief animated icon

**End-of-video CTA**
- On `onEnded` event, show a fixed overlay panel:
  - "Proximo: Ep. {N+1} - {title}" 
  - Button "Proximo Episodio" if next is accessible, navigates to `/watch/:nextEpisodeId`
  - Button "Desbloquear Proximo" if next is locked, triggers auto-unlock or PaywallModal
  - "Rever" button to replay current episode
- Fetch next episode: query episodes table where `series_id` matches and `episode_number = current + 1`

**Auto-unlock logic**
- When user clicks "Proximo" and next episode is locked:
  1. Check `profile.auto_unlock` from the auth context
  2. If `auto_unlock === true` AND wallet balance >= next episode price: call `unlock-episode` edge function automatically, then navigate
  3. If `auto_unlock === true` BUT insufficient balance: open PaywallModal (which shows "Comprar moedas")
  4. If `auto_unlock === false`: open PaywallModal for manual confirmation

**Progress saving**
- Change interval from 10s to 5s
- On `onEnded`: save progress with `last_episode_number` set to current episode number and `last_position_seconds = 0` (completed)

**Mute toggle**
- Add mute state (default muted for autoplay compliance)
- Volume/VolumeX icon button in bottom controls

**Access validation**
- Keep existing access check logic
- On denied access, redirect to `/series/:seriesId` (existing behavior)

### File: `src/components/PaywallModal.tsx` (no changes)
Already has all needed functionality.

### File: `src/hooks/useAuth.tsx` (no changes)
`profile.auto_unlock` is already available via the auth context.

## Technical Details

### Next Episode Query
```typescript
const { data: nextEpisode } = useQuery({
  queryKey: ["next-episode", episode?.series_id, episode?.episode_number],
  queryFn: async () => {
    const { data } = await supabase
      .from("episodes")
      .select("id, title, episode_number, price_coins, is_free")
      .eq("series_id", episode.series_id)
      .eq("episode_number", episode.episode_number + 1)
      .eq("is_published", true)
      .maybeSingle();
    return data;
  },
  enabled: !!episode,
});
```

### Next Episode Access Check
```typescript
const isNextAccessible = nextEpisode && (
  nextEpisode.is_free ||
  nextEpisode.episode_number <= seriesFreeEps ||
  seriesUnlocked ||
  nextEpisodeUnlocked
);
```

### Auto-unlock Flow
```typescript
const handleNext = async () => {
  if (isNextAccessible) {
    navigate(`/watch/${nextEpisode.id}`);
    return;
  }
  // Locked
  if (profile?.auto_unlock && walletBalance >= nextEpisode.price_coins) {
    // Auto-unlock silently
    await supabase.functions.invoke("unlock-episode", {
      body: { episode_id: nextEpisode.id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    navigate(`/watch/${nextEpisode.id}`);
  } else {
    // Open paywall modal
    setShowPaywall(true);
  }
};
```

### Additional Queries Needed
- Wallet balance: `wallets` table for current user
- Series unlock check: `series_unlocks` for current series
- Next episode unlock check: `episode_unlocks` for next episode ID

### End Screen State
- `showEndScreen: boolean` -- set to `true` on video `onEnded`, reset on replay or navigate

## Summary of Differences from Current
| Feature | Current | New |
|---------|---------|-----|
| Layout | Horizontal video, card-style controls | Full-screen 9:16, overlay controls |
| Save interval | 10s | 5s |
| Mute toggle | None | Yes (default muted) |
| End-of-video CTA | None | Next episode + auto-unlock |
| Auto-unlock | Not implemented | Uses profile.auto_unlock |
| Fullscreen button | Yes | Removed (already full-screen layout) |
| Navbar/BottomNav | Visible | Hidden |

