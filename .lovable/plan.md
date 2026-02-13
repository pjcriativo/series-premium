
# Aumentar Tamanho dos Cards do Carrossel

## Problema

Os cards estao dimensionados para 7 por linha no desktop, o que os torna menores que os do ReelShort. O ReelShort mostra aproximadamente 6 cards visiveis por linha no desktop, com o 7o parcialmente visivel (indicando scroll).

## Alteracao

Reduzir a quantidade de cards visiveis por linha:

| Breakpoint | Atual | Novo |
|------------|-------|------|
| Desktop (lg) | 7 cards | 6 cards |
| Tablet (md) | 4 cards | 3 cards |
| Mobile | 2 cards | 2 cards (sem alteracao) |

## Calculos CSS Atualizados

Com gap-4 (1rem = 16px):

- **Desktop (6 cards)**: `lg:w-[calc((100%_-_5rem)/6)]` (5 gaps entre 6 cards)
- **Tablet (3 cards)**: `md:w-[calc((100%_-_2rem)/3)]` (2 gaps entre 3 cards)
- **Mobile (2 cards)**: `w-[calc((100%_-_1rem)/2)]` (sem alteracao)

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/CategoryRow.tsx` | Atualizar classes de largura dos cards (linha 25) |
| `src/pages/Index.tsx` | Atualizar classes de largura na secao "Continue Assistindo" (linha 106) |
| `src/components/HorizontalCarousel.tsx` | Atualizar `visibleCards` no calculo de scroll: desktop 7->6, tablet 4->3 (linha 44) |

## Detalhes Tecnicos

### HorizontalCarousel.tsx (linha 44)
Alterar a logica de scroll:
```
// Antes
const visibleCards = w >= 1024 ? 7 : w >= 768 ? 4 : 2;

// Depois  
const visibleCards = w >= 1024 ? 6 : w >= 768 ? 3 : 2;
```

### CategoryRow.tsx (linha 25)
```
// Antes
w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_3rem)/4)] lg:w-[calc((100%_-_6rem)/7)]

// Depois
w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)]
```

### Index.tsx (linha 106) - secao Continue Assistindo
Mesma alteracao de classes que o CategoryRow.

## Resultado

- Cards ~25% maiores no desktop
- Cards ~33% maiores no tablet
- Visual mais proximo do ReelShort
- Setas de navegacao aparecem com 7+ series (desktop) ou 4+ (tablet)
