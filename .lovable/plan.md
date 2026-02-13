

# Ajustar Tamanho do HeroSlider - Opcao A

## Alteracoes no arquivo `src/components/HeroSlider.tsx`

### 1. Aumentar a largura maxima
- Linha 44: trocar `max-w-7xl` (1280px) por `max-w-[1400px]`

### 2. Aumentar a altura
- Linha 48: trocar `aspect-[3/2] md:aspect-[16/9]` por `aspect-[4/3] md:aspect-[2/1]`

Isso resulta em um slider um pouco mais largo (1400px vs 1280px) e mais alto (proporcao 2:1 no desktop vs 16:9).

## Arquivo Afetado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | max-w-7xl para max-w-[1400px] e aspect ratio para 4/3 mobile / 2/1 desktop |

