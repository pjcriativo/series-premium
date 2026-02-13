

# Adicionar URL do YouTube nos Episodios (Formato Reels)

## Resumo

Adicionar a opcao de inserir uma URL do YouTube ao cadastrar/editar episodios, mantendo o upload de video .mp4 existente. O video do YouTube sera exibido no player em formato vertical (reels - 9:16).

## Alteracoes

### 1. Migracao de Banco de Dados

Adicionar coluna `youtube_url` (text, nullable) na tabela `episodes`.

```sql
ALTER TABLE episodes ADD COLUMN youtube_url text;
```

### 2. Formulario de Episodio (`src/pages/admin/EpisodeForm.tsx`)

- Adicionar `youtube_url` ao `FormData` e ao estado inicial
- Adicionar campo de input de texto para a URL do YouTube, acima do campo de upload de video
- Incluir uma nota explicando que o admin pode usar uma das duas opcoes (YouTube OU upload)
- Carregar o valor existente ao editar
- Incluir no payload de salvamento
- Se o admin preencher a URL do YouTube, ela tem prioridade; o upload continua disponivel como alternativa

### 3. Hook do Player (`src/hooks/useEpisodePlayer.ts`)

- Adicionar logica para detectar se o episodio possui `youtube_url`
- Criar funcao utilitaria para extrair o ID do video do YouTube a partir da URL
- Expor `youtubeId` no retorno do hook
- Pular a busca de signed URL do storage quando houver YouTube URL

### 4. Player de Episodio (`src/pages/EpisodePlayer.tsx`)

- Quando `youtubeId` existir, renderizar um iframe do YouTube em vez do elemento `<video>`
- O iframe sera exibido em formato vertical (reels - aspect ratio 9:16)
- Ocultar os controles customizados (play/pause/seek) quando for YouTube, pois o iframe do YouTube tem seus proprios controles
- Manter os controles customizados apenas para videos .mp4 do storage

### Logica de prioridade no player

```text
Se youtube_url existe -> renderiza iframe do YouTube (vertical/reels)
Senao se video_url existe -> renderiza <video> com signed URL (comportamento atual)
Senao -> mostra placeholder "Video nao disponivel"
```

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar coluna `youtube_url` na tabela `episodes` |
| `src/pages/admin/EpisodeForm.tsx` | Adicionar campo de URL do YouTube |
| `src/hooks/useEpisodePlayer.ts` | Detectar e extrair ID do YouTube |
| `src/pages/EpisodePlayer.tsx` | Renderizar iframe do YouTube em formato reels |

## Detalhes Tecnicos

- A URL do YouTube sera parseada para extrair o video ID (suporta formatos youtube.com/watch?v=X, youtu.be/X, youtube.com/shorts/X)
- O iframe usara `https://www.youtube.com/embed/{videoId}` com parametros para autoplay e modo vertical
- O container do iframe tera aspect-ratio 9:16 (formato reels) com max-height 100vh
- Os controles nativos do YouTube (play, pause, volume, fullscreen) serao usados no lugar dos controles customizados

