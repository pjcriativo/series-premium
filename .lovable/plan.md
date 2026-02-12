

## Phase 3: Home Feed, Hero Banner, and Series Detail Page

This phase transforms the blank Index page into a ReelShort-style mobile-first streaming app with content discovery.

---

### What will be built

**1. Home Page (`/` - replace current blank page)**
- Top navigation bar with app logo, search icon, and user avatar/login button
- **Hero Banner** at top showing a featured series (from `series.featured = true`) with cover image, title, description, and "Watch Now" CTA
- **Horizontal scroll rows** organized by category:
  - "Em Destaque" (Featured series)
  - "Novos Lancamentos" (newest series by `created_at`)
  - Genre-based rows (dynamically generated from distinct genres in the database)
  - "Mais Recomendados" (all published series)
- Each row shows series cards with cover art, title, and episode count

**2. Series Detail Page (`/series/:id`)**
- Large cover image/banner at top
- Series title, genre badge, description
- Episode list with episode number, title, free/locked indicator, and coin cost
- "Unlock Full Series" button showing total coin price
- Free episodes show a "Play" button; locked ones show coin cost with lock icon

**3. Search Page (`/search`)**
- Text search input filtering series by title
- Genre filter chips for quick filtering
- Grid of matching series cards

**4. Shared Components**
- `SeriesCard` — Reusable card with cover image, title, genre, episode count
- `HeroBanner` — Featured series showcase with gradient overlay
- `CategoryRow` — Horizontal scrollable row of SeriesCards with section title
- `Navbar` — Top bar with logo, search, and user menu

---

### Technical Details

**New files to create:**
- `src/components/Navbar.tsx` — App top navigation bar
- `src/components/HeroBanner.tsx` — Featured series hero section
- `src/components/SeriesCard.tsx` — Reusable series thumbnail card
- `src/components/CategoryRow.tsx` — Horizontal scroll row with title
- `src/pages/SeriesDetail.tsx` — Full series page with episode list
- `src/pages/Search.tsx` — Search and genre filtering page

**Files to modify:**
- `src/pages/Index.tsx` — Complete rewrite to home feed layout
- `src/App.tsx` — Add routes for `/series/:id` and `/search`

**Data queries (all use public RLS - "Anyone can view published series"):**
- Featured series: `series.where(featured=true, status='published')`
- New releases: `series.where(status='published').order(created_at desc).limit(10)`
- By genre: `series.where(genre=X, status='published')`
- Episodes per series: `episodes.where(series_id=X).order(episode_number asc)`
- Distinct genres: derived from published series data

**No database changes needed** — all tables and RLS policies are already in place. Published series and their episodes are readable by anyone (including unauthenticated users) via existing RLS policies.

---

### Design Direction
- Dark cinematic theme (already configured)
- Mobile-first responsive layout
- Horizontal scroll with CSS `overflow-x: auto` and snap scrolling
- Bold cover art thumbnails (16:9 aspect ratio for cards)
- Gradient overlays on hero banner for text readability
- Lock icons and coin badges on premium episode indicators
- Smooth hover/tap animations on cards

