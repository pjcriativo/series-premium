

# Ajustar Gradientes do Hero Slider

## Problema Atual

Os gradientes superior e inferior tem a mesma altura (`h-20 md:h-32`) e intensidade. No site original do ReelShort, o fade inferior e mais pronunciado (para fundir suavemente com o conteudo abaixo) e o fade superior e mais sutil.

## Alteracoes Propostas

### `src/components/HeroSlider.tsx`

| Gradiente | Atual | Novo |
|-----------|-------|------|
| Superior | `h-20 md:h-32` | `h-16 md:h-24` (menor, mais sutil) |
| Inferior | `h-20 md:h-32` | `h-28 md:h-44` (maior, mais intenso) |
| Inferior intensidade | `from-background to-transparent` | `from-background via-background/60 to-transparent` (fade mais forte) |
| Laterais | sem alteracao | sem alteracao |

## Detalhes Tecnicos

Linha 88 - Fade superior: reduzir altura para `h-16 md:h-24`

Linha 90 - Fade inferior: aumentar altura para `h-28 md:h-44` e adicionar `via-background/60` para intensificar a transicao, criando o efeito de "dissolucao" mais fiel ao original.

