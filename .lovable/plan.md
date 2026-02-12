

# Add Cover Images to Hero Slider Banners

## Overview

The 3 seeded banners currently have no `image_url`, so the hero slider shows a plain gradient fallback. We will update each banner with a wide landscape placeholder image from `picsum.photos` to make the slider visually attractive.

## Changes

### Database data update only -- no code changes

Update `image_url` for the 3 existing banners using wide (1200x500) picsum images with unique seeds:

| Banner | Image URL |
|--------|-----------|
| Amor em Chamas | `https://picsum.photos/seed/banner-amor/1200/500` |
| Sombras do Passado | `https://picsum.photos/seed/banner-sombras/1200/500` |
| Confusoes em Familia | `https://picsum.photos/seed/banner-confusoes/1200/500` |

The 1200x500 aspect ratio matches the hero slider's 21/9 desktop ratio well and loads quickly.

### SQL

```sql
UPDATE banners SET image_url = CASE id
  WHEN 'b0000001-0000-4000-8000-000000000001' THEN 'https://picsum.photos/seed/banner-amor/1200/500'
  WHEN 'b0000001-0000-4000-8000-000000000002' THEN 'https://picsum.photos/seed/banner-sombras/1200/500'
  WHEN 'b0000001-0000-4000-8000-000000000003' THEN 'https://picsum.photos/seed/banner-confusoes/1200/500'
END
WHERE id IN (
  'b0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000002',
  'b0000001-0000-4000-8000-000000000003'
);
```

## Files Summary

| File | Action |
|------|--------|
| Database (data update) | Set `image_url` on 3 banner rows |
| No code files changed | -- |

