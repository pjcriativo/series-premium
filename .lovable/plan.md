
# Sistema de Notificações de Novos Episódios

## Contexto e análise

O projeto não tem nenhuma estrutura de notificações ou "seguir série". A funcionalidade requer dois componentes distintos:

1. **Seguir séries** — o usuário escolhe quais séries quer acompanhar
2. **Notificação em tempo real** — quando um novo episódio de uma série seguida é publicado (`is_published` muda para `true`), o usuário recebe um alerta in-app via Supabase Realtime

> Importante: "push notifications" nativas de sistema operacional (como as que aparecem mesmo com o app fechado) requerem um Service Worker e a Permission API, o que é complexo e não confiável em todos os navegadores. O que será implementado aqui é **notificação in-app via Supabase Realtime + toast** — que funciona enquanto o usuário está na plataforma — mais um indicador visual de novas notificações não lidas salvas no banco.

---

## Banco de dados — 2 novas tabelas

### 1. `series_follows` — quais séries o usuário segue
```sql
CREATE TABLE public.series_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  series_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);
```
RLS: SELECT/INSERT/DELETE apenas para o próprio usuário.

### 2. `notifications` — registro persistente de notificações
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  series_id uuid,
  episode_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
RLS: SELECT/UPDATE/DELETE apenas para o próprio usuário.

---

## Arquitetura da solução

```text
src/
├── hooks/
│   └── useNewEpisodeNotifications.ts   ← Realtime listener + geração de notifs
├── components/
│   ├── profile/
│   │   └── NotificationSettings.tsx    ← Lista de séries seguidas + toggle
│   └── NotificationBell.tsx            ← Ícone no Navbar com badge de não lidas
└── pages/
    └── Profile.tsx                     ← adicionar seção NotificationSettings
```

---

## Funcionalidades detalhadas

### 1. Seguir/Deixar de seguir séries (NotificationSettings)

- Aparece na página `/me` como nova seção: **"Alertas de Novos Episódios"**
- Lista as séries que o usuário já assistiu (reaproveitando `watchedSeries` que já existe no Profile)
- Ao lado de cada série: toggle Switch para ativar/desativar notificação
- Estado persistido na tabela `series_follows`
- Botão "Seguir" também aparece na página `/series/:id` (SeriesDetail)

### 2. Listener Realtime (useNewEpisodeNotifications)

Hook que:
1. Busca quais `series_id` o usuário segue
2. Abre canal Supabase Realtime escutando `episodes` com filtro `event = INSERT OR UPDATE`
3. Quando detecta novo episódio `is_published = true` de uma série seguida:
   - Exibe `toast.success()` com título e link "Assistir agora →"
   - Insere registro na tabela `notifications` (para histórico persistente)
4. Hook é montado globalmente em `App.tsx` para funcionar em qualquer página

### 3. Sininho de notificações (NotificationBell)

- Adicionado ao `Navbar` (desktop) e `BottomNav` (mobile)
- Ícone `Bell` com badge vermelho mostrando contagem de não lidas
- Clique abre dropdown/popover com lista das últimas 10 notificações
- Ao abrir: marca como lidas (`is_read = true`)
- Cada item da lista tem link direto para o episódio

---

## Fluxo completo

```
Admin publica episódio
       ↓
Supabase dispara evento Realtime (INSERT/UPDATE em episodes)
       ↓
useNewEpisodeNotifications recebe evento
       ↓
Verifica se series_id está em series_follows do usuário
       ↓
[SIM] → toast.success + INSERT em notifications
       ↓
NotificationBell atualiza badge (query invalidation)
       ↓
Usuário clica no sininho → vê notificação → clica → assiste
```

---

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/...` | Criar tabelas `series_follows` e `notifications` com RLS |
| `src/hooks/useNewEpisodeNotifications.ts` | NOVO — listener Realtime |
| `src/components/NotificationBell.tsx` | NOVO — sininho com badge no Navbar |
| `src/components/profile/NotificationSettings.tsx` | NOVO — seção no perfil para gerenciar series seguidas |
| `src/pages/Profile.tsx` | Adicionar seção `NotificationSettings` |
| `src/components/Navbar.tsx` | Adicionar `NotificationBell` |
| `src/components/BottomNav.tsx` | Adicionar sininho com badge |
| `src/App.tsx` | Montar `useNewEpisodeNotifications` globalmente |
| `src/pages/SeriesDetail.tsx` | Adicionar botão "Seguir" / "Seguindo" |

---

## Limitações e honestidade técnica

- Notificações só chegam **enquanto o app está aberto** (Supabase Realtime = WebSocket). Para notificações com app fechado seria necessário Web Push API com Service Worker — fora do escopo aqui.
- O histórico de notificações persiste no banco e aparece no sininho mesmo após recarregar a página.
- A detecção de "episódio novo publicado" captura tanto `INSERT` quanto `UPDATE` (quando admin marca `is_published = true`), sendo robusta para ambos os fluxos do admin.
