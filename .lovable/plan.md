

# Adicionar Gradientes Superior e Inferior ao Hero Slider

## Objetivo

Adicionar efeito de fade (gradiente) na parte de cima e de baixo do slider, igual ao site original do ReelShort. Atualmente so existem gradientes laterais (esquerda e direita).

## O que sera alterado

### `src/components/HeroSlider.tsx`

Adicionar dois novos `div` com gradientes absolutos:

- **Topo**: gradiente de cima para baixo (`from-background to-transparent`) - cria a transicao suave entre a navbar e o banner
- **Base**: gradiente de baixo para cima (`from-background to-transparent`) - cria a transicao suave entre o banner e o conteudo abaixo

Ambos terao `z-10` e `pointer-events-none`, seguindo o mesmo padrao dos gradientes laterais ja existentes.

## Detalhes Tecnicos

```html
<!-- Fade superior -->
<div class="absolute top-0 inset-x-0 h-20 md:h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

<!-- Fade inferior -->
<div class="absolute bottom-0 inset-x-0 h-20 md:h-32 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
```

Serao inseridos dentro do `<section>` principal, junto aos gradientes laterais ja existentes.

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Adicionar 2 divs de gradiente (topo e base) |

