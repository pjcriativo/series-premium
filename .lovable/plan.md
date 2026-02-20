
# Correção Definitiva: Tela Preta ao Trocar de Episódio (YouTube)

## Diagnóstico Final — 3 Bugs Reais Identificados

### Bug 1: YouTube player antigo não é destruído antes do novo ser criado

O `useEffect` no `EpisodePlayer.tsx` tem `[youtubeId]` como dependência. Quando o usuário troca de episódio:

- A função de cleanup do `useEffect` **não destrói o player** (`ytPlayerRef.current`)
- O player antigo continua existindo em memória e tentando enviar `postMessage` para o iframe que já foi removido do DOM
- Isso causa o erro: `Failed to execute 'postMessage' on 'DOMWindow': The target origin provided ('https://www.youtube.com') does not match the recipient window's origin ('https://www.epsodiox.com')`

**Fix**: Adicionar `return () => { ytPlayerRef.current?.destroy?.(); ytPlayerRef.current = null; }` no `useEffect` do YouTube.

### Bug 2: `navigateWithTransition` usa `setTimeout` que conflita com o ciclo de vida do React

A função atual:
```typescript
const navigateWithTransition = useCallback((path: string) => {
  setIsTransitioning(true);
  setTimeout(() => navigate(path), 200); // ← navega 200ms depois
}, [navigate]);
```

O problema: durante esses 200ms, o player antigo ainda está montado **com o `isTransitioning=true`** mostrando o skeleton. Quando o `navigate()` finalmente executa, o React tenta remontar — mas o player do YouTube (se ambos os episódios forem YouTube) não reconhece a mudança do `key={youtubeId}` porque o `youtubeId` novo ainda não foi buscado. O `key` não mudou, então o YouTube container **não é recriado**.

**Fix**: Remover o `setTimeout` e navegar diretamente, usando apenas o React Query + loading states para mostrar o skeleton. A transição de fade pode ser mantida com CSS mas sem delay no `navigate`.

### Bug 3: `key={youtubeId}` não garante remontagem se ambos os episódios têm YouTube

Se o episódio A tem `youtubeId = "abc123"` e episódio B tem `youtubeId = "xyz789"`, a `key` muda → funciona.

Mas se o componente monta com o `youtubeId` antigo porque o `episode` ainda não foi buscado (`epLoading=true`), o `key` do container ainda é o `youtubeId` antigo. Quando o `episode` novo chega, o `youtubeId` muda → **o container é recriado** — mas o `useEffect` que inicializa o YT.Player tem `[youtubeId]` como dependência e vai tentar reinicializar. Porém a limpeza do player antigo não acontece porque o `useEffect` cleanup roda com o novo `youtubeId`.

**Fix combinado**: Usar `episodeId` (não `youtubeId`) como `key` do container YouTube + destruir o player antigo no cleanup.

## Solução Completa

### Mudança 1 — `src/pages/EpisodePlayer.tsx`: Destruir player e usar `key={episodeId}`

```tsx
// useEffect YouTube: adicionar cleanup com destroy
useEffect(() => {
  if (!youtubeId) return;

  const initPlayer = () => { ... };

  // ... mesma lógica de init

  // NOVO: cleanup que destrói o player
  return () => {
    try {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    } catch (_) {}
  };
}, [youtubeId]); // ← continua dependendo de youtubeId
```

```tsx
// Container YouTube: key baseado em episodeId (não youtubeId)
{youtubeId ? (
  <div
    key={episodeId}  // ← muda toda vez que o episódio muda
    ref={ytContainerRef}
    className="w-full h-full"
  />
) : ...}
```

### Mudança 2 — `src/pages/EpisodePlayer.tsx`: Remover `setTimeout` do `navigateWithTransition`

```typescript
// ANTES (com bug):
const navigateWithTransition = useCallback((path: string) => {
  setIsTransitioning(true);
  setTimeout(() => navigate(path), 200); // ← delay problemático
}, [navigate]);

// DEPOIS (sem bug):
const navigateWithTransition = useCallback((path: string) => {
  navigate(path); // navega imediato, skeleton é controlado pelo isLoading do hook
}, [navigate]);
```

O skeleton já existe e é controlado por `isLoading = epLoading || accessLoading || videoUrlLoading`. Não é necessário o `setTimeout` — o feedback visual já está garantido pelo React Query loading states.

### Mudança 3 — `src/pages/EpisodePlayer.tsx`: Remover `isTransitioning` do render

Com o `setTimeout` removido, o `isTransitioning` não é mais necessário. A condição no JSX:

```tsx
// REMOVER:
{isTransitioning ? (
  <Skeleton className="w-full h-full rounded-none" />
) : youtubeId ? (
```

Passa a ser simplesmente:

```tsx
// SIMPLIFICADO:
{youtubeId ? (
  <div key={episodeId} ref={ytContainerRef} className="w-full h-full" />
) : videoUrl ? (
  <video key={`${episodeId}-${videoUrl}`} ... />
) : (
  ...
)}
```

O skeleton de loading já está no bloco `if (isLoading) { return <Skeleton...> }` no topo do componente.

### Mudança 4 — `src/hooks/useEpisodePlayer.ts`: Expor `episodeId` no retorno

O `episodeId` já existe no hook (via `useParams`) mas não é retornado. Precisamos exportá-lo para o `EpisodePlayer.tsx` usar como `key`:

```typescript
return {
  episodeId, // ← NOVO
  episode, epLoading, ...
};
```

## Fluxo Corrigido

```text
Usuário clica "Episódio 2"
         ↓
navigate("/watch/ep2Id") — imediato, sem delay
         ↓
episodeId muda → useEffect cleanup roda → ytPlayer.destroy() ← FIX BUG 1
         ↓
epLoading=true → isLoading=true → skeleton exibido
         ↓
episode novo chega → youtubeId novo derivado
         ↓
key={episodeId} no container mudou → div destruída e recriada ← FIX BUG 3
         ↓
useEffect [youtubeId] roda → novo YT.Player criado no mountDiv
         ↓
onReady → autoplay inicia → vídeo aparece imediatamente ✓
```

## Arquivos Alterados

### `src/pages/EpisodePlayer.tsx`
- Adicionar `episodeId` na desestruturação do hook
- Adicionar cleanup com `ytPlayerRef.current?.destroy()` no `useEffect` do YouTube
- Trocar `key={youtubeId}` por `key={episodeId}` no container YouTube
- Remover `navigateWithTransition` com `setTimeout` — navegar direto
- Remover `isTransitioning` state e a branch do skeleton transitório
- Remover `isTransitioning` do `cn()` da classe de animação

### `src/hooks/useEpisodePlayer.ts`
- Adicionar `episodeId` ao objeto de retorno do hook
