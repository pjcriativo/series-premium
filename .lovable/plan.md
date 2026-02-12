

## Phase 1: Foundation, Auth & Dark Mode

This is a big first step that sets up the entire foundation. Here's everything that will be built:

---

### 1. Database Schema (Supabase Migrations)

Create all core tables needed for the platform:

**profiles** — user display info
- `id` (uuid, references auth.users)
- `display_name` (text)
- `avatar_url` (text)
- `coin_balance` (integer, default 0)
- `created_at`, `updated_at`

**user_roles** — separate table for admin/user roles (security best practice)
- `id` (uuid)
- `user_id` (uuid, references auth.users)
- `role` (enum: admin, user)
- Unique constraint on (user_id, role)

**series** — drama series
- `id`, `title`, `description`, `genre`, `cover_url`, `featured` (boolean), `total_coin_price` (for full series unlock), `status` (draft/published), `created_at`, `updated_at`

**episodes** — episodes within a series
- `id`, `series_id` (FK), `title`, `episode_number`, `video_url`, `thumbnail_url`, `is_free` (boolean), `coin_cost` (integer), `duration_seconds`, `created_at`

**user_progress** — watch position tracking
- `id`, `user_id`, `episode_id`, `progress_seconds`, `completed`, `updated_at`

**user_unlocks** — episode/series unlock records
- `id`, `user_id`, `episode_id` (nullable), `series_id` (nullable), `unlocked_at`

**coin_transactions** — coin balance ledger
- `id`, `user_id`, `amount` (positive=credit, negative=debit), `type` (enum: grant, purchase, spend), `description`, `created_at`

**Security functions:**
- `has_role(user_id, role)` — security definer function for RLS
- Trigger to auto-create profile on signup
- Trigger to auto-assign 'user' role on signup
- RLS policies on all tables

**Storage buckets:**
- `videos` (private bucket for video content)
- `covers` (public bucket for cover images)

---

### 2. Dark Mode Theme

- Set dark mode as default by adding `class="dark"` to the HTML root
- Update CSS variables — cinematic dark theme with purple/blue accent colors

---

### 3. Authentication Pages

- **Login page** (`/auth`) — Email + password sign in, with link to sign up
- **Sign up page** — Email + password registration with display name
- **Auth context/hook** — `useAuth` hook for session management using `onAuthStateChange`
- **Protected route wrapper** — Redirect unauthenticated users to `/auth`
- **Admin route wrapper** — Check `user_roles` table for admin access

---

### 4. App Routing Structure

```text
/auth           — Login / Sign up
/               — Home (user app, future phase)
/admin          — Admin dashboard
/admin/series   — Series management
/admin/episodes — Episode management
/admin/users    — User management
```

---

### 5. Admin Panel (Phase 2, built together)

Since admin-first is the priority, Phase 2 will be included in this implementation:

- **Admin Layout** — Sidebar navigation with dark theme
- **Dashboard** — Stats cards (total users, series, episodes)
- **Series CRUD** — Table view, create/edit dialog with cover image upload
- **Episode CRUD** — Table per series, video upload, free/locked toggle, coin cost setting
- **User Management** — List users, grant coins, assign admin role
- **Seed data** — Insert demo series and episodes with placeholder thumbnails

---

### Technical Details

**Files to create:**
- `src/hooks/useAuth.tsx` — Auth context provider
- `src/components/ProtectedRoute.tsx` — Auth guard
- `src/components/AdminRoute.tsx` — Admin role guard
- `src/pages/Auth.tsx` — Login/signup page
- `src/pages/admin/AdminLayout.tsx` — Sidebar layout
- `src/pages/admin/Dashboard.tsx` — Stats dashboard
- `src/pages/admin/SeriesManager.tsx` — Series CRUD
- `src/pages/admin/EpisodeManager.tsx` — Episode CRUD
- `src/pages/admin/UserManager.tsx` — User list + coin grants

**Files to modify:**
- `src/index.css` — Dark theme as default, cinematic color palette
- `src/App.tsx` — Add AuthProvider, all routes
- `index.html` — Add `class="dark"` to html tag
- `src/main.tsx` — Wrap with auth provider

**Database migrations:**
- 1 migration with all tables, enums, functions, triggers, RLS policies, storage buckets
- 1 seed data insertion with demo series/episodes

