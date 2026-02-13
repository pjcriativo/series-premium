
# Redesenhar Tela do Player de Episodio (Estilo ReelShort)

## Layout Atual vs Referencia

**Atual**: Player ocupa tela inteira (fullscreen overlay) com controles sobrepostos. Sem informacoes laterais.

**ReelShort (referencia)**: Layout de duas colunas no desktop:
- **Esquerda (~60%)**: Video player com controles na parte inferior (play/pause, tempo, volume, fullscreen)
- **Direita (~40%)**: Painel de informacoes contendo:
  - Breadcrumb (Home > Serie > Episodio)
  - Titulo do episodio
  - Sinopse/Plot do episodio
  - Tags de categoria
  - Acoes (curtir, favoritar, compartilhar)
  - Grade de episodios em formato de grid numerico (1, 2, 3... com icones de lock nos pagos)

## Alteracoes

### 1. Redesenhar `EpisodePlayer.tsx` - Layout Desktop

Substituir o layout fullscreen por um layout responsivo:

- **Desktop (lg+)**: Duas colunas lado a lado dentro de uma pagina com Navbar
  - Coluna esquerda: video player com aspect-ratio adequado e controles
  - Coluna direita: painel scrollavel com info + grid de episodios
- **Mobile**: Manter layout similar ao atual (video em cima, info embaixo com scroll)

### 2. Painel Lateral Direito (novo)

Contera:
- **Breadcrumb**: Home > Nome da Serie > Episodio X
- **Titulo**: "Episodio X - [titulo]"
- **Sinopse**: Plot/descricao do episodio (campo `title` da serie ou sinopse)
- **Tags de categoria**: Badges com o nome da categoria da serie
- **Acoes**: Icones de coracao, estrela e compartilhar (decorativos por enquanto)
- **Grid de episodios**: Botoes numerados em grid (5-6 por linha), com:
  - Episodio atual destacado (borda primary)
  - Icone de lock vermelho nos episodios pagos nao desbloqueados
  - Episodios gratuitos sem icone
  - Clique navega para o episodio

### 3. Atualizar `useEpisodePlayer.ts`

Buscar dados adicionais necessarios:
- Lista completa de episodios da serie (ja existe parcialmente com `nextEpisode`)
- Categoria da serie
- Sinopse da serie

Adicionar nova query `all-episodes` para buscar todos os episodios da serie de uma vez.

### 4. Remover ProtectedRoute do Player

Atualmente o player exige login. Para manter consistencia com o ReelShort (que mostra a pagina mesmo sem login, bloqueando apenas o conteudo pago), considerar manter como esta mas exibir o layout completo.

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/EpisodePlayer.tsx` | Redesenho completo: layout 2 colunas desktop, painel lateral com info + grid |
| `src/hooks/useEpisodePlayer.ts` | Adicionar query para todos os episodios da serie e categoria |
| `src/components/Navbar.tsx` | Verificar se Navbar aparece na rota /watch (atualmente oculta) |

## Detalhes Tecnicos

### Estrutura do Layout Desktop
```
<div className="min-h-screen bg-background">
  <Navbar />
  <main className="pt-14 px-4 lg:px-8">
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Coluna Video (lg:w-3/5) -->
      <div className="lg:w-3/5">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <!-- video + controles -->
        </div>
      </div>
      <!-- Coluna Info (lg:w-2/5) -->
      <div className="lg:w-2/5 space-y-4">
        <!-- breadcrumb, titulo, sinopse, tags, acoes, grid -->
      </div>
    </div>
  </main>
</div>
```

### Grid de Episodios
Grid de 5-6 colunas com botoes quadrados numerados. Cada botao mostra o numero do episodio. Episodios pagos nao desbloqueados tem um pequeno icone de lock vermelho no canto superior direito. O episodio atual tem borda/fundo destacado em primary.

### Queries Adicionais no Hook
- `allEpisodes`: SELECT todos episodios da serie ordenados por episode_number
- `seriesDetail`: SELECT serie com categoria (para tags e sinopse)
- Reutilizar `episodeUnlocks` para marcar quais estao desbloqueados no grid
