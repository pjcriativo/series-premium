
# Barra de Progresso Visual no "Continue Assistindo" (Home e Perfil)

## Diagnóstico

### Home (`src/pages/Index.tsx`)
- A query `continueWatching` seleciona `last_episode_number` mas **não** `last_position_seconds` do `user_progress`
- A query de episódios seleciona `id, series_id, episode_number` mas **não** `duration_seconds`
- Não há dados suficientes para calcular o percentual

### Profile (`src/pages/Profile.tsx`)
- A query `progressList` já busca `last_position_seconds` ✓
- A query `continueEpisodes` seleciona `id, title, episode_number, series_id` mas **não** `duration_seconds`
- Os dados de progresso existem mas não chegam aos cards

## Estratégia

O percentual assistido é calculado como:

```
percentual = (last_position_seconds / duration_seconds) * 100
```

Limitado entre 0% e 100%. Se `duration_seconds` for nulo ou 0, a barra não é exibida.

## Alterações por arquivo

### 1. `src/pages/Index.tsx`

**Na query `continueWatching`:**
- Adicionar `last_position_seconds` no select do `user_progress`
- Adicionar `duration_seconds` no select dos episódios
- Incluir `last_position_seconds` e `duration_seconds` no objeto retornado por item

**No JSX dos cards:**
- Calcular `progressPct = Math.min(100, Math.round((item.last_position_seconds / item.duration_seconds) * 100))`
- Abaixo do `div` do card (após fechar o `relative aspect-[2/3]`), antes do `<h3>`, adicionar uma barra fina de progresso:

```text
┌─────────────────────────────┐
│  [CAPA DO EPISÓDIO]         │  ← div aspect-[2/3] existente
│  [▶ overlay Play]           │
│  [Ep. 3]                    │
└─────────────────────────────┘
████████░░░░░░░░░░░░░░░░░░░░   ← barra de progresso NOVA (h-1, rounded)
Nome da Série                  ← h3 existente
```

A barra fica **fora e abaixo** do div da capa, acima do título, com altura de `h-1` (`4px`), bordas arredondadas, cor primária no preenchimento e fundo em `bg-muted`.

### 2. `src/pages/Profile.tsx`

**Na query `continueEpisodes`:**
- Adicionar `duration_seconds` no select

**Criar um mapa de progresso** a partir do `progressList` existente:
```typescript
const progressMap = new Map(
  progressList?.map((p) => [p.series_id, p.last_position_seconds]) ?? []
);
```

**No JSX dos cards da seção "Continuar Assistindo":**
- Calcular `progressPct` usando `progressMap.get(ep.series_id)` e `ep.duration_seconds`
- Adicionar a mesma barra de progresso abaixo do div da capa, acima do título

## Componente da barra

Sem criar novo componente — inline simples reutilizável em ambas as páginas:

```tsx
{progressPct > 0 && (
  <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1 mb-1">
    <div
      className="h-full bg-primary rounded-full transition-all"
      style={{ width: `${progressPct}%` }}
    />
  </div>
)}
```

## Arquivos alterados

| Arquivo | Mudanças |
|---|---|
| `src/pages/Index.tsx` | +`last_position_seconds` no select do `user_progress`; +`duration_seconds` no select dos episódios; barra de progresso no JSX dos cards |
| `src/pages/Profile.tsx` | +`duration_seconds` no select de `continueEpisodes`; mapa de progresso; barra de progresso no JSX dos cards |

## O que NÃO será alterado
- Nenhuma migração de banco de dados
- Nenhuma Edge Function
- Nenhum componente externo
- A lógica de navegação dos cards permanece idêntica
