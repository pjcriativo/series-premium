
# Corrigir Tela Preta ao Trocar de Episódio no Player

## Causa Raiz do Bug

Quando o usuário navega de `/watch/episodeA` para `/watch/episodeB`, o React **reutiliza o mesmo componente `EpisodePlayer`** (pois a rota `/watch/:episodeId` é a mesma). Isso significa:

1. O mesmo elemento `<video>` permanece no DOM
2. O `src` do vídeo é atualizado via `videoUrl` (que vem de uma query assíncrona)
3. O browser detecta a mudança de `src`, mas o elemento ainda está no estado anterior (paused/playing)
4. O resultado: o browser precisa ser notificado explicitamente para reiniciar o carregamento — sem isso, o vídeo fica preto mas o áudio do buffer antigo ainda toca

**Evidência no código atual** (`EpisodePlayer.tsx`, linha 154-178):
```tsx
<video
  ref={videoRef}
  src={videoUrl}       // ← src muda mas o elemento não é destruído/recriado
  ...
/>
```

Quando `videoUrl` muda (nova URL assinada), o browser precisa de um `video.load()` explícito para reiniciar. Sem ele, o comportamento é indefinido — tela preta + áudio do buffer anterior.

## Solução: Forçar Remontagem com `key` prop

A solução mais confiável e alinhada com o padrão React é adicionar `key={episodeId}` no elemento `<video>`. Isso faz o React **destruir e recriar o elemento DOM** cada vez que o episódio muda, garantindo:

- Novo elemento `<video>` limpo, sem estado residual do episódio anterior
- O browser inicializa o carregamento desde zero
- Autoplay funciona normalmente na remontagem
- Zero áudio residual do episódio anterior

```tsx
<video
  key={episodeId}      // ← garante destruição/recriação ao trocar de episódio
  ref={videoRef}
  src={videoUrl}
  ...
/>
```

Adicionalmente, é preciso resetar os estados locais (`currentTime`, `duration`, `isPlaying`, `showEndScreen`) quando o `episodeId` muda, pois eles ficam com os valores do episódio anterior até que os eventos do novo vídeo os atualizem.

## Para o YouTube

O mesmo problema existe com o player do YouTube — o `div` container é reutilizado. A solução é adicionar `key={youtubeId}` no container do YouTube, forçando a reinicialização do `YT.Player`.

```tsx
<div
  key={youtubeId}     // ← recria o container ao trocar de episódio YT
  ref={ytContainerRef}
  className="w-full h-full"
/>
```

## Mudanças Técnicas

### 1. `src/pages/EpisodePlayer.tsx`

**Adicionar `key` no elemento `<video>`:**
```tsx
// Linha ~154 — adicionar key={episode?.id}
<video
  key={episode?.id}
  ref={videoRef}
  src={videoUrl}
  className="h-full w-full object-contain"
  muted={isMuted}
  playsInline
  autoPlay         // ← também adicionar autoPlay para iniciar automaticamente
  onClick={togglePlay}
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={...}
  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}
  onEnded={handleEnded}
/>
```

**Adicionar `key` no container do YouTube:**
```tsx
// Linha ~149 — adicionar key={youtubeId}
<div
  key={youtubeId}
  ref={ytContainerRef}
  className="w-full h-full"
/>
```

### 2. `src/hooks/useEpisodePlayer.ts`

**Resetar estados quando `episodeId` muda:**

Adicionar um `useEffect` que reseta `currentTime`, `duration`, `isPlaying` e `showEndScreen` sempre que o `episodeId` muda:

```typescript
// Reset de estado ao trocar de episódio
useEffect(() => {
  setCurrentTime(0);
  setDuration(0);
  setIsPlaying(false);
  setShowEndScreen(false);
}, [episodeId]);
```

Sem esse reset, a barra de progresso e os controles mostram os valores do episódio anterior enquanto o novo vídeo carrega.

## Fluxo Corrigido

```text
Usuário clica no episódio #2 (estava no #1)
         ↓
navigate("/watch/episodeId2") → episodeId muda
         ↓
useEffect reseta currentTime=0, duration=0, isPlaying=false
         ↓
React detecta key={episodeId2} ≠ key={episodeId1}
         ↓
React DESTRÓI o <video> antigo e CRIA um novo elemento
         ↓
Novo <video> com src={videoUrl do ep2} inicia carregamento
         ↓
onLoadedMetadata dispara → autoPlay começa → vídeo aparece imediatamente
```

## Arquivos Alterados

- **`src/pages/EpisodePlayer.tsx`**: Adicionar `key={episode?.id}` no `<video>` e `key={youtubeId}` no container YouTube; adicionar `autoPlay` no `<video>`
- **`src/hooks/useEpisodePlayer.ts`**: Adicionar `useEffect` para resetar estados ao trocar de episódio
