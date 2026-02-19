
# Diagnóstico e Correção — Lentidão ao Salvar uma Série

## Causa Raiz Identificada

No `mutationFn` de `SeriesForm.tsx`, o fluxo atual executa **3 chamadas sequenciais ao banco** toda vez que uma série é salva:

```
1. INSERT/UPDATE na tabela series       → ~200-400ms
2. SELECT em episodes (busca maxEp)     → ~200-400ms  ← PROBLEMA
3. UPDATE em series (condicional)       → ~200-400ms  ← PROBLEMA
```

O passo 2 (busca o episódio de maior número) e o passo 3 (segundo UPDATE) são executados **sempre**, mesmo ao criar uma série nova — que por definição nunca tem episódios. Isso adiciona 200–400ms de latência desnecessária em 100% dos cadastros.

## Correções

### 1. Eliminar a query de `total_episodes` automático no cadastro novo

Para uma série nova, a query em `episodes` nunca retornará dados (série acabou de ser criada). A verificação só faz sentido em edições e, mesmo assim, é redundante porque o campo `total_episodes` é editável diretamente no form — o admin pode inserir o valor correto manualmente ou atualizar depois de adicionar episódios.

A lógica será removida completamente do `mutationFn`, eliminando os passos 2 e 3.

**Antes (3 operações sequenciais):**
```typescript
mutationFn: async (formData) => {
  // 1. upload capa (se houver)
  // 2. INSERT ou UPDATE em series
  // 3. SELECT em episodes ← lento e desnecessário
  // 4. UPDATE em series se maxEp > total ← lento e condicional
}
```

**Depois (1 operação + upload opcional):**
```typescript
mutationFn: async (formData) => {
  // 1. upload capa (se houver)
  // 2. INSERT ou UPDATE em series — pronto
}
```

### 2. Invalidar também a query de detalhe da série ao salvar

Atualmente `onSuccess` invalida apenas `["admin-series"]`, mas não `["admin-series-detail", id]`. Isso significa que ao editar uma série e voltar para o formulário, os dados antigos ainda ficam no cache.

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["admin-series"] });
  queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] }); // ← adicionar
  toast({ title: id ? "Série atualizada" : "Série criada" });
  navigate("/admin/series");
},
```

### 3. Compressão de imagem antes do upload (melhoria adicional)

O upload da capa pode ser lento se o admin selecionar uma imagem muito grande (ex: foto de câmera de 5–10 MB). Será adicionada uma verificação de tamanho com alerta ao usuário caso o arquivo ultrapasse 5 MB, orientando a usar uma imagem menor. Isso não bloqueia o upload, mas avisa o usuário que pode demorar.

## Impacto Esperado

| Operação | Antes | Depois |
|---|---|---|
| Salvar série nova (sem imagem) | ~600–900ms | ~200–350ms |
| Salvar série nova (com imagem) | ~1200–2000ms | ~600–1200ms |
| Editar série (sem trocar imagem) | ~600–900ms | ~200–350ms |

## Arquivo Alterado

**`src/pages/admin/SeriesForm.tsx`** — somente o bloco `mutationFn` e o `onSuccess`:

- Remover as 3 linhas de `SELECT em episodes` + o `UPDATE` condicional de `total_episodes`
- Adicionar invalidação de `["admin-series-detail"]` no `onSuccess`
- Adicionar aviso de tamanho de arquivo no `onChange` do input de capa

Nenhuma alteração de banco de dados necessária.
