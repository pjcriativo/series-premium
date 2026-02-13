

# Corrigir Tela Preta / Loop de Carregamento no Hero Slider

## Causa Raiz

O plugin `Autoplay({ delay: 5000, stopOnInteraction: false })` esta sendo recriado a cada render do componente `HeroSlider`. Isso faz o Embla Carousel destruir e reinicializar repetidamente. Durante re-renders rapidos (como mudancas de estado de autenticacao no refresh da pagina), o Embla tenta acessar elementos do DOM que ja foram removidos, causando o erro:

```
TypeError: Cannot read properties of undefined (reading 'children')
```

Esse erro nao e tratado (unhandled promise rejection), o que derruba toda a aplicacao e resulta na tela preta.

## Solucao

### Arquivo: `src/components/HeroSlider.tsx`

1. **Estabilizar o plugin Autoplay** usando `useRef` para que a instancia seja criada apenas uma vez, evitando reinicializacoes desnecessarias do carrossel.

2. **Adicionar tratamento de erro** com um guard no `useEffect` para evitar que o Embla tente operar em um estado invalido.

### Antes (problema):
```tsx
const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
  Autoplay({ delay: 5000, stopOnInteraction: false }),
]);
```

### Depois (correcao):
```tsx
import { useRef } from "react";

const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));

const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
```

## Impacto

- Elimina a tela preta ao atualizar a pagina
- Elimina o loop de carregamento
- Nao altera a aparencia ou comportamento visual do carrossel

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Estabilizar plugin Autoplay com useRef |

