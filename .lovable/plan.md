
# Implementar Contadores Reais de Likes e Favoritos

## Situacao Atual
Os contadores de likes (4.5k) e favoritos/stars (106.5k) sao valores fixos no codigo. Para torna-los funcionais, precisamos criar tabelas no banco de dados e logica de interacao.

## Novas Tabelas no Supabase

### 1. `episode_likes`
Armazena os likes dos usuarios em episodios.

| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| episode_id | uuid | NOT NULL, FK episodes(id) |
| created_at | timestamptz | default now() |
| UNIQUE(user_id, episode_id) | | Evita likes duplicados |

RLS: usuarios podem SELECT/INSERT/DELETE os proprios likes.

### 2. `episode_favorites`
Armazena os favoritos (star) dos usuarios em episodios.

| Coluna | Tipo | Detalhes |
|--------|------|----------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| episode_id | uuid | NOT NULL, FK episodes(id) |
| created_at | timestamptz | default now() |
| UNIQUE(user_id, episode_id) | | Evita duplicados |

RLS: usuarios podem SELECT/INSERT/DELETE os proprios favoritos.

## Views para Contagem

Criar views ou fazer contagem direta via queries:
- Contar likes por episodio: `SELECT count(*) FROM episode_likes WHERE episode_id = ?`
- Contar favoritos por episodio: `SELECT count(*) FROM episode_favorites WHERE episode_id = ?`

## Alteracoes no Codigo

### 1. `src/hooks/useEpisodePlayer.ts`
Adicionar queries para:
- Contagem total de likes do episodio atual
- Contagem total de favoritos do episodio atual
- Se o usuario atual ja deu like
- Se o usuario atual ja favoritou

Adicionar funcoes de toggle:
- `toggleLike()`: insere ou remove like
- `toggleFavorite()`: insere ou remove favorito

### 2. `src/pages/EpisodePlayer.tsx`
- Substituir valores fixos (4.5k, 106.5k) pelos valores reais das queries
- Adicionar estado visual ativo (icone preenchido) quando usuario ja interagiu
- Adicionar logica de clique nos botoes (redirecionar para login se nao autenticado)
- Formatar numeros grandes (ex: 1234 -> 1.2k)

### 3. Botao Share
Implementar compartilhamento usando a Web Share API (navigator.share) com fallback para copiar URL.

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Criar tabelas episode_likes e episode_favorites com RLS |
| `src/hooks/useEpisodePlayer.ts` | Queries de contagem + toggleLike/toggleFavorite |
| `src/pages/EpisodePlayer.tsx` | Conectar botoes aos dados reais + estados visuais |

## Detalhes Tecnicos

### Migracao SQL
```sql
CREATE TABLE episode_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE episode_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count likes" ON episode_likes
  FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own likes" ON episode_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own likes" ON episode_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE episode_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, episode_id)
);

ALTER TABLE episode_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can count favorites" ON episode_favorites
  FOR SELECT USING (true);
CREATE POLICY "Auth users can insert own favorites" ON episode_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users can delete own favorites" ON episode_favorites
  FOR DELETE USING (auth.uid() = user_id);
```

### Formatacao de Numeros
```typescript
const formatCount = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
};
```

### Toggle Like/Favorite
Ao clicar, verificar se usuario esta logado. Se nao, redirecionar para /auth. Se sim, verificar se ja existe o registro e inserir/remover conforme necessario, invalidando as queries de contagem.
