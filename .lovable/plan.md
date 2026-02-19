
# Adicionar Role no Editar + Coluna de Email na Tabela

## Problemas identificados

### 1. Modal "Editar Usuário" não tem campo de nível de acesso
O estado `editDialog` só guarda `{ userId, name }` e o formulário só tem o campo de nome. Não há como alterar o papel do usuário (admin/comum) sem clicar no botão de escudo separado na tabela.

### 2. Coluna de email ausente na tabela
A tabela `profiles` não armazena email — ele fica apenas no `auth.users`. A query atual busca apenas `id, display_name, avatar_url, created_at` da tabela `profiles`. Para exibir o email, a solução mais segura e simples é adicionar uma nova action `"list"` na Edge Function `admin-manage-user`, que usa o `supabaseAdmin` (service role) para chamar `auth.admin.listUsers()` e retorna id + email de todos os usuários. O frontend faz um merge desse resultado com os profiles.

### 3. Edge Function `update` não processa mudança de role
A action `update` atualmente só atualiza `display_name` no perfil. Precisamos que ela também receba `role` e adicione ou remova o papel `admin` na tabela `user_roles`.

---

## Mudanças planejadas

### `supabase/functions/admin-manage-user/index.ts`

**Nova action `"list"`**: retorna a lista de emails de todos os usuários via `supabaseAdmin.auth.admin.listUsers()`.

```typescript
if (action === "list") {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return new Response(JSON.stringify({
    users: data.users.map(u => ({ id: u.id, email: u.email }))
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

**Action `"update"` expandida**: além de atualizar `display_name`, processa a mudança de `role`:
- Se `role === "admin"` → insere `{ user_id, role: "admin" }` em `user_roles` (se não existir)
- Se `role === "user"` → deleta o registro `admin` de `user_roles`
- Se `role` não foi enviado → comportamento atual mantido (só atualiza nome)

```typescript
if (role !== undefined) {
  if (role === "admin") {
    await supabaseAdmin.from("user_roles")
      .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
  } else {
    await supabaseAdmin.from("user_roles")
      .delete().eq("user_id", user_id).eq("role", "admin");
  }
}
```

---

### `src/pages/admin/UserManager.tsx`

**1. Busca de emails**: adicionar uma segunda query que chama a action `"list"` da edge function para obter os emails. O resultado é mergeado com os profiles via `Map<id, email>`.

```typescript
// Nova query de emails
const { data: emailMap } = useQuery({
  queryKey: ["admin-users-emails"],
  queryFn: async () => {
    const { data } = await supabase.functions.invoke("admin-manage-user", {
      body: { action: "list" },
    });
    return new Map(data.users.map((u: any) => [u.id, u.email]));
  },
});
```

**2. Interface `UserRow`**: adicionar campo `email: string`.

**3. Tabela**: adicionar coluna "Email" entre "Nome" e "Moedas". O campo de busca também passará a incluir o email:
```typescript
const filtered = (users ?? []).filter(u =>
  (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
  (u.email || "").toLowerCase().includes(search.toLowerCase())
);
```

**4. Estado `editDialog`**: expandir para incluir `roles: string[]`:
```typescript
const [editDialog, setEditDialog] = useState<{
  userId: string; name: string; roles: string[]
} | null>(null);
const [editRole, setEditRole] = useState<"user" | "admin">("user");
```

**5. Modal "Editar Usuário"**: adicionar campo "Nível de acesso" com Select abaixo do campo de nome, pré-selecionado com o papel atual do usuário. O `editUserMutation` passará a enviar também o `role`:

```typescript
body: {
  action: "update",
  user_id: editDialog!.userId,
  display_name: editName,
  role: editRole,
}
```

**6. Ao abrir o modal de edição**, pré-popular `editRole` com base nos roles atuais do usuário:
```typescript
onClick={() => {
  setEditDialog({ userId: u.id, name: u.display_name || "", roles: u.roles });
  setEditName(u.display_name || "");
  setEditRole(u.roles.includes("admin") ? "admin" : "user");
}}
```

---

## Fluxo completo após as mudanças

1. Admin clica em "Lápis" num usuário comum
2. Modal abre com nome preenchido e "Nível de acesso: Usuário comum"
3. Admin altera para "Administrador" e clica "Salvar"
4. Edge Function atualiza o nome E insere `admin` em `user_roles`
5. A tabela atualiza mostrando o badge `admin` no usuário

---

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/admin-manage-user/index.ts` | Nova action `list` + `update` processa role |
| `src/pages/admin/UserManager.tsx` | Query de emails, coluna Email, campo role no modal editar |

## Banco de dados — sem alterações necessárias

A tabela `user_roles` já suporta múltiplos papéis e a `user_roles` já tem RLS correta para admins fazerem insert/delete via service role.
