
# Adicionar Botão "Ver Todos os Episódios" no Player

## Contexto atual

O player (`src/pages/EpisodePlayer.tsx`) já possui um breadcrumb no painel direito com link para `/series/:id`. Porém, não há nenhum botão visível e destacado que convide o usuário a voltar à página da série — o breadcrumb é pequeno e textual, não chamativo.

O plano adiciona **dois pontos de acesso** ao botão de voltar, ambos no mesmo arquivo:

---

## Mudanças planejadas

### 1. Botão flutuante sobre o vídeo (canto superior esquerdo)

Dentro do container do vídeo (a `<div>` com `relative`), adicionar um botão com ícone de seta que flutua no canto superior esquerdo, sobre o vídeo, sempre visível:

```tsx
// Dentro da div do vídeo, logo após a abertura do container
<Link
  to={`/series/${seriesId}`}
  className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
>
  <ChevronLeft className="h-3.5 w-3.5" />
  Todos os episódios
</Link>
```

Este botão aparece tanto para vídeo nativo quanto para YouTube, pois é colocado antes do `{youtubeId ? ...}`.

### 2. Botão dedicado no painel direito (abaixo do título dos episódios)

Logo abaixo do título da grade de episódios, adicionar um botão secundário com link para a página da série:

```tsx
// Abaixo do <h2>Episódios</h2>, antes do grid
<Link
  to={`/series/${seriesId}`}
  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
>
  <ChevronLeft className="h-3.5 w-3.5" />
  Ver página da série
</Link>
```

### 3. Importar `ChevronLeft`

Adicionar `ChevronLeft` à lista de imports do `lucide-react` (linha 3):

```tsx
// Antes:
import { Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, Loader2, Lock, Heart, Star, Share2, Maximize } from "lucide-react";

// Depois:
import { Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, ChevronLeft, Loader2, Lock, Heart, Star, Share2, Maximize } from "lucide-react";
```

---

## Resultado visual esperado

```text
┌─────────────────────────────────────┐
│ ← Todos os episódios     [vídeo]    │  ← botão flutuante no canto superior
│                                     │
│         [ VÍDEO 9:16 ]             │
│                                     │
│  ▶  🔊  ⛶                          │
└─────────────────────────────────────┘

Painel direito:
  Episódio 3 — Título do Episódio
  Nome da Série

  Episódios
  ← Ver página da série       ← link textual discreto
  [ 1 ][ 2 ][■3][ 4 ][ 5 ][ 🔒6 ]
```

---

## Resumo das mudanças

| Arquivo | Alteração |
|---|---|
| `src/pages/EpisodePlayer.tsx` | Importar `ChevronLeft`; adicionar botão flutuante no vídeo; adicionar link no painel direito |

## O que NÃO será alterado
- Breadcrumb existente (permanece)
- Layout do vídeo (9:16, posicionamento)
- Grade de episódios
- Lógica de paywall e desbloqueio
