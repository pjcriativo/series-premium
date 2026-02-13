

# Fix: PaywallModal no EpisodePlayer precisa do seriesTotalCost

## Problema
Existem dois problemas:

1. **Vercel desatualizado**: O modal antigo ("Desbloquear Conteudo") aparece porque o site em `series-premium.vercel.app` nao foi atualizado com o codigo mais recente. O preview do Lovable ja tem o novo modal.

2. **Bug real**: O PaywallModal acionado pelo grid de episodios no EpisodePlayer nao recebe a prop `seriesTotalCost`, entao a opcao "Desbloquear serie" nunca aparece nesse contexto.

## Solucao

### Arquivo: `src/pages/EpisodePlayer.tsx`

1. Calcular o `seriesTotalCost` (custo total dos episodios pagos ainda nao desbloqueados da serie), usando os dados ja disponiveis (`allEpisodes`, `userEpisodeUnlocks`, `seriesFreeEps`, `seriesUnlocked`)
2. Passar `seriesTotalCost` para o PaywallModal do grid (linhas 300-317)
3. Tambem passar `seriesTitle` que ja esta disponivel

### Calculo do seriesTotalCost

```
const seriesTotalCost = seriesUnlocked ? 0 :
  allEpisodes
    .filter(ep => !ep.is_free && ep.episode_number > seriesFreeEps && !userEpisodeUnlocks.includes(ep.id))
    .reduce((sum, ep) => sum + ep.price_coins, 0);
```

### Props adicionadas no PaywallModal do grid

| Prop | Valor |
|------|-------|
| `seriesTotalCost` | Calculado acima |
| `seriesTitle` | Ja disponivel como `seriesTitle` |

Nenhum outro arquivo precisa ser alterado.

## Sobre o Vercel
Apos aprovar e implementar, voce precisara fazer deploy no Vercel para que as mudancas aparecam em `series-premium.vercel.app`. O preview do Lovable ja mostrara o modal correto.
