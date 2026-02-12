

# Home Page Browse Layout + Hero Slider + Demo Data

## Overview

Transform the home page from the current vertical reel feed into a Netflix/ReelShort-style browse layout with a hero image carousel at the top and horizontal category rows below. The hero slider will be fully manageable from the admin panel. Demo series and categories will be seeded to populate the interface.

## Changes

### 1. New DB Table: `banners`

A new migration creates a `banners` table for the admin-editable hero slider:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| title | text | Banner title overlay |
| subtitle | text | Optional subtitle |
| image_url | text | URL to banner image (from covers bucket) |
| link_series_id | uuid FK -> series | Links banner to a series detail page |
| sort_order | int | Display order |
| is_active | boolean | Toggle visibility |
| created_at | timestamptz | |

RLS: public read (active), admin full CRUD.

### 2. Seed Migration: Categories + Demo Series

Insert ~8 categories and ~20 demo series spread across them to fill the browse layout:

**Categories:**
- Romance, Thriller, Comedia, Drama, Acao, Fantasia, Terror, Jovem Adulto

**Demo series (3-4 per category):**
Each series gets a title, synopsis, category assignment, `is_published = true`, and `free_episodes = 2`. No cover images needed yet -- the SeriesCard already shows a fallback letter when no cover is set.

Also seed 2-3 active banners linked to featured series.

### 3. Rewrite `src/pages/Index.tsx`

Replace the reel feed with a scrollable browse layout:

```text
+------------------------------------------+
| Navbar (transparent overlay)             |
+------------------------------------------+
| [Hero Slider - auto-rotating banners]    |
|  <- dots indicator ->                    |
+------------------------------------------+
| Category: Romance                        |
| [card] [card] [card] [card] ->           |
+------------------------------------------+
| Category: Thriller                       |
| [card] [card] [card] [card] ->           |
+------------------------------------------+
| ... more category rows ...               |
+------------------------------------------+
| BottomNav                                |
+------------------------------------------+
```

- Fetch series with categories, group by category client-side
- Fetch active banners ordered by sort_order
- Use HeroSlider at top, CategoryRow for each group
- Full-width layout, vertical scroll (no snap)

### 4. New Component: `src/components/HeroSlider.tsx`

An auto-rotating image carousel using `embla-carousel-react` (already installed):

- Displays active banners from DB
- Auto-advances every 5 seconds
- Shows dot indicators at bottom
- Each slide: full-width image with gradient overlay, title, subtitle, and "Assistir" CTA button
- Clicking navigates to `/series/{link_series_id}`
- Aspect ratio: 16/9 on mobile, 21/9 on desktop (matching existing HeroBanner)

### 5. New Admin Page: `src/pages/admin/BannerManager.tsx`

Full CRUD management for banners, following the same pattern as SeriesManager:

- Table with columns: Title, Series, Order, Active, Actions
- Add/Edit via a dialog (not full-page form -- banners are simple)
- Fields: title, subtitle, image upload (to covers bucket), link to series (select dropdown), sort_order, is_active toggle
- Delete with confirmation AlertDialog

### 6. Update `src/pages/admin/AdminLayout.tsx`

Add "Banners" nav item to the sidebar, using an `Image` icon from lucide-react.

### 7. Update `src/App.tsx`

Add the admin banner route: `/admin/banners` -> `BannerManager`

### 8. Update `src/components/HeroBanner.tsx`

This component is no longer needed as a standalone -- HeroSlider replaces it. Keep the file but it won't be imported by Index anymore.

## Technical Details

### Data Fetching in Index.tsx

```typescript
// Fetch all published series with category names
const { data: seriesList } = useQuery({
  queryKey: ["browse-series"],
  queryFn: async () => {
    const { data } = await supabase
      .from("series")
      .select("id, title, cover_url, category_id, categories(name), episodes(id)")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    return data;
  },
});

// Fetch active banners
const { data: banners } = useQuery({
  queryKey: ["banners"],
  queryFn: async () => {
    const { data } = await supabase
      .from("banners")
      .select("*, series:link_series_id(id, title)")
      .eq("is_active", true)
      .order("sort_order");
    return data;
  },
});

// Group series by category
const categoryGroups = useMemo(() => {
  const groups: Record<string, { name: string; series: any[] }> = {};
  (seriesList || []).forEach((s) => {
    const catName = s.categories?.name || "Outros";
    if (!groups[catName]) groups[catName] = { name: catName, series: [] };
    groups[catName].series.push({
      ...s,
      category_name: catName,
      episode_count: s.episodes?.length || 0,
    });
  });
  return Object.values(groups);
}, [seriesList]);
```

### HeroSlider with Embla

```typescript
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const [emblaRef] = useEmblaCarousel({ loop: true }, [
  Autoplay({ delay: 5000, stopOnInteraction: false })
]);
```

### Banner Image Upload in Admin

Reuse the same pattern as SeriesForm cover upload -- upload to the `covers` storage bucket, store the public URL in `image_url`.

## Files Summary

| File | Action |
|------|--------|
| New migration SQL | Create `banners` table + seed categories, series, banners |
| `src/pages/Index.tsx` | Rewrite to browse layout |
| `src/components/HeroSlider.tsx` | Create (embla carousel) |
| `src/pages/admin/BannerManager.tsx` | Create (CRUD for banners) |
| `src/pages/admin/AdminLayout.tsx` | Add Banners nav item |
| `src/App.tsx` | Add `/admin/banners` route |

