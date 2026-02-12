
# Corrigir Layout do Hero Slider - Slider Centralizado com Fade Lateral

## Problema

O slider atual ocupa 100% da largura da tela. Na referencia (ReelShort), o slider e um bloco centralizado com `max-w` limitado, deixando o fundo escuro da pagina visivel nas laterais, e as bordas do slider tem um fade/desfoque que se mistura com o fundo.

## Solucao

Reestruturar o HeroSlider para que o slider fique contido dentro de um `max-w-7xl` centralizado, e os gradientes de fade fiquem nas bordas **internas** do slider, criando a transicao suave para o fundo da pagina.

### Estrutura proposta:

```
<div className="w-full px-4 md:px-8 pt-4">
  <section className="relative max-w-7xl mx-auto overflow-hidden rounded-lg">
    <!-- Embla slider (imagens dentro do container limitado) -->
    
    <!-- Fade lateral esquerdo (dentro do slider, na borda interna) -->
    <div className="absolute left-0 inset-y-0 w-20 md:w-40 lg:w-64 xl:w-80
         bg-gradient-to-r from-background via-background/50 to-transparent z-10" />
    
    <!-- Fade lateral direito -->
    <div className="absolute right-0 inset-y-0 w-20 md:w-40 lg:w-64 xl:w-80
         bg-gradient-to-l from-background via-background/50 to-transparent z-10" />
    
    <!-- Setas, dots, etc -->
  </section>
</div>
```

### Mudancas em HeroSlider.tsx:

1. Adicionar `max-w-7xl mx-auto rounded-lg` na `<section>` para conter o slider no centro
2. Adicionar padding horizontal no wrapper externo (`px-4 md:px-8`) para garantir espaco nas laterais mesmo em telas menores
3. Os gradientes de fade ja existem e ficam **dentro** da section, sobre as bordas da imagem, criando a transicao suave para o fundo escuro visivel nas laterais
4. As setas de navegacao e os dots permanecem dentro da section

O resultado: o slider fica como um "cartao" centralizado na tela, com o fundo escuro visivel nas laterais, e as bordas do slider desvanecendo suavemente.

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| `src/components/HeroSlider.tsx` | Adicionar `max-w-7xl mx-auto rounded-lg` na section, padding no wrapper |
