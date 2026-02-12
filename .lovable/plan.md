

# Admin: CRUD de Series (Full-Page Forms)

## Overview

Replace the current dialog-based series form in `SeriesManager` with dedicated full-page form routes (`/admin/series/new` and `/admin/series/:id/edit`). The list page keeps search, pagination, and delete confirmation but links to the form pages instead of opening a modal.

## Changes

### 1. `src/pages/admin/SeriesForm.tsx` (Rewrite)

Build out the placeholder into a full form page with:

- **Back button** linking to `/admin/series`
- **Title**: "Nova Serie" or "Editar Serie" based on URL param
- **Fields**: title, slug (auto-generated from title), synopsis (textarea), category_id (select), cover upload (file input + current cover preview), total_episodes (number), free_episodes (number), is_published (switch)
- **On edit**: fetch series by `id` param, populate form. Show current cover image if exists.
- **Cover upload**: upload to `covers` bucket, same logic as current SeriesManager
- **Auto total_episodes**: after save, query `episodes` table for `MAX(episode_number)` where `series_id = id` and update `total_episodes` if the count is higher than the manual value
- **Save**: insert or update in `series` table, then redirect to `/admin/series` with a success toast
- **Queries**: fetch categories for the select dropdown, fetch series data on edit

### 2. `src/pages/admin/SeriesManager.tsx` (Update)

- Remove the `Dialog` form (all form state, `saveMutation`, `uploadCover`, `openEdit`, `coverFile`)
- Change "Nova Serie" button to a `Link` to `/admin/series/new`
- Change edit button (pencil icon) to a `Link` to `/admin/series/:id/edit`
- Keep: table, search, pagination, delete confirmation, delete mutation

### 3. No Route Changes

Routes `/admin/series/new` and `/admin/series/:id/edit` already exist in `App.tsx`.

## Technical Details

### SeriesForm Implementation

```typescript
// Load series on edit
const { data: series } = useQuery({
  queryKey: ["admin-series-detail", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("series").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  enabled: !!id,
});

// Populate form when series data loads
useEffect(() => {
  if (series) setForm({ ...series, category_id: series.category_id ?? "" });
}, [series]);

// After save, auto-update total_episodes
const { data: maxEp } = await supabase
  .from("episodes")
  .select("episode_number")
  .eq("series_id", savedId)
  .order("episode_number", { ascending: false })
  .limit(1)
  .maybeSingle();

if (maxEp && maxEp.episode_number > form.total_episodes) {
  await supabase.from("series").update({ total_episodes: maxEp.episode_number }).eq("id", savedId);
}

// Redirect after save
navigate("/admin/series");
```

### Cover Preview on Edit

When editing, if `form.cover_url` exists and no new file is selected, show a small thumbnail of the current cover above the file input.

## Files Summary

| File | Action |
|------|--------|
| `src/pages/admin/SeriesForm.tsx` | Rewrite (full form page) |
| `src/pages/admin/SeriesManager.tsx` | Update (remove dialog, use links) |

## No Database Changes

All tables and policies already exist.

