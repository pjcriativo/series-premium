

# Clique em episodio bloqueado: abrir PaywallModal ao inves de navegar

## Problema atual
Na grade de episodios do EpisodePlayer, clicar em um episodio bloqueado navega para `/watch/:id`, que detecta falta de acesso e redireciona de volta para `/series/:id` (pagina intermediaria). O comportamento correto e abrir o PaywallModal diretamente.

## Solucao

### Alterar EpisodePlayer.tsx

1. Adicionar estado `paywallEpisode` (similar ao SeriesDetail) para controlar qual episodio bloqueado foi clicado
2. No grid de episodios (linha 250-252), verificar se o episodio e acessivel:
   - Se acessivel: navegar para `/watch/${ep.id}` (comportamento atual)
   - Se bloqueado e usuario logado: abrir PaywallModal com dados desse episodio
   - Se bloqueado e usuario nao logado: redirecionar para `/auth`
3. Atualizar o PaywallModal para suportar tanto o `nextEpisode` quanto o episodio clicado no grid
4. Adicionar `onNavigateToWatch` no PaywallModal para navegar apos desbloqueio

### Detalhes tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/EpisodePlayer.tsx` | Adicionar estado `paywallEpisode`; alterar onClick do grid para verificar acesso; renderizar PaywallModal generico (nao apenas para nextEpisode); incluir dados de serie para opcao de desbloqueio em bundle |

### Fluxo resultante
- Clicar em episodio acessivel no grid -> navega para `/watch/:id`
- Clicar em episodio bloqueado no grid -> abre PaywallModal com preco do episodio e opcao de serie
- Apos desbloquear no modal -> navega automaticamente para `/watch/:id`

