

# Admin: CRUD de Episodios com Upload de Video

## Overview

Transform the placeholder `EpisodeForm` into a full-page form (matching the `SeriesForm` pattern), and simplify `EpisodeManager` to be a list-only page that links to the form routes. Add upload progress tracking and duplicate `episode_number` validation.

## Changes

### 1. `src/pages/admin/EpisodeForm.tsx` (Rewrite)

Full form page for `/admin/episodes/new` and `/admin/episodes/:id/edit`:

**Fields:**
- series_id (Select dropdown of all series)
- episode_number (number input)
- title (text)
- duration_seconds (number)
- is_free (Switch)
- price_coins (number)
- is_published (Switch)
- video upload (file input, accept `.mp4,video/mp4`)

**Upload with progress:**
- Use `XMLHttpRequest` instead of `supabase.storage.upload()` to track upload progress
- Show a `Progress` bar component during upload with percentage
- Upload state: idle, uploading (with %), done, error
- Save the storage path as `video_url` on the episode record

**Duplicate episode_number check:**
- Before saving, query `episodes` where `series_id = form.series_id` AND `episode_number = form.episode_number` AND `id != editId`
- If a match is found, show a toast error and abort save

**On edit mode:**
- Fetch episode by `id` param and populate the form
- If `video_url` exists, show a "Video atual: filename" indicator
- Allow re-uploading (replaces the old video_url)

**After save:** redirect to `/admin/episodes` with success toast, invalidate queries.

### 2. `src/pages/admin/EpisodeManager.tsx` (Update)

- Remove the `Dialog` form, all form state, `saveMutation`, `uploadVideo`, `openEdit`, `openCreate`, `videoFile`
- Change "Novo Episodio" button to a `Link` to `/admin/episodes/new`
- Change edit button (pencil) to a `Link` to `/admin/episodes/:id/edit`
- Keep: series filter Select, table, search, pagination, delete confirmation, delete mutation

### Technical Details

**Upload with progress using XHR:**

```typescript
const uploadVideoWithProgress = (file: File, onProgress: (pct: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const path = `${crypto.randomUUID()}.mp4`;
    const url = `https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/videos/${path}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(path) : reject(new Error("Upload failed"));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
};
```

**Duplicate check:**

```typescript
const { data: existing } = await supabase
  .from("episodes")
  .select("id")
  .eq("series_id", form.series_id)
  .eq("episode_number", form.episode_number)
  .neq("id", editId ?? "00000000-0000-0000-0000-000000000000")
  .maybeSingle();

if (existing) {
  toast({ title: "Erro", description: "Ja existe um episodio com esse numero nesta serie.", variant: "destructive" });
  return;
}
```

**Progress UI:**

```typescript
// State
const [uploadProgress, setUploadProgress] = useState<number | null>(null);

// In form, below file input
{uploadProgress !== null && (
  <div className="space-y-1">
    <Progress value={uploadProgress} className="h-2" />
    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
  </div>
)}
```

## Files Summary

| File | Action |
|------|--------|
| `src/pages/admin/EpisodeForm.tsx` | Rewrite (full form with video upload + progress) |
| `src/pages/admin/EpisodeManager.tsx` | Update (remove dialog, use links) |

## No Database or Route Changes

Routes `/admin/episodes/new` and `/admin/episodes/:id/edit` already exist in `App.tsx`. The `episodes` table and `videos` storage bucket already exist with correct RLS policies.

