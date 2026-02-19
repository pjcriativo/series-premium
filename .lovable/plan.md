
# Tradução dos textos em inglês para português BR

## Diagnóstico completo

Após varredura em todos os arquivos `.tsx` do projeto, foram encontrados exatamente **3 textos em inglês** visíveis na interface pública. Todo o resto da aplicação já está corretamente em português BR.

### Textos a corrigir

| Arquivo | Linha | Texto atual | Tradução |
|---|---|---|---|
| `src/pages/EpisodePlayer.tsx` | 252 | `Plot of Episode {n}` | `Sinopse do Episódio {n}` |
| `src/pages/EpisodePlayer.tsx` | 277 | `Share` | `Compartilhar` |
| `src/pages/ReelsFeed.tsx` | 130 | `Share` | `Compartilhar` |

Bônus (admin — tooltip do gráfico de barras):
| Arquivo | Linha | Texto atual | Tradução |
|---|---|---|---|
| `src/pages/admin/Dashboard.tsx` | 140 | `"Views"` (tooltip do Recharts) | `"Visualizações"` |

---

## Detalhes de cada alteração

### 1. `src/pages/EpisodePlayer.tsx` — linha 252

Título da seção de sinopse no lado direito do player:

```
// Antes:
Plot of Episode {episode?.episode_number}

// Depois:
Sinopse do Episódio {episode?.episode_number}
```

### 2. `src/pages/EpisodePlayer.tsx` — linha 277

Label abaixo do botão de compartilhar no player:

```
// Antes:
<span className="text-xs">Share</span>

// Depois:
<span className="text-xs">Compartilhar</span>
```

### 3. `src/pages/ReelsFeed.tsx` — linha 130

Label abaixo do botão de compartilhar no feed de Reels:

```
// Antes:
<span className="text-white text-[10px]">Share</span>

// Depois:
<span className="text-white text-[10px]">Compartilhar</span>
```

### 4. `src/pages/admin/Dashboard.tsx` — linha 140 (bônus)

Tooltip do gráfico de barras de views por série:

```
// Antes:
<Tooltip formatter={(v: number) => [v, "Views"]} />

// Depois:
<Tooltip formatter={(v: number) => [v, "Visualizações"]} />
```

---

## Arquivos alterados

| Arquivo | Alterações |
|---|---|
| `src/pages/EpisodePlayer.tsx` | 2 textos traduzidos (título sinopse + label share) |
| `src/pages/ReelsFeed.tsx` | 1 texto traduzido (label share nos Reels) |
| `src/pages/admin/Dashboard.tsx` | 1 texto traduzido (tooltip do gráfico) |

## O que NÃO será alterado
- Nenhum texto técnico interno (props, variáveis, comentários de código)
- Nenhuma lógica de negócio
- Nenhuma configuração de banco de dados
- "G Pay", "Google Pay" e "Mercado Pago" — são nomes próprios de produtos/marcas, não devem ser traduzidos
