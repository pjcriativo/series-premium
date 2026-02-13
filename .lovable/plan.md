

# Corrigir Tela Preta Definitivamente

## Diagnostico

A tela preta ocorre de forma intermitente, especialmente ao recarregar a pagina estando logado. O Embla Carousel pode crashar durante re-renders rapidos (mudancas de estado de autenticacao), e como nao ha um Error Boundary, o erro derruba toda a arvore React, resultando na tela preta.

Alem disso, os componentes `HeroSlider`, `CategoryRow` e `SeriesCard` geram warnings no console porque recebem refs sem suporta-los (necessario `forwardRef`).

## Solucao em 3 Partes

### 1. Criar um ErrorBoundary generico

Novo arquivo: `src/components/ErrorBoundary.tsx`

Um componente de classe React que captura erros em seus filhos e renderiza um fallback em vez de derrubar a pagina inteira. Quando o HeroSlider crashar, apenas ele some - o resto da pagina continua funcionando.

### 2. Proteger o HeroSlider com ErrorBoundary no Index

No `src/pages/Index.tsx`, envolver o `<HeroSlider>` com o ErrorBoundary para que qualquer crash do Embla Carousel seja contido e nao afete o restante da pagina.

```
Antes:
  {banners && banners.length > 0 && <HeroSlider banners={banners} />}

Depois:
  {banners && banners.length > 0 && (
    <ErrorBoundary>
      <HeroSlider banners={banners} />
    </ErrorBoundary>
  )}
```

### 3. Adicionar forwardRef nos componentes que recebem refs

Atualizar `HeroSlider`, `CategoryRow` e `SeriesCard` para usar `React.forwardRef`. Isso elimina os warnings e previne potenciais problemas com o sistema de refs do React.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/ErrorBoundary.tsx` | Criar (novo) |
| `src/pages/Index.tsx` | Envolver HeroSlider com ErrorBoundary |
| `src/components/HeroSlider.tsx` | Adicionar forwardRef |
| `src/components/CategoryRow.tsx` | Adicionar forwardRef |
| `src/components/SeriesCard.tsx` | Adicionar forwardRef |

## Resultado Esperado

- A tela preta nao acontece mais, mesmo se o Embla crashar
- Os warnings de refs no console sao eliminados
- O carrossel se recupera automaticamente em caso de erro

