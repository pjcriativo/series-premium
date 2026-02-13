

# Replicar Layout Exato do ReelShort no Player

## Diferencas Identificadas

Comparando as capturas de tela do site original com nossa implementacao atual:

1. **Video e VERTICAL (9:16)**, nao landscape (16:9) - o video ocupa quase toda a altura da viewport em formato retrato
2. **Proporcoes do layout** - Video centralizado horizontalmente, painel de info a direita com largura menor
3. **Acoes (Heart, Star, Share)** - Exibidos em coluna vertical com contadores abaixo de cada icone, nao em linha horizontal
4. **Secao "Plot of Episode X"** - Titulo separado antes da sinopse
5. **Tags de categoria** - Multiplas tags com borda (nao apenas uma badge)
6. **Grid de episodios** - 6 colunas, icones de lock em vermelho pequeno no canto superior direito, episodio atual com fundo roxo/primary

## Alteracoes Detalhadas

### 1. Video Vertical (9:16) em vez de Landscape

Trocar `aspect-video` (16:9) por um container vertical com aspect ratio 9:16. O video deve ocupar a maior parte da altura da viewport, centralizado na coluna esquerda.

```
// Antes
<div className="relative aspect-video bg-black rounded-lg overflow-hidden">

// Depois  
<div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: 'calc(100vh - 5rem)' }}>
```

### 2. Ajustar Proporcoes das Colunas

O video vertical e mais estreito, entao a coluna esquerda pode ser ~55% e a direita ~45%. A coluna direita deve alinhar ao topo do video.

### 3. Reorganizar Painel de Informacoes

Seguir a ordem exata do ReelShort:
1. Breadcrumb (Home > Serie > Episodio X)
2. Titulo grande: "Episodio X -- [titulo]"
3. Nome da serie em texto menor
4. Sinopse da serie
5. Badge de categoria com borda
6. Icones de acao (Heart, Star, Share) em LINHA com labels/contadores
7. Titulo "Episodios"
8. Grid numerico 6 colunas

### 4. Icones de Acao com Contadores

Trocar os botoes pequenos por icones maiores dispostos em uma linha com texto embaixo:

```
[Heart]    [Star]     [Share]
  4.5k     106.5k     Share
```

### 5. Grid de Episodios Refinado

- 6 colunas
- Botoes com bordas mais definidas (`border border-border`)
- Episodio atual com fundo primary (roxo)
- Lock icons menores e vermelhos no canto superior direito

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/EpisodePlayer.tsx` | Redesenho completo: video vertical 9:16, painel lateral reorganizado, icones com contadores, grid refinado |

## Detalhes Tecnicos

### Estrutura Final do Layout

```
<main className="pt-16 px-4 lg:px-8 pb-20 md:pb-8">
  <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto lg:items-start">
    
    <!-- Video Column (~55%) -->
    <div className="lg:w-[55%] flex justify-center lg:justify-end">
      <div style={{ aspectRatio: '9/16', maxHeight: 'calc(100vh - 5rem)' }}
           className="w-full max-w-md bg-black rounded-lg overflow-hidden relative">
        <!-- video/iframe/placeholder -->
      </div>
    </div>
    
    <!-- Info Column (~45%) -->
    <div className="lg:w-[45%] space-y-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
      <!-- breadcrumb -->
      <!-- titulo + serie -->
      <!-- sinopse -->
      <!-- badge categoria -->
      <!-- acoes com contadores -->
      <!-- grid episodios -->
    </div>
    
  </div>
</main>
```

### YouTube Embed Vertical
Para iframes do YouTube, ajustar para preencher o container vertical mantendo o aspect ratio do video.

### Mobile
No mobile, o video fica em cima (largura total, aspect 9:16 com altura limitada) e o painel de info fica embaixo com scroll natural da pagina.

