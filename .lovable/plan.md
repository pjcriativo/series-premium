

# Ajustar HeroSlider: mais largo e menos alto

## Alteracoes no arquivo `src/components/HeroSlider.tsx`

### 1. Aumentar a largura
- Linha 44: trocar `max-w-[1400px]` por `max-w-[1600px]`

### 2. Diminuir a altura (mais estreito verticalmente)
- Linha 48: trocar `aspect-[4/3] md:aspect-[2/1]` por `aspect-[3/2] md:aspect-[21/9]`

### Resultado
- **Largura**: 1600px (antes 1400px) -- slider mais largo na tela
- **Altura desktop**: proporcao 21:9 (~2.33:1) em vez de 2:1 -- slider mais baixo/estreito
- **Altura mobile**: proporcao 3:2 em vez de 4:3 -- tambem mais baixo no mobile

## Arquivo Afetado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | max-w para 1600px e aspect ratio para 3/2 mobile / 21/9 desktop |

