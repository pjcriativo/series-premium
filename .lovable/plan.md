

# Centralizar a Navbar e Reverter o Slider

## Problema
A alteracao anterior modificou o HeroSlider incorretamente. O slider deve voltar ao estado original (com padding e rounded corners), e o ajuste deve ser feito apenas na Navbar, centralizando-a.

## Alteracoes

### 1. HeroSlider.tsx - Reverter ao estado original
Restaurar as classes removidas:
- `px-4 md:px-8 pt-4` no container externo
- `max-w-7xl mx-auto` e `rounded-lg` na section

### 2. Navbar.tsx - Centralizar o conteudo
Atualmente a navbar usa `justify-between` com conteudo colado nas bordas. Para centralizar:
- Adicionar `max-w-7xl mx-auto` ao container interno da navbar para alinhar com o slider
- Manter `justify-between` dentro desse container centralizado

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | Reverter: adicionar de volta padding, max-width e rounded corners |
| `src/components/Navbar.tsx` | Adicionar max-w-7xl mx-auto para centralizar o conteudo |

