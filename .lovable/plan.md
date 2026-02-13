
# Alinhar Navbar com o Topo do Slider (Estilo ReelShort)

## Problema Atual
- O HeroSlider tem padding (`px-4 md:px-8 pt-4`), `max-w-7xl`, e `rounded-lg`, criando um layout de "card" com espaco ao redor
- Isso faz a navbar parecer desalinhada/torta em relacao ao slider
- No site original, o slider e full-width (borda a borda) e a navbar fica sobreposta diretamente sobre ele

## Alteracoes

### 1. HeroSlider.tsx - Remover padding e bordas arredondadas
- Remover `px-4 md:px-8 pt-4` do container externo
- Remover `max-w-7xl mx-auto` e `rounded-lg` da section
- O slider deve ocupar 100% da largura, sem bordas arredondadas, permitindo que a navbar fique sobreposta naturalmente

### 2. Index.tsx - Sem padding-top extra
- Garantir que o `<main>` nao tenha padding-top que empurre o slider para baixo da navbar
- O slider deve comecar no topo absoluto da pagina, atras da navbar transparente

## Resultado Esperado
- O slider ocupa toda a largura da tela, do topo ao limite inferior da imagem
- A navbar (ja `fixed top-0` com `bg-transparent`) fica sobreposta sobre o slider
- O gradiente superior do slider cria a transicao suave para a navbar ficar legivel

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/HeroSlider.tsx` | Remover padding, max-width e rounded corners do container |
