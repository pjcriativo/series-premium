
# Adicionar Secao "Continue Assistindo" na Home

## Resumo

Criar uma nova secao na pagina inicial que mostra as series que o usuario logado esta assistindo, com base nos dados da tabela `user_progress`. A secao aparece entre o Hero Slider e as CategoryRows, somente para usuarios autenticados com progresso salvo.

## Comportamento

- Visivel apenas para usuarios logados
- Mostra series com progresso salvo na tabela `user_progress`
- Cada card exibe a capa da serie, titulo, e indicacao do episodio atual (ex: "Ep. 3")
- Clicar no card leva para a pagina de detalhes da serie
- Se nao houver progresso, a secao nao aparece
- Layout segue o mesmo padrao horizontal scrollavel das CategoryRows

## Mudancas

### 1. Index.tsx - Adicionar secao "Continue Assistindo"

- Importar `useAuth` para verificar se o usuario esta logado
- Criar nova query `useQuery` para buscar dados de `user_progress` com join na tabela `series` para obter titulo e capa
- Renderizar a secao entre o HeroSlider e as CategoryRows, dentro do container `max-w-7xl`
- Secao so aparece se o usuario estiver logado E tiver progresso salvo

### 2. Nenhum componente novo necessario

- Reutilizar o mesmo padrao visual do `CategoryRow` inline, com cards horizontais scrollaveis
- Cada card mostra a capa da serie + titulo + "Ep. X"

## Detalhes Tecnicos

### Query de progresso

```sql
-- Logica da query via Supabase JS:
supabase
  .from("user_progress")
  .select("series_id, last_episode_number, series:series_id(id, title, cover_url)")
  .eq("user_id", user.id)
  .order("updated_at", { ascending: false })
```

### Estrutura JSX na Index.tsx

```
{user && continueWatching && continueWatching.length > 0 && (
  <div className="mt-6 w-full flex justify-center px-4 md:px-6">
    <div className="w-full max-w-7xl">
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-3 px-4">Continue Assistindo</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide">
          {continueWatching.map(item => (
            <Link to={`/series/${item.series.id}`} className="group flex-shrink-0 w-36 md:w-44 snap-start">
              {/* Capa + overlay com numero do episodio */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                <img src={item.series.cover_url} ... />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  Ep. {item.last_episode_number}
                </div>
              </div>
              <h3 className="text-sm font-medium text-foreground truncate">{item.series.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  </div>
)}
```

### Nenhuma mudanca no banco de dados

A tabela `user_progress` ja contem todos os campos necessarios (`series_id`, `last_episode_number`, `updated_at`), e as RLS policies ja permitem que usuarios vejam seu proprio progresso.

| Arquivo | Acao |
|---------|------|
| `src/pages/Index.tsx` | Adicionar query de progresso e secao "Continue Assistindo" |
