
# Bloqueio de Episódio com Saldo Insuficiente — Análise e Plano

## O que já existe (não será refeito)

O sistema já tem uma arquitetura robusta e funcional:

- `src/lib/unlockService.ts` — `canAccessEpisode()` e `unlockEpisode()` com toda a lógica de acesso
- Edge Function `unlock-episode` — valida saldo, debita carteira, cria unlock no banco com segurança total (nenhum bypass possível pelo frontend)
- `useEpisodePlayer.ts` — access check via queries Supabase, `hasAccess` boolean, `showPaywall` state, `walletBalance`
- `PaywallModal` — modal completo com unlock de episódio, unlock de série e recarga de moedas
- Tabelas `wallets`, `episodes` (com `price_coins`, `is_free`), `episode_unlocks`, `series_unlocks` — todas existentes com RLS

## Gaps reais identificados

### Gap 1 — Redirect silencioso em vez de modal contextual
Quando `hasAccess === false`, o hook atual faz:
```ts
navigate(`/series/${seriesId}`, { replace: true });
```
O usuário é expulso da página `/watch/:id` sem ver nenhuma tela de bloqueio. A request pede que o player **não seja carregado** e um modal/tela de bloqueio seja mostrado na própria página.

### Gap 2 — Usuário não logado acessa `/watch/:id` sem proteção
A rota `/watch/:episodeId` em `App.tsx` **não usa `<ProtectedRoute>`**. Para episódios pagos, um usuário não autenticado chega na página, o access check retorna `false`, e o redirect vai para `/series/:id` (não para `/auth`).

### Gap 3 — Saldo insuficiente vs. conteúdo desbloqueado — mensagem idêntica
Atualmente não há distinção visual entre "você não desbloqueou este episódio" e "você não tem créditos". Ambos redirectam igual. O pedido quer uma tela dedicada para o caso de saldo zero.

### Gap 4 — Badge de saldo zero no perfil
Quando `balance === 0`, não há nenhuma indicação visual no header/perfil. O pedido pede um badge de alerta.

### Gap 5 — Regra de negócio: `price_coins <= balance` dá acesso imediato?
O pedido inclui a regra: _"se `price_coins <= user_wallet.balance` → pode assistir"_. Esta regra significaria que o usuário assiste sem criar um unlock record. **Isso é uma mudança semântica importante**: atualmente o sistema exige unlock explícito (débito de moedas + registro). Essa regra quebraria o histórico de compras e o sistema de monetização. O correto é **manter a regra atual** (precisa desbloquear para assistir), mas melhorar a UX mostrando o modal contextual em vez de redirecionar.

---

## O que será implementado

### 1. Tela de bloqueio in-page em `/watch/:id` (mudança principal)

Em vez de redirecionar, quando `hasAccess === false`, mostrar uma tela de bloqueio **dentro da própria página** do player, sem expulsar o usuário.

A tela terá dois estados:
- **Usuário não logado**: mensagem "Faça login para assistir" + botão → `/auth`
- **Logado sem acesso + saldo suficiente**: mostrar botão "Desbloquear por X moedas" diretamente
- **Logado sem acesso + saldo insuficiente**: modal "Créditos insuficientes" com custo e botão "Comprar Créditos" → `/wallet`

A alteração acontece em `useEpisodePlayer.ts` (remover o redirect automático) e `EpisodePlayer.tsx` (renderizar tela de bloqueio condicional no lugar do player).

### 2. Proteção da rota `/watch/:id` para não-logados em episódios pagos

O access check no hook já retorna `false` para não logados em episódios pagos. A tela de bloqueio in-page lidará com este caso mostrando CTA de login, sem necessidade de tornar a rota protegida globalmente (episódios gratuitos devem continuar acessíveis sem login).

### 3. Badge de saldo zero no `ProfileHeader`

Quando `balance === 0`, exibir um badge de alerta laranja/destructive ao lado do saldo no header do perfil (`src/components/profile/ProfileHeader.tsx`), com link rápido "Adicionar Créditos" → `/wallet`.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useEpisodePlayer.ts` | Remover o `navigate` automático quando `hasAccess === false`; exportar `walletBalance` e `episode.price_coins` |
| `src/pages/EpisodePlayer.tsx` | Adicionar tela de bloqueio condicional (em vez do redirect silencioso): mostra contexto correto para não-logado, saldo insuficiente ou apenas não desbloqueado |
| `src/components/profile/ProfileHeader.tsx` | Adicionar badge de alerta quando `balance === 0` e botão rápido "Adicionar Créditos" |

**Sem mudanças de banco de dados** — toda a estrutura já existe.  
**Sem mudanças na Edge Function** — o backend já é 100% seguro.  
**Sem mudanças no `PaywallModal`** — já funciona para o desbloqueio normal.

---

## Comportamento final por cenário

| Cenário | Comportamento atual | Comportamento novo |
|---|---|---|
| Episódio gratuito | Acessa normalmente | Igual |
| Episódio desbloqueado (com unlock) | Acessa normalmente | Igual |
| Usuário não logado + episódio pago | Redirect para `/series/:id` | Tela de bloqueio: "Faça login para assistir" |
| Logado + episódio pago + saldo suficiente | Redirect para `/series/:id` + toast "Acesso negado" | Tela de bloqueio: botão "Desbloquear por X moedas" → abre PaywallModal |
| Logado + episódio pago + saldo = 0 | Redirect para `/series/:id` + toast "Acesso negado" | Tela de bloqueio: "Créditos insuficientes" + botão "Comprar Créditos" → `/wallet` |
| Acesso direto por URL (bypass) | Redirect para `/series/:id` | Tela de bloqueio (mesma lógica) |
| Saldo = 0 no perfil | Sem indicação visual | Badge laranja de alerta no `ProfileHeader` |
