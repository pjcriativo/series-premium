
# Corrigir Tela Preta: Skeleton Durante Fetch da URL Assinada

## Causa Raiz Real do Bug (Diagnóstico Atualizado)

O fix anterior (`key` no `<video>`) resolve a reutilização do elemento, mas **não resolve o timing**. O fluxo atual após trocar de episódio é:

```
episodeId muda
    ↓
epLoading=true, accessLoading=true → isLoading=true → skeleton exibido ✓
    ↓
epLoading=false, accessLoading=false → isLoading=false → skeleton REMOVIDO
    ↓
videoUrl ainda é undefined (query ainda buscando URL assinada) ← PROBLEMA
    ↓
<video key={episode?.id} src={undefined}> monta → tela PRETA
    ↓
Alguns segundos depois: videoUrl resolve → src muda → mas key NÃO muda
    ↓
React não recria o <video> (key é o mesmo) → browser fica com tela preta
    ↓
Usuário precisa atualizar a página 2x para ver o vídeo
```

**O bug em código** (`EpisodePlayer.tsx`, linha 88):
```typescript
const isLoading = epLoading || accessLoading;
// ↑ NÃO inclui "videoUrl está carregando"
```

E na linha 153:
```tsx
} : videoUrl ? (
  // ← só renderiza o <video> quando videoUrl existe
  // mas quando videoUrl=undefined, renderiza o fallback "Vídeo não disponível"
  // e quando videoUrl depois chega, o key={episode?.id} NÃO muda → sem recriação
```

## Solução

### Parte 1 — Exportar `videoUrlLoading` do hook

No `useEpisodePlayer.ts`, a query de URL assinada precisa expor seu estado de loading:

```typescript
const { data: videoUrl, isLoading: videoUrlLoading } = useQuery({
  queryKey: ["video-url", episode?.video_url],
  ...
  enabled: !!episode?.video_url && hasAccess === true && !youtubeId,
});
```

Retornar `videoUrlLoading` no objeto de retorno do hook.

### Parte 2 — Incluir `videoUrlLoading` no estado de loading da UI

No `EpisodePlayer.tsx`:

```typescript
const {
  // ... outros campos
  videoUrlLoading,
} = useEpisodePlayer();

// Mostrar skeleton enquanto qualquer dado essencial está carregando
// Para YouTube: não há videoUrlLoading (youtubeId está disponível direto do episode)
// Para vídeo nativo: aguardar videoUrl
const isLoading = epLoading || accessLoading || 
  (!youtubeId && !!episode?.video_url && videoUrlLoading);
```

Dessa forma, o skeleton permanece visível até a URL assinada estar disponível, e quando o `<video>` montar pela primeira vez, já terá `src={videoUrl}` com a URL correta — sem tela preta.

### Parte 3 — Usar `videoUrl` como parte da `key` do `<video>`

Para garantir que o `<video>` seja recriado quando a URL assinada mudar (troca de episódio + nova URL):

```tsx
<video
  key={`${episode?.id}-${videoUrl}`}
  ref={videoRef}
  src={videoUrl}
  ...
/>
```

Isso garante: se o `episode?.id` mudar E a nova `videoUrl` já estiver disponível, o elemento é destruído e recriado com a URL correta já no `src`.

## Diagrama do Fluxo Corrigido

```
episodeId muda
    ↓
epLoading=true → isLoading=true → skeleton ✓
    ↓
epLoading=false, videoUrlLoading=true → isLoading=true → skeleton ✓
    ↓
videoUrlLoading=false, videoUrl=https://... → isLoading=false → skeleton remove
    ↓
<video key="epId-https://..."  src="https://..."> monta COM src já definido
    ↓
autoPlay inicia → vídeo aparece IMEDIATAMENTE
```

## Arquivos Alterados

### `src/hooks/useEpisodePlayer.ts`
- Capturar `isLoading: videoUrlLoading` da query de URL assinada
- Adicionar `videoUrlLoading` ao objeto de retorno do hook

### `src/pages/EpisodePlayer.tsx`
- Desestruturar `videoUrlLoading` do hook
- Atualizar `isLoading` para incluir o estado da URL assinada
- Atualizar `key` do `<video>` para `${episode?.id}-${videoUrl}` (garante recriação quando URL chega)
