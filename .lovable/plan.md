

# Remover ProtectedRoute da Rota /watch

## Alteracao

Tornar a rota `/watch/:episodeId` publica, removendo o wrapper `ProtectedRoute`. Isso permite que qualquer visitante acesse a pagina do player (assim como no ReelShort), enquanto o bloqueio de conteudo pago continua sendo tratado pela logica de paywall ja existente.

## Arquivo Afetado

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Remover `<ProtectedRoute>` ao redor de `<EpisodePlayer />` na rota `/watch/:episodeId` |

## Detalhe Tecnico

Linha ~55 de `App.tsx`:

```
// Antes
<Route path="/watch/:episodeId" element={
  <ProtectedRoute><EpisodePlayer /></ProtectedRoute>
} />

// Depois
<Route path="/watch/:episodeId" element={<EpisodePlayer />} />
```

A logica de acesso ao conteudo pago (paywall modal, verificacao de desbloqueio) ja esta implementada dentro do `useEpisodePlayer` e do `PaywallModal`, entao nao ha risco de expor conteudo premium.

