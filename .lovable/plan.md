
# Adicionar Seleção de Nível de Acesso no Cadastro de Usuário

## O que será alterado

### 1. Formulário "Novo Usuário" — `src/pages/admin/UserManager.tsx`

Adicionar um campo de seleção **"Nível de acesso"** no modal de criação de usuário, com duas opções:
- **Usuário comum** (padrão)
- **Administrador**

O estado do formulário passará a incluir `role: "user" | "admin"`, e esse valor será enviado para a Edge Function junto com os outros dados.

```
Formulário atual:          Formulário novo:
┌─────────────────┐       ┌─────────────────────┐
│ Email           │       │ Email               │
│ Senha           │       │ Senha               │
│ Nome de exibição│  →    │ Nome de exibição    │
│                 │       │ Nível de acesso     │
│ [Criar Usuário] │       │   ○ Usuário comum   │
└─────────────────┘       │   ○ Administrador   │
                          │ [Criar Usuário]     │
                          └─────────────────────┘
```

### 2. Edge Function `admin-manage-user` — `supabase/functions/admin-manage-user/index.ts`

Após criar o usuário com sucesso, se `role === "admin"`, inserir um registro na tabela `user_roles` com o papel `admin` usando o `supabaseAdmin` (service role):

```typescript
// Após criar o usuário no Auth:
if (role === "admin") {
  await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: data.user.id, role: "admin" });
}
// O gatilho handle_new_user() já insere o papel "user" automaticamente.
// Para admin, inserimos o papel adicional "admin".
```

**Nota importante:** O `handle_new_user()` trigger já insere automaticamente o papel `"user"` para todo novo usuário. Portanto, para admins, apenas inserimos o papel extra `"admin"` — não é necessário remover o `"user"`, pois o sistema usa `has_role(_user_id, 'admin')` que verifica especificamente o papel `admin`.

### 3. Banco de dados — sem alterações necessárias

A tabela `user_roles` já suporta múltiplos papéis por usuário e já tem a RLS correta. Nenhuma migration é necessária.

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/UserManager.tsx` | Adicionar campo `role` no `createForm` e Select no modal |
| `supabase/functions/admin-manage-user/index.ts` | Processar o `role` e inserir na `user_roles` após criar |

## Fluxo completo após a mudança

1. Admin abre "Novo Usuário"
2. Preenche email, senha, nome e seleciona **Administrador** ou **Usuário comum**
3. Clica em "Criar Usuário"
4. Edge Function cria o usuário no Auth (trigger insere `user` em `user_roles` automaticamente)
5. Se `role === "admin"`, Edge Function insere também `admin` em `user_roles`
6. Usuário aparece na lista com o badge correto (admin ou user)
