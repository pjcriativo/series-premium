

# Restaurar o HeroSlider ao Estado Original

## Problema
O slider perdeu o padding externo, o max-width centralizado e as bordas arredondadas nas edicoes anteriores. Precisa voltar ao formato original de "card" centralizado.

## Alteracao

No arquivo `src/components/HeroSlider.tsx`:

- Linha 43: adicionar `px-4 md:px-8 pt-4` ao container externo (`div` com `ref`)
- Linha 44: adicionar `max-w-7xl mx-auto rounded-lg` na `section`

### De:
```
<div ref={ref} className="w-full">
  <section className="relative overflow-hidden">
```

### Para:
```
<div ref={ref} className="w-full px-4 md:px-8 pt-4">
  <section className="relative overflow-hidden max-w-7xl mx-auto rounded-lg">
```

## Arquivo Afetado

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | Restaurar padding, max-width e rounded corners |

