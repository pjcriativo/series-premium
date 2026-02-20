
# Melhorias na Página de Perfil /me e Card do Navbar

## Diagnóstico dos Problemas Identificados

### Problema 1 — Card do Navbar: email saindo para fora
Na imagem enviada, o email longo (`servosnabatalha@gmail.com`) fica cortado e transbordando o card do HoverCard. A causa é que o container `flex items-center gap-2` não tem `min-w-0` e o texto de nome/email não tem `truncate`. O card tem `w-60` mas o conteúdo interno não respeita esse limite.

### Problema 2 — Avatar do Navbar sem foto real
O avatar no HoverCard usa apenas `AvatarFallback` (inicial), mesmo quando o usuário tem `avatar_url` no banco. O componente `Avatar` do Navbar importa só `AvatarFallback`, sem `AvatarImage`.

### Problema 3 — Perfil /me: funcionalidades faltando
Conforme solicitado, adicionar:
- **Badge "Membro desde"** com data de criação da conta
- **Histórico de episódios assistidos** (via `episode_unlocks` + join com `episodes` e `series`)
- O avatar com upload e a bio já existem no `EditProfileForm` — mas o `ProfileHeader` não mostra o avatar atualizado em tempo real; garantir que após salvar o avatar aparece

---

## O que será implementado

### Fix 1 — Navbar HoverCard: corrigir overflow do email

**Arquivo:** `src/components/Navbar.tsx`

- Adicionar `min-w-0` ao container `div` interno do avatar + texto
- Adicionar `truncate` e `max-w-full` ao `<span>` do email/nome
- Importar `AvatarImage` e exibir o avatar real quando o usuário tem foto (`profile?.avatar_url`)
- Aumentar largura do card de `w-60` para `w-64` para dar mais espaço

**Antes:**
```tsx
<div className="flex flex-col">
  <span className="text-sm font-bold text-foreground leading-tight">{displayName}</span>
  {uid && <span className="text-[10px] text-muted-foreground leading-tight">UID {uid}</span>}
</div>
```

**Depois:**
```tsx
<div className="flex flex-col min-w-0">
  <span className="text-sm font-bold text-foreground leading-tight truncate max-w-[140px]">{displayName}</span>
  {uid && <span className="text-[10px] text-muted-foreground leading-tight truncate">UID {uid}</span>}
</div>
```

### Fix 2 — Badge "Membro desde" no ProfileHeader

**Arquivo:** `src/components/profile/ProfileHeader.tsx`

Adicionar uma nova prop `memberSince: string | null` e exibir abaixo do email:

```
Membro desde abril de 2024
```

Formatado com `date-fns` (já instalado) em português. O `profiles.created_at` já existe no banco.

### Fix 3 — Histórico de Episódios Desbloqueados no Perfil

**Arquivo:** `src/pages/Profile.tsx`

Adicionar uma nova query que busca `episode_unlocks` com join em `episodes` (título, número, série_id) e `series` (título, cover_url). Exibir como uma seção "Episódios Desbloqueados" com cards horizontais scrolláveis — padrão visual idêntico ao "Continuar Assistindo" já existente.

A query é:
```ts
supabase
  .from("episode_unlocks")
  .select("unlocked_at, episode:episodes(id, title, episode_number, series_id, series:series(id, title, cover_url))")
  .order("unlocked_at", { ascending: false })
  .limit(20)
```

Cada card mostra: capa da série, badge "Ep. N", título da série, data de desbloqueio. Ao clicar, navega para `/watch/:episodeId`.

### Fix 4 — "Membro desde" vindo do perfil estendido

**Arquivo:** `src/pages/Profile.tsx`

Incluir `created_at` na query do `ext-profile`:
```ts
.select("id, display_name, avatar_url, auto_unlock, phone, bio, created_at")
```

Passar `memberSince={extProfile?.created_at ?? null}` para o `ProfileHeader`.

---

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `src/components/Navbar.tsx` | Corrigir overflow do email com `truncate` + `min-w-0`; adicionar `AvatarImage` com foto real |
| `src/components/profile/ProfileHeader.tsx` | Adicionar prop `memberSince` com badge formatado "Membro desde" |
| `src/pages/Profile.tsx` | Incluir `created_at` na query do perfil; passar `memberSince` para `ProfileHeader`; adicionar seção "Episódios Desbloqueados" |

**Sem mudanças de banco** — `profiles.created_at` e `episode_unlocks` já existem.  
**Sem novas dependências** — `date-fns` já está instalado.

---

## UX Final

```
[Avatar 96px]
Nome do Usuário
email@exemplo.com
Membro desde fevereiro de 2026        ← NOVO badge

[200 moedas]  [Comprar Créditos]

─── Episódios Desbloqueados ───       ← NOVA seção
[card] [card] [card] → scroll horizontal

─── Continuar Assistindo ───          (existente)
...
```

E no card do Navbar:
```
[S] servosnabatalha@gm... ← truncado
    UID fe96678b...
```
