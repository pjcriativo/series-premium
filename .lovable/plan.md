

# Add Visual Covers to All Demo Series

## Overview

All 21 demo series currently have no `cover_url` set. Only 3 have local fallback images via `demo-covers.ts`. We will update the database directly to give every series a visually distinct placeholder cover using free stock image URLs, so the home page cards look polished immediately.

## Approach

Use a data UPDATE (not a schema migration) to set `cover_url` on all 21 demo series using high-quality placeholder images from `picsum.photos`. Each series gets a unique image by using a different seed, producing consistent, visually distinct covers.

### URLs format
```
https://picsum.photos/seed/{series-title-slug}/400/600
```

This gives each series a unique, deterministic 400x600 image (portrait aspect ratio matching the 2/3 card ratio).

## Changes

### 1. Data update: Set `cover_url` for all 21 demo series

Run UPDATE statements for each series:

| Series | Cover URL |
|--------|-----------|
| Amor em Chamas | `https://picsum.photos/seed/amor-em-chamas/400/600` |
| Coracoes Cruzados | `https://picsum.photos/seed/coracoes-cruzados/400/600` |
| Promessas ao Luar | `https://picsum.photos/seed/promessas-ao-luar/400/600` |
| Sombras do Passado | `https://picsum.photos/seed/sombras-do-passado/400/600` |
| O Ultimo Segredo | `https://picsum.photos/seed/ultimo-segredo/400/600` |
| Zona de Risco | `https://picsum.photos/seed/zona-de-risco/400/600` |
| Confusoes em Familia | `https://picsum.photos/seed/confusoes-familia/400/600` |
| Plantao Maluco | `https://picsum.photos/seed/plantao-maluco/400/600` |
| Vizinhos Impossiveis | `https://picsum.photos/seed/vizinhos-impossiveis/400/600` |
| Alem do Horizonte | `https://picsum.photos/seed/alem-horizonte/400/600` |
| Lacos de Sangue | `https://picsum.photos/seed/lacos-sangue/400/600` |
| A Ultima Chance | `https://picsum.photos/seed/ultima-chance/400/600` |
| Operacao Resgate | `https://picsum.photos/seed/operacao-resgate/400/600` |
| Fogo Cruzado | `https://picsum.photos/seed/fogo-cruzado/400/600` |
| Cacadores de Elite | `https://picsum.photos/seed/cacadores-elite/400/600` |
| Reinos Perdidos | `https://picsum.photos/seed/reinos-perdidos/400/600` |
| A Profecia do Dragao | `https://picsum.photos/seed/profecia-dragao/400/600` |
| A Casa no Fim da Rua | `https://picsum.photos/seed/casa-fim-rua/400/600` |
| Sussurros na Escuridao | `https://picsum.photos/seed/sussurros-escuridao/400/600` |
| Geracao Z | `https://picsum.photos/seed/geracao-z/400/600` |
| Ultimo Ano | `https://picsum.photos/seed/ultimo-ano/400/600` |

### 2. No code changes needed

The `SeriesCard` component already renders `cover_url` when available via the `getSeriesCover` helper. Once the database has URLs, the cards will display images automatically.

## Files Summary

| File | Action |
|------|--------|
| Database (data update) | Set `cover_url` on 21 series rows |
| No code files changed | -- |

