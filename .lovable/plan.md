

# Generate AI Cover Images for All Series

## Overview

Create an edge function that uses Lovable AI's image generation model (google/gemini-2.5-flash-image) to generate thematic cover images for each series based on its title, synopsis, and category. The generated images will be uploaded to the existing `covers` Supabase Storage bucket, and the `cover_url` in the database will be updated to point to the public storage URL.

## Architecture

The process will be driven by an admin-triggered edge function that:
1. Fetches all series from the database
2. For each series, generates a themed cover image via Lovable AI
3. Uploads the resulting image to the `covers` storage bucket
4. Updates the series `cover_url` to the public storage URL

Since generating 21 images sequentially could take a while, the function will process them one at a time and return progress. An admin page button will trigger the generation.

## Changes

### 1. New Edge Function: `generate-covers`

**File:** `supabase/functions/generate-covers/index.ts`

- Accepts optional `series_id` param (single series) or processes all series if omitted
- For each series, builds a prompt using title, synopsis, and category:
  ```
  "Create a dramatic portrait book/movie cover image (2:3 ratio) for a {category} series titled '{title}'. Synopsis: {synopsis}. 
   Style: cinematic, moody, no text or letters on the image."
  ```
- Calls the Lovable AI gateway with `google/gemini-2.5-flash-image` model and `modalities: ["image", "text"]`
- Extracts the base64 image from the response
- Uploads to `covers` bucket as `{series_id}.png`
- Updates `series.cover_url` with the public URL
- Requires admin authentication (checks `has_role`)

### 2. Update `supabase/config.toml`

Add the new function config:
```toml
[functions.generate-covers]
verify_jwt = false
```

### 3. New Admin UI: "Generate Covers" button

**File:** `src/pages/admin/SeriesManager.tsx` (modify)

- Add a "Generate AI Covers" button at the top of the series manager
- On click, calls the `generate-covers` edge function
- Shows a progress toast as images are generated
- Option to regenerate a single series cover from the series list

### 4. Also generate banner images

The edge function will also support a `type=banners` parameter to generate wide landscape (21:9) images for the 3 banners using similar AI prompts.

## Technical Details

### Edge Function Flow

```
Admin clicks "Generate Covers"
  -> POST /generate-covers (with auth token)
  -> Verify admin role via service_role + has_role check
  -> Fetch series list from DB
  -> For each series:
      1. Build themed prompt from title/synopsis/category
      2. POST to ai.gateway.lovable.dev with gemini-2.5-flash-image
      3. Decode base64 PNG response
      4. Upload to covers/{series_id}.png via Supabase Storage
      5. UPDATE series SET cover_url = public_url
  -> Return summary of generated covers
```

### Storage

The `covers` bucket already exists and is public, so uploaded images will be immediately accessible via public URLs.

### Prompt Strategy

Each genre gets visual cues:
- **Romance**: warm tones, couple silhouettes, sunset/moonlight
- **Thriller**: dark, mysterious, shadows, suspenseful mood
- **Comedy**: bright colors, playful, exaggerated expressions
- **Drama**: emotional, cinematic lighting, intense gazes
- **Action**: explosive, dynamic, high energy
- **Fantasy**: magical, ethereal, mythical creatures
- **Terror**: dark, eerie, haunting atmosphere
- **Jovem Adulto**: modern, youthful, vibrant

### Rate Limiting Consideration

To avoid hitting Lovable AI rate limits with 21 sequential requests, the function will add a 3-second delay between generations. Total expected time: ~2 minutes for all 21 series.

## Files Summary

| File | Action |
|------|--------|
| `supabase/functions/generate-covers/index.ts` | Create - AI image generation edge function |
| `supabase/config.toml` | Modify - add function config |
| `src/pages/admin/SeriesManager.tsx` | Modify - add "Generate AI Covers" button |

