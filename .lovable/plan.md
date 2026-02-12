

## Phase 4: Coin Unlock System, Video Player, and Seed Data

This phase adds the core monetization flow, video playback with progress tracking, and demo content.

---

### 1. Seed Data (Demo Content)

Insert sample series and episodes directly into the database so the app has visible content for testing:

- **3 demo series** (different genres: Romance, Thriller, Comedy) with cover placeholder images, `status = 'published'`, one marked `featured = true`
- **5 episodes per series** (15 total): episode 1 is free (`is_free = true, coin_cost = 0`), episodes 2-5 are locked (`coin_cost = 5-15`)
- Series `total_coin_price` set to sum of episode costs
- No actual video files needed yet -- the player will handle missing URLs gracefully

---

### 2. Coin Unlock System

**Edge function: `unlock-episode`**
Secure server-side logic to prevent client-side balance manipulation:
- Accepts `episode_id` (and optionally `series_id` for full series unlock)
- Validates user is authenticated
- Checks if already unlocked (idempotent)
- Verifies coin balance >= cost
- In a single transaction: deducts coins from `profiles.coin_balance`, inserts `coin_transactions` record (type: 'spend'), inserts `user_unlocks` record
- Returns success/failure

**Frontend changes to `SeriesDetail.tsx`:**
- Fetch user's unlocks for the current series (`user_unlocks` where `series_id` or `episode_id` matches)
- Fetch user's coin balance from `profiles`
- Episodes show one of three states:
  - **Free**: Play button (always accessible)
  - **Unlocked**: Play button (user already purchased)
  - **Locked**: Shows coin cost with "Unlock" button
- "Unlock Full Series" button calls edge function with `series_id`
- Individual episode unlock button calls edge function with `episode_id`
- Toast notifications for success/insufficient balance
- Requires login -- redirect to `/auth` if not authenticated when trying to unlock

---

### 3. Video Player with Progress Tracking

**New page: `EpisodePlayer.tsx` (`/watch/:episodeId`)**
- Access control: check if episode `is_free` OR user has unlock record
- If not authorized, redirect to series detail page with toast
- Native HTML5 `<video>` element (no external player library needed)
- Video source from Supabase Storage signed URL (since `videos` bucket is private)
- Player controls: play/pause, seek bar, time display, fullscreen
- **Progress tracking**: save `progress_seconds` to `user_progress` table on:
  - Every 10 seconds during playback (debounced)
  - On pause
  - On page leave (`beforeunload` / route change)
- **Resume playback**: on load, fetch existing `user_progress` and seek to saved position
- Mark episode as `completed = true` when reaching 90% of duration
- Back button to return to series detail

**Route:** `/watch/:episodeId` (protected route -- requires auth)

---

### Technical Details

**New files to create:**
- `supabase/functions/unlock-episode/index.ts` -- Edge function for secure coin spending
- `src/pages/EpisodePlayer.tsx` -- Video player page with progress tracking

**Files to modify:**
- `src/pages/SeriesDetail.tsx` -- Add unlock buttons, fetch user unlocks/balance, link to player
- `src/App.tsx` -- Add `/watch/:episodeId` route
- `src/components/Navbar.tsx` -- Show coin balance next to avatar when logged in
- `supabase/config.toml` -- Add `unlock-episode` function config with `verify_jwt = false`

**Database changes:**
- No schema changes needed -- all tables (`user_unlocks`, `user_progress`, `coin_transactions`, `profiles`) already exist with proper RLS policies
- Seed data insertion (not a schema migration -- uses data insert)

**Edge function flow:**

```text
Client                    Edge Function              Database
  |                           |                         |
  |-- POST unlock-episode --> |                         |
  |   { episode_id }         |-- verify auth token --> |
  |                           |-- check user_unlocks -->|
  |                           |-- get coin_balance ---> |
  |                           |-- check episode cost -->|
  |                           |-- deduct balance -----> |
  |                           |-- insert transaction -->|
  |                           |-- insert unlock ------> |
  |   <-- { success } -------|                         |
```

**Video URL signing:**
Since the `videos` bucket is private, the player will create a signed URL using `supabase.storage.from('videos').createSignedUrl(path, 3600)` (1 hour expiry) to stream the video securely.

