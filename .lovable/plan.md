

# Ajustar Visual do Carrossel para Estilo ReelShort

## Situacao Atual

O carrossel horizontal JA ESTA implementado e funcionando corretamente. Os cards tem o tamanho correto para 7 por linha no desktop. O motivo de nao parecer com o ReelShort e que cada categoria tem apenas 2-3 series - os cards ficam agrupados na esquerda com espaco vazio na direita. As setas so aparecem quando ha mais itens do que o visivel (8+ no desktop).

**Com 7+ series por categoria, o carrossel ja funciona identico ao ReelShort.**

## Ajustes Visuais para Aproximar do ReelShort

### 1. Aumentar gap entre cards e titulo da secao

ReelShort usa gap maior (~20px) entre cards e titulos maiores/mais bold.

- `HorizontalCarousel.tsx`: gap-3 (12px) para gap-4 (16px), titulo de `text-lg` para `text-xl font-bold`
- Adicionar link "Ver tudo >" ao lado direito do titulo (como no ReelShort)

### 2. Remover badge de categoria dos cards

No ReelShort, os cards NAO tem badge de categoria sobreposta - a categoria ja esta no titulo da secao.

- `SeriesCard.tsx`: remover o badge `category_name` que aparece no canto superior esquerdo

### 3. Aumentar espacamento entre secoes

- `HorizontalCarousel.tsx`: mb-8 para mb-10
- `Index.tsx`: space-y-2 para space-y-4

### 4. Melhorar visibilidade das setas

Tornar as setas sempre visiveis (nao apenas no hover) e maiores, como no ReelShort onde a seta direita fica semi-transparente sobre o ultimo card.

- Remover `opacity-0 group-hover/carousel:opacity-100` das setas
- Aumentar tamanho dos botoes (p-2 para p-3, icone h-5 w-5 para h-6 w-6)

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/HorizontalCarousel.tsx` | Ajustar gap, titulo, setas, adicionar "Ver tudo" |
| `src/components/SeriesCard.tsx` | Remover badge de categoria |
| `src/pages/Index.tsx` | Ajustar espacamento entre secoes |

## Nota Importante

Para o carrossel funcionar visualmente como o ReelShort (7 cards preenchendo toda a largura com seta de navegacao), e necessario ter **8 ou mais series por categoria**. Com apenas 3 series, os cards ficam corretamente dimensionados mas nao preenchem a linha toda - isso e comportamento esperado e identico ao que aconteceria no proprio ReelShort com poucos itens.

