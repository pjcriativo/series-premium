

# Corrigir Largura dos Cards no Carrossel

## Causa Raiz

Os cards do carrossel aparecem minusculos porque as classes CSS `calc()` dentro do Tailwind estao com sintaxe invalida. O CSS exige espacos ao redor dos operadores `+` e `-` dentro de `calc()`. No Tailwind, espacos em valores arbitrarios devem ser escritos como underscores (`_`).

**Classe atual (invalida):**
```
w-[calc((100%-0.75rem)/2)]
```

**Classe correta:**
```
w-[calc((100%_-_0.75rem)/2)]
```

## Alteracoes

### 1. Corrigir `CategoryRow.tsx` (linha 25)

Substituir:
```
w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-4.5rem)/7)]
```

Por:
```
w-[calc((100%_-_0.75rem)/2)] md:w-[calc((100%_-_2.25rem)/4)] lg:w-[calc((100%_-_4.5rem)/7)]
```

### 2. Corrigir `Index.tsx` - secao "Continue Assistindo" (linha 106)

Mesma correcao de underscores nas classes `calc()`.

## Arquivos Afetados

| Arquivo | Linha | Acao |
|---------|-------|------|
| `src/components/CategoryRow.tsx` | 25 | Corrigir underscores no calc |
| `src/pages/Index.tsx` | 106 | Corrigir underscores no calc |

## Resultado Esperado

- Mobile: 2 cards visiveis por linha
- Tablet: 4 cards visiveis
- Desktop: 7 cards visiveis
- Setas de navegacao aparecem quando ha mais cards do que o visivel
