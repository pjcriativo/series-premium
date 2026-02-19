
# Diagnóstico e Correção — Filtro e Busca no Gerenciador de Episódios

## Causa Raiz Identificada

Existem dois problemas distintos:

### Problema 1: Campo de busca não filtra por nome da série

No `EpisodeManager.tsx`, a linha de filtro é:

```typescript
const filtered = (episodes ?? []).filter(ep =>
  ep.title.toLowerCase().includes(search.toLowerCase())
);
```

Ela compara o texto digitado **apenas** com `ep.title` (título do episódio). Quando o admin digita "O Livro de Enoque", está pesquisando pelo nome da **série**, mas o código só procura no título do **episódio** — por isso não encontra nada.

### Problema 2: A série "O Livro de Enoque" não tem episódios cadastrados

Confirmado diretamente no banco: a série existe (`id: 1b4a4899...`), mas não tem nenhum episódio vinculado. Isso é esperado — a série foi cadastrada mas os episódios ainda não foram adicionados. O problema é que não há feedback claro informando isso ao admin.

### Problema 3: UX confusa — dois filtros sem diferenciação clara

Existe um campo de busca por texto E um select de série. Não está claro para o usuário que:
- O campo de texto filtra por **título de episódio**
- O select filtra pela **série**

---

## Correções Planejadas

### 1. Ampliar o filtro de texto para incluir o nome da série

Atualizar a linha de filtragem em `EpisodeManager.tsx` para também buscar no título da série vinculada ao episódio:

```typescript
const filtered = (episodes ?? []).filter(ep =>
  ep.title.toLowerCase().includes(search.toLowerCase()) ||
  (ep.series?.title ?? "").toLowerCase().includes(search.toLowerCase())
);
```

Isso permite que o admin digite "Livro de Enoque" e veja todos os episódios daquela série.

### 2. Melhorar placeholder do campo de busca

Alterar o placeholder de "Buscar episódios..." para "Buscar por título ou série..." para deixar claro o que o campo aceita.

### 3. Resetar página ao mudar a série selecionada no Select

Atualmente `useEffect(() => setPage(0), [search])` só reseta quando o texto muda. Quando o usuário muda o Select de série, a página não é resetada — pode gerar "página 3 de 1" em casos de troca. Adicionar `selectedSeries` na dependência do effect:

```typescript
useEffect(() => setPage(0), [search, selectedSeries]);
```

### 4. Indicação clara quando série selecionada não tem episódios

Quando `selectedSeries !== "all"` e a lista retorna vazia, mostrar uma mensagem mais útil:

```
"Esta série ainda não tem episódios. Clique em '+ Novo Episódio' para adicionar."
```

---

## Arquivo Alterado

Apenas `src/pages/admin/EpisodeManager.tsx`:
- Filtro de texto ampliado para incluir `ep.series?.title`
- Placeholder do campo de busca atualizado
- `useEffect` de reset de página inclui `selectedSeries`
- Mensagem de lista vazia contextual quando série selecionada não tem episódios

Nenhuma alteração de banco de dados necessária.
