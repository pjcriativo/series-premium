
# Root Cause: Progress Tracking Does Not Work for YouTube Episodes

## Diagnosis

All 3 published episodes use `youtube_url` (YouTube iframe embed), **not** `video_url` (MP4 file). The current player code only saves progress for native `<video>` elements:

- `saveProgress()` is called by `onTimeUpdate`, the auto-save timer (`setInterval`), and `onUnmount` — all of which are wired to `videoRef.current` (the `<video>` tag).
- When `youtubeId` is present, the player renders an `<iframe>`. The `videoRef` is never attached, so **none of the save-progress calls ever fire**.
- Because `user_progress` is never written, the "Continue Assistindo" section never appears and no progress bar is shown.

## Fix: YouTube IFrame API Progress Tracking

The YouTube IFrame Player API allows injecting a JS player via `postMessage` and listening to time updates via the `onStateChange` / `getCurrentTime()` API. The plan is to add a YouTube player wrapper that:

1. Loads the YouTube IFrame API script once.
2. Creates a `YT.Player` instance pointed at the episode's `youtubeId`.
3. Polls `player.getCurrentTime()` every 5 seconds (same cadence as the native player) and calls `saveProgress`.
4. On unmount, saves the last known position.

### Files to Change

| File | Change |
|---|---|
| `src/hooks/useEpisodePlayer.ts` | Add `youtubeCurrentTime` ref + `saveProgress` integration for YouTube via a polling interval when `youtubeId` is present |
| `src/pages/EpisodePlayer.tsx` | Replace plain `<iframe>` with a `<div id>` target so the YT IFrame API can attach; set up `onReady` / `onStateChange` callbacks |

### Technical Approach

**1. `useEpisodePlayer.ts` — expose a YouTube player ref and polling**

Add a `ytPlayerRef` (a ref to the `YT.Player` instance) and a `startYTTracking` / `stopYTTracking` pair:

```typescript
const ytPlayerRef = useRef<any>(null);

// Called from EpisodePlayer once the YT player is ready
const onYTPlayerReady = (player: any) => {
  ytPlayerRef.current = player;
};

// Auto-save interval for YouTube (mirrors native video logic)
useEffect(() => {
  if (!youtubeId || !user) return;
  const id = setInterval(() => {
    if (ytPlayerRef.current) {
      const t = ytPlayerRef.current.getCurrentTime?.() ?? 0;
      if (t > 0) saveProgress(t);
    }
  }, 5000);
  return () => {
    clearInterval(id);
    // save on unmount
    if (ytPlayerRef.current) {
      const t = ytPlayerRef.current.getCurrentTime?.() ?? 0;
      if (t > 0) saveProgress(t);
    }
  };
}, [youtubeId, user, saveProgress]);
```

**2. `EpisodePlayer.tsx` — replace `<iframe>` with YT IFrame API player**

Replace the static `<iframe>` embed with a `<div id="yt-player-container">` and load the YT API:

```typescript
// One-time load of the YouTube IFrame API script
useEffect(() => {
  if (!youtubeId) return;
  if ((window as any).YT) {
    initPlayer();
    return;
  }
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  (window as any).onYouTubeIframeAPIReady = initPlayer;
}, [youtubeId]);

function initPlayer() {
  new (window as any).YT.Player("yt-player-container", {
    videoId: youtubeId,
    playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: (e: any) => {
        onYTPlayerReady(e.target);
        // Restore progress if available
        if (savedProgress?.last_position_seconds > 0 &&
            savedProgress.last_episode_number === episode?.episode_number) {
          e.target.seekTo(savedProgress.last_position_seconds, true);
        }
      },
    },
  });
}
```

The `<div id="yt-player-container">` replaces the `<iframe>` and fills the same container space. The YT API converts it into an `<iframe>` automatically.

### What This Enables

- `saveProgress` is called every 5 seconds for YouTube episodes, same as MP4 episodes.
- On unmount (navigating away), the last position is saved.
- The "Continue Assistindo" section on the Home page will now appear after watching a YouTube episode.
- The progress bar will display correctly using `last_position_seconds / duration_seconds` (60s as set in the DB).

### What Is NOT Changed
- The `saveProgress` function itself — no changes needed there.
- All MP4 native video logic — unchanged.
- Database schema — no migrations needed.
- All other pages and components.
