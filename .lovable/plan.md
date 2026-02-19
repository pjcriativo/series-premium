
# Três melhorias de UX: Retomar no segundo exato, Fade-in na Série e Play no Card

## 1. Retomar vídeo no segundo exato (useEpisodePlayer.ts + EpisodePlayer.tsx)

### Problema atual
O hook já tenta restaurar a posição (linha 237-243 de `useEpisodePlayer.ts`), mas há uma condição de corrida: o `useEffect` roda quando `savedProgress` ou `videoUrl` mudam, porém nesse momento `videoRef.current` pode existir enquanto o vídeo ainda não carregou seus metadados — fazendo o `currentTime` ser ignorado pelo browser (ele reseta para 0 quando o vídeo carrega).

### Solução
A forma correta é aplicar o seek **dentro do evento `onLoadedMetadata`** do elemento `<video>`, que dispara exatamente quando o browser já sabe a duração e aceita `currentTime`. Isso garante 100% de confiabilidade.

**Mudança em `src/hooks/useEpisodePlayer.ts`**:
- Remover o `useEffect` de "Restore position" que usa `savedProgress + videoUrl`
- Exportar `savedProgress` do hook para que o componente possa usá-lo no handler de `onLoadedMetadata`

**Mudança em `src/pages/EpisodePlayer.tsx`**:
- No `<video>`, atualizar o handler `onLoadedMetadata`:
```tsx
onLoadedMetadata={() => {
  const dur = videoRef.current?.duration ?? 0;
  setDuration(dur);
  // Restaurar posição exata se existe progresso salvo para este episódio
  if (
    savedProgress &&
    savedProgress.last_position_seconds > 0 &&
    savedProgress.last_episode_number === episode?.episode_number &&
    videoRef.current
  ) {
    videoRef.current.currentTime = savedProgress.last_position_seconds;
  }
}}
```

---

## 2. Fade-in na página de detalhes da série (SeriesDetail.tsx)

### Problema atual
`SeriesDetail.tsx` tem `<main className="pt-14">` sem nenhuma animação de entrada. As animações `animate-fade-in` e `animate-fade-out` já existem no `tailwind.config.ts` (adicionadas anteriormente).

### Solução
Adicionar `animate-fade-in` no `<main>` da página de detalhes da série. Como essa página não tem navegação interna entre páginas (não precisa de fade-out), apenas o fade-in de entrada é suficiente:

```tsx
// Antes:
<main className="pt-14">

// Depois:
<main className="pt-14 animate-fade-in">
```

---

## 3. Ícone de Play visível no card "Continue Assistindo" (Index.tsx)

### Problema atual
O card tem apenas um badge "Ep. X" no canto inferior esquerdo. Não há nenhuma indicação visual de que o clique vai reproduzir um episódio diretamente.

### Solução
Adicionar um botão circular com ícone `Play` centralizado sobre a imagem, com transição opacity (invisível por padrão, visível no hover no desktop; sempre visível no mobile via opacidade reduzida):

```tsx
{/* Overlay com ícone de Play — sempre visível (mobile) e destaque no hover (desktop) */}
<div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
    <Play className="h-6 w-6 text-white fill-white" />
  </div>
</div>
```

O `group-hover` já funciona porque o `<Link>` pai já tem `className="group ..."`.

---

## Resumo das mudanças

| Arquivo | Alteração |
|---|---|
| `src/hooks/useEpisodePlayer.ts` | Remover `useEffect` de restore; exportar `savedProgress` |
| `src/pages/EpisodePlayer.tsx` | Handler `onLoadedMetadata` aplica seek com `savedProgress`; adicionar `savedProgress` nos desestruturados do hook |
| `src/pages/SeriesDetail.tsx` | `<main>` recebe `animate-fade-in` |
| `src/pages/Index.tsx` | Card "Continue Assistindo" recebe overlay com ícone `Play` e import de `Play` do lucide-react |

## O que NÃO será alterado
- Lógica de salvamento de progresso (salva a cada 5s e no unmount)
- Animações de transição entre episódios no player
- Layout do card, carrossel, ou qualquer outra seção da home
- Lógica de acesso, paywall, ou unlocks
