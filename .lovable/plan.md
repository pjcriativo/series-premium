

# Carrossel Horizontal Estilo ReelShort

## Resumo

Substituir o scroll livre atual das linhas de categorias por um carrossel horizontal controlado por setas laterais, com responsividade (7 cards desktop, 4 tablet, 2 mobile) e estilo dark inspirado no ReelShort.

## Alteracoes

### 1. Criar componente `HorizontalCarousel` (`src/components/HorizontalCarousel.tsx`)

Componente reutilizavel que recebe titulo e children (os cards). Usa `useRef` para controlar scroll via `scrollBy` com `behavior: "smooth"`. Botoes esquerda/direita semi-transparentes sobrepostos, visiveis apenas quando ha scroll disponivel naquela direcao (controlado por estado atualizado via `onScroll` e `ResizeObserver`).

Responsividade dos cards calculada via CSS grid ou largura percentual:
- Desktop (>1024px): `calc((100% - 6*gap) / 7)` -- 7 cards
- Tablet (768-1024px): `calc((100% - 3*gap) / 4)` -- 4 cards  
- Mobile (<768px): `calc((100% - 1*gap) / 2)` -- 2 cards

Container: `overflow-x-hidden`, scroll controlado apenas por botoes.

Botoes: `position: absolute`, `top: 50%`, fundo `bg-black/50 hover:bg-black/80`, icones `ChevronLeft`/`ChevronRight` do Lucide.

### 2. Atualizar `CategoryRow` (`src/components/CategoryRow.tsx`)

Substituir o `div` com `overflow-x-auto scrollbar-hide` pelo novo `HorizontalCarousel`. Cada `SeriesCard` sera envolvido em um wrapper com largura responsiva.

### 3. Atualizar `SeriesCard` (`src/components/SeriesCard.tsx`)

Remover a largura fixa (`w-36 md:w-44`) e `flex-shrink-0` do card. O card passa a ocupar 100% do wrapper do carrossel. Adicionar `hover:scale-105 transition-transform duration-300`.

### 4. Atualizar `Index.tsx` -- secao "Continue Assistindo"

Substituir o scroll livre inline da secao "Continue Assistindo" pelo mesmo `HorizontalCarousel`, para manter consistencia visual.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/HorizontalCarousel.tsx` | Criar -- componente de carrossel com setas |
| `src/components/CategoryRow.tsx` | Editar -- usar HorizontalCarousel |
| `src/components/SeriesCard.tsx` | Editar -- remover largura fixa, hover scale |
| `src/pages/Index.tsx` | Editar -- usar HorizontalCarousel na secao Continue Assistindo |

## Detalhes Tecnicos

### HorizontalCarousel -- logica dos botoes

```text
onScroll / ResizeObserver:
  canScrollLeft = container.scrollLeft > 0
  canScrollRight = container.scrollLeft + container.clientWidth < container.scrollWidth

scroll(direction):
  cardWidth = container.firstChild.offsetWidth + gap
  visibleCards = window >= 1024 ? 7 : window >= 768 ? 4 : 2
  container.scrollBy({ left: direction * cardWidth * visibleCards, behavior: "smooth" })
```

### Responsividade dos cards (CSS)

Cada card wrapper tera classes Tailwind:
```
w-[calc((100%-1*0.75rem)/2)]    // mobile: 2 cards, gap-3
md:w-[calc((100%-3*0.75rem)/4)] // tablet: 4 cards
lg:w-[calc((100%-6*0.75rem)/7)] // desktop: 7 cards
flex-shrink-0
```

### Estilo visual

- Container com `max-w-7xl mx-auto px-4`
- Cards com `rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300`
- Botoes com `bg-black/50 hover:bg-black/80 rounded-full p-2` posicionados absolutos nas laterais
- Aspect ratio dos cards: `aspect-[2/3]` (mantido do atual)

