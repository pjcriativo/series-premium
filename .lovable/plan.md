
# Atualização Automática de `total_episodes` ao Salvar Episódio

## Contexto

O campo `total_episodes` na tabela `series` representa quantos episódios a série possui. Atualmente ele é um campo manual no formulário de série — o admin precisa atualizar esse número manualmente toda vez que adiciona ou edita um episódio. Isso é propenso a erro e inconsistência.

## Objetivo

Após salvar (criar ou editar) um episódio com sucesso em `EpisodeForm.tsx`, buscar automaticamente no banco qual é o **maior `episode_number`** cadastrado para aquela série e atualizar o campo `total_episodes` da série com esse valor.

## Por Que o Maior `episode_number`?

Essa é a lógica já documentada na arquitetura do projeto (`business-logic/series-automation`): o `total_episodes` deve refletir o maior número de episódio cadastrado, não a contagem de linhas. Isso garante consistência mesmo se episódios forem deletados ou tiverem números não sequenciais.

**Exemplo:**
- Série tem episódios: #1, #2, #3, #5 → `total_episodes = 5`
- Se o admin cadastrar o episódio #6 → `total_episodes` vira `6` automaticamente

## Fluxo da Atualização

```text
Admin clica "Salvar" no EpisodeForm
         ↓
1. Verifica duplicata de episode_number
         ↓
2. Faz upload do vídeo (se houver)
         ↓
3. Salva/atualiza o episódio no banco
         ↓
4. [NOVO] Busca MAX(episode_number) para form.series_id
         ↓
5. [NOVO] Atualiza series.total_episodes com o valor encontrado
         ↓
6. Invalida queries e navega para /admin/episodes
```

## Mudança Técnica

### Arquivo: `src/pages/admin/EpisodeForm.tsx`

Dentro do `handleSubmit`, após o `insert` ou `update` do episódio ter sucesso (linha 151), adicionar dois passos antes do `invalidateQueries`:

```typescript
// 1. Buscar o maior episode_number da série
const { data: maxEpData } = await supabase
  .from("episodes")
  .select("episode_number")
  .eq("series_id", form.series_id)
  .order("episode_number", { ascending: false })
  .limit(1)
  .maybeSingle();

// 2. Atualizar total_episodes da série
if (maxEpData) {
  await supabase
    .from("series")
    .update({ total_episodes: maxEpData.episode_number })
    .eq("id", form.series_id);
}
```

Após isso, invalidar também a query de séries para que o gerenciador de séries reflita o novo total:

```typescript
queryClient.invalidateQueries({ queryKey: ["admin-episodes"] });
queryClient.invalidateQueries({ queryKey: ["admin-series"] });        // ← NOVO
queryClient.invalidateQueries({ queryKey: ["admin-series-list"] });   // ← NOVO
```

## Impacto

| Situação | Comportamento |
|---|---|
| Admin cria episódio #7 em série com total=5 | `total_episodes` vira 7 automaticamente |
| Admin edita episódio #3 (sem mudar o número) | `total_episodes` permanece correto (rebusca o max) |
| Admin edita episódio e muda de #7 para #8 | `total_episodes` vira 8 automaticamente |
| Série ainda sem episódios | Nenhuma atualização (guard com `if (maxEpData)`) |

## Arquivos Alterados

Apenas **`src/pages/admin/EpisodeForm.tsx`**:
- Adicionar 2 chamadas ao Supabase após salvar o episódio (busca do max e update da série)
- Adicionar invalidação das queries `admin-series` e `admin-series-list`

Nenhuma alteração de banco de dados necessária — o campo `total_episodes` já existe na tabela `series` e admins têm permissão de UPDATE.
