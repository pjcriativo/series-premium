

# Home Feed Vertical (Reels/TikTok Style)

## Overview

Replace the current Home page (hero banner + horizontal category rows) with a full-screen vertical snap-scroll feed of episode cards, similar to TikTok/Reels. Each card fills the viewport, plays video automatically when in view, and provides quick access to series info and paywall actions.

## Architecture

### New Component: `ReelCard`
A single full-screen episode card that:
- Fills the viewport height (minus top navbar and bottom nav)
- Displays the series cover as background (or video if available and accessible)
- Uses `IntersectionObserver` to autoplay/pause video when entering/leaving viewport
- Shows overlay with: series title, episode number, category badge, "Em alta" tag
- CTA button: "Continuar" (if accessible) or "Desbloquear" (if locked)
- Tap on video area toggles play/pause
- Mute toggle button (top-right)
- Thin progress bar at the bottom of the card

### New Component: `PaywallModal`
A dialog/bottom-sheet that appears when tapping "Desbloquear" on a locked episode:
- Shows episode title, price in coins, current balance
- "Desbloquear" button (calls the `unlock-episode` edge function)
- "Comprar moedas" link to `/wallet`

### Modified: `src/pages/Index.tsx`
Complete rewrite to implement the vertical feed:
- Fetches published episodes (joined with series + categories) ordered by most recent
- Also fetches user's episode/series unlocks and wallet balance
- Renders a snap-scroll container with `ReelCard` components
- Preloads the next video's signed URL when approaching it

### Data Query
```
episodes (is_published = true)
  -> join series (is_published = true) with categories
  -> check episode_unlocks + series_unlocks for access
  -> get signed video URLs for accessible episodes
```

## Technical Details

### Snap Scroll Container
The feed container uses CSS snap scrolling:
```css
.reel-feed {
  height: calc(100vh - 56px - 64px); /* navbar + bottom nav */
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}
.reel-card {
  height: calc(100vh - 56px - 64px);
  scroll-snap-align: start;
}
```
On desktop (no bottom nav): height is `calc(100vh - 56px)`.

### IntersectionObserver for Autoplay
Each `ReelCard` uses a ref and `IntersectionObserver` with `threshold: 0.7`:
- When 70%+ visible: play video (if accessible and has video URL), set as "active" card
- When less than 70% visible: pause video
- Only one video plays at a time

### Video Preloading
- The active card's video plays
- The next card's video is preloaded by creating a hidden `<video preload="auto">` element or fetching the signed URL ahead of time
- Signed URLs are fetched lazily: only for the current card + next card

### Mute State
- Global mute state (default: muted for autoplay browser policy)
- Toggle button on each card (syncs across cards)
- Videos start muted to comply with autoplay restrictions

### Access Check Logic (reuses existing pattern)
```
isAccessible(episode, series) =
  episode.is_free
  OR episode.episode_number <= series.free_episodes
  OR series_unlocks has series_id
  OR episode_unlocks has episode_id
```

### CTA Button Logic
- Accessible + has video: "Continuar" -> navigates to `/watch/:episodeId`
- Accessible + no video: "Em breve" (disabled)
- Locked + logged in: "Desbloquear {price} moedas" -> opens PaywallModal
- Locked + not logged in: "Entrar para assistir" -> navigates to `/auth`

### Skeleton Loading
While episodes are loading, show 1 full-screen skeleton card with:
- Pulsing background
- Skeleton text lines at the bottom

## Files to Create
- `src/components/ReelCard.tsx` -- full-screen episode card with video, overlay, controls
- `src/components/PaywallModal.tsx` -- unlock dialog with coin balance + purchase CTA

## Files to Modify
- `src/pages/Index.tsx` -- complete rewrite from category-row layout to vertical feed
- `src/components/Navbar.tsx` -- make transparent/floating over the feed (no solid background, so the reel shows behind it)
- `src/components/BottomNav.tsx` -- make transparent/floating so it overlays the feed

## Files NOT Modified
- `src/pages/EpisodePlayer.tsx` -- the full player page stays as-is
- `src/pages/SeriesDetail.tsx` -- stays as-is
- Edge functions, hooks, DB -- no changes needed

## UX Flow
1. User opens `/` and sees first episode card filling the screen
2. Video autoplays (muted) with series info overlaid at the bottom
3. User swipes up to see next episode (snap scroll)
4. Previous video pauses, new one autoplays
5. Tapping the video toggles play/pause (visual feedback with a brief play/pause icon)
6. If episode is locked, CTA shows "Desbloquear" -- tapping opens PaywallModal
7. If unlocked, CTA shows "Continuar" -- tapping navigates to `/watch/:id`

