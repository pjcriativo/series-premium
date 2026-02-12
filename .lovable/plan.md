

## ReelShort-Style Micro-Drama Platform

A mobile-first, dark-mode video streaming app for short episodic dramas, inspired by ReelShort's UX. We'll build admin-first so you can manage content, then the user-facing app.

---

### Phase 1: Foundation & Auth
- **Supabase setup** with email/password authentication
- **User profiles** table with basic info (display name, avatar)
- **User roles** table (admin/user) with secure RLS policies
- **Dark mode** as default theme throughout

### Phase 2: Admin Panel
- **Dashboard** with basic stats (users, series, episodes count)
- **Series management** — Create, edit, delete series (title, description, genre, cover image, featured flag)
- **Episode management** — Add episodes to series (title, order, video upload, free/locked toggle)
- **Video & cover uploads** to Supabase Storage (buckets: `videos`, `covers`)
- **User management** — View registered users
- **Coin pricing config** — Set how many coins each episode costs

### Phase 3: User App — Browse & Discover
- **Home feed** with horizontal category rows (like the ReelShort screenshot): "New Release", genre categories, "More Recommended"
- **Featured hero banner** at top with autoplay preview
- **Series detail page** — Cover, description, episode list with free/locked indicators
- **Search & genre filtering**

### Phase 4: Video Player & Progression
- **Vertical video player** with minimal controls (play/pause, progress bar, mute)
- **Autoplay next episode** with CTA overlay at end ("Next Episode" / "Unlock with Coins")
- **Watch progress tracking** — Resume where user left off
- **Snap-scroll feed** for discovering new series (vertical swipe between trailers/first episodes)

### Phase 5: Coin System (Simulated)
- **Coin balance** displayed in user profile and throughout the app
- **Coin packages page** — Show purchase options (no real payment yet, admin can grant coins)
- **Episode unlock flow** — Spend coins to unlock locked episodes; backend validates via RLS/RPC (never trust frontend)
- **Unlock history** — Track which episodes each user has unlocked
- **Option to unlock full series** at a discounted coin price

### Phase 6: User Profile & Settings
- **Profile page** — Avatar, display name, watch history
- **My Library** — Continue watching, unlocked series
- **Settings** — Account management, logout

---

### Database Structure (Key Tables)
- `profiles` — user display info
- `user_roles` — admin/user roles (separate table, secure)
- `series` — title, description, genre, cover, featured, coin price for full unlock
- `episodes` — series reference, order, video URL, free flag, coin cost
- `user_progress` — user watch position per episode
- `user_unlocks` — which episodes/series a user has unlocked
- `coin_transactions` — coin balance changes (grants, purchases, spends)

### Design Direction
- Dark theme default, cinematic feel
- Mobile-first responsive layout
- Horizontal scroll rows for categories on home
- Bold cover art thumbnails with series titles
- Clean, minimal player UI

