

# Adicionar Efeito de Desfoque nas Laterais do Hero Slider

## Resumo

Adicionar gradientes de desfoque (fade-to-background) nas laterais esquerda e direita do Hero Slider, criando a impressao de "tela infinita" como no ReelShort. O slider continua com `max-w-7xl` centralizado, mas as laterais externas terao um fade suave para a cor de fundo da pagina.

## Mudancas

### HeroSlider.tsx

- Adicionar dois pseudo-elementos (divs absolutas) nas laterais externas do container `max-w-7xl`, criando um gradiente que vai da cor de fundo (`bg-background`) para transparente
- Esses gradientes ficam **fora** do slider arredondado, nas areas laterais da tela
- O container pai precisa ser `relative` e ocupar a largura total da tela para que os gradientes se estendam ate as bordas

### Estrutura atualizada

```
<div className="w-full relative pt-4">
  {/* Gradiente lateral esquerdo */}
  <div className="absolute left-0 top-0 bottom-0 w-[calc((100%-80rem)/2+2rem)] bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
  
  {/* Gradiente lateral direito */}
  <div className="absolute right-0 top-0 bottom-0 w-[calc((100%-80rem)/2+2rem)] bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
  
  <div className="w-full flex justify-center px-4 md:px-6">
    <div className="w-full max-w-7xl">
      <section className="relative rounded-xl overflow-hidden shadow-2xl">
        {/* slider existente */}
      </section>
    </div>
  </div>
</div>
```

Os gradientes usam `calc((100% - 80rem)/2 + 2rem)` para cobrir exatamente a area lateral fora do container max-w-7xl (80rem = 1280px), com 2rem extras para criar a sobreposicao suave sobre as bordas do slider.

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Adicionar gradientes laterais fade-to-background |

