
# Corrigir Hero Slider para Padrao ReelShort

## Resumo

Redesenhar o Hero Slider da Home para seguir o padrao visual do ReelShort: container centralizado com largura maxima, bordas arredondadas, aspect ratio 16:7, gradient da esquerda para direita, botao Play estilo ReelShort, e setas de navegacao laterais.

## Mudancas

### 1. HeroSlider.tsx - Redesign completo

- **Container**: Envolver o slider em `px-4 flex justify-center` com inner `max-w-7xl`
- **Slide**: Trocar aspect ratio para `aspect-[16/7] md:aspect-[16/6]`, adicionar `rounded-xl overflow-hidden shadow-2xl`
- **Imagem**: Adicionar `loading="lazy"` para performance
- **Gradient**: Trocar para `bg-gradient-to-r from-black/80 via-black/40 to-transparent` (esquerda para direita, como na referencia)
- **Conteudo**: Alinhar a esquerda com padding generoso (`p-6 md:p-14`), titulo grande (`text-3xl md:text-5xl font-bold text-white`), subtitulo abaixo
- **Botao Play**: Estilo ReelShort - botao branco com texto preto, icone Play, bordas arredondadas, largura generosa (`px-8 py-3 bg-white text-black rounded-md font-semibold`)
- **Setas de navegacao**: Adicionar botoes prev/next nas laterais (circulos semi-transparentes com icones ChevronLeft/ChevronRight), visiveis no hover ou sempre no desktop
- **Dots**: Reposicionar para canto inferior direito do slider, estilo similar ao ReelShort

### 2. Index.tsx - Ajustar container

- Remover qualquer wrapper full-width do HeroSlider (o proprio componente cuidara do layout)
- Manter a estrutura atual, o HeroSlider ja se auto-contém

## Detalhes Tecnicos

### HeroSlider.tsx

```
Estrutura do JSX:

<div className="w-full flex justify-center px-4 md:px-6">
  <div className="w-full max-w-7xl">
    <section className="relative rounded-xl overflow-hidden shadow-2xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map(banner => (
            <div className="flex-[0_0_100%] min-w-0 relative aspect-[16/7] md:aspect-[16/6]">
              <img loading="lazy" ... className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-14">
                <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg">...</h2>
                {subtitle}
                <button className="mt-4 px-8 py-3 bg-white text-black rounded-md font-semibold inline-flex items-center gap-2 w-fit hover:bg-gray-200 transition">
                  <Play /> Play
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Setas prev/next */}
      <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-3">
        <ChevronLeft />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-3">
        <ChevronRight />
      </button>
      
      {/* Dots no canto inferior direito */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">...</div>
    </section>
  </div>
</div>
```

Importacoes adicionais: `ChevronLeft`, `ChevronRight` do lucide-react

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Redesign completo do layout e visual |
| `src/pages/Index.tsx` | Ajuste menor no skeleton loading para novo aspect ratio |
