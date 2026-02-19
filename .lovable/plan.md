
# Remover Sombra do Topo do Slider e Corrigir Navbar Fixo

## Problema identificado

No arquivo `src/components/HeroSlider.tsx`, linha 86:

```tsx
<div className="absolute top-0 inset-x-0 h-16 md:h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
```

Esse `div` cria um gradiente escuro no topo do slider (da cor de fundo para transparente) — é exatamente a "sombra" em X que o usuário marcou na imagem. Ele foi colocado para criar uma transição suave entre o navbar e o slider, mas está criando um efeito indesejado.

## Sobre o navbar "fixo"

O Navbar já tem a classe `fixed` (`position: fixed`) aplicada:

```tsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm">
```

Ele JÁ está fixo e não deveria rolar com a página. O que pode parecer que ele "rola" é o fato da logo ter `h-[150px]` — uma altura muito grande — que faz o navbar ocupar muito espaço vertical e empurra o conteúdo para baixo, dando uma sensação estranha. Mas o `fixed` já está correto.

## Mudanças planejadas

### `src/components/HeroSlider.tsx` — Remover o gradiente do topo

Remover apenas a linha do gradiente superior (linha 86):

```tsx
// REMOVER esta linha:
<div className="absolute top-0 inset-x-0 h-16 md:h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
```

Os outros gradientes (inferior, esquerda, direita) serão mantidos pois fazem parte do design do slider.

## Arquivo modificado

| Arquivo | Alteração |
|---|---|
| `src/components/HeroSlider.tsx` | Remover div do gradiente superior (linha 86) |

## O que NÃO será alterado

- Tamanho da logo (mantém 150px)
- Gradientes laterais e inferior do slider
- Lógica de navegação do navbar
- Classes `fixed` do navbar
