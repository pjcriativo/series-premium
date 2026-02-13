

# CRUD Completo de Usuarios no Painel Admin

## Situacao Atual
O `UserManager.tsx` ja possui:
- Listagem com busca e paginacao
- Ajuste de moedas (creditar/debitar)
- Toggle de papel admin
- Historico de transacoes

## O que sera adicionado

### 1. Criar Usuario (via Edge Function)
Criar usuarios requer acesso ao `supabase.auth.admin.createUser`, que so funciona com a service role key no servidor.

**Nova Edge Function `admin-manage-user`:**
- Acao `create`: cria usuario com email, senha e display_name
  - Usa `supabase.auth.admin.createUser()` com `email_confirm: true`
  - O trigger `handle_new_user` ja existente cria automaticamente o profile, wallet e role
- Acao `update`: atualiza display_name no profile
- Acao `delete`: remove usuario via `supabase.auth.admin.deleteUser()`
  - As foreign keys com CASCADE cuidam de limpar profiles, wallets, roles, etc.
- Todas as acoes verificam se o chamador e admin via `has_role`

**Dialog "Criar Usuario" no frontend:**
- Campos: Email, Senha, Nome de exibicao
- Validacao basica (email valido, senha minima 6 chars)
- Botao "Criar" que chama a edge function

### 2. Editar Perfil do Usuario
**Dialog "Editar Usuario":**
- Campos editaveis: display_name
- Chama a edge function com acao `update`

### 3. Excluir Usuario
**AlertDialog de confirmacao:**
- Exibe nome do usuario e aviso de que a acao e irreversivel
- Chama a edge function com acao `delete`
- Remove o usuario do Supabase Auth (cascade limpa tabelas relacionadas)

### 4. Visualizar Detalhes
**Dialog de detalhes do usuario:**
- Exibe: nome, email (se disponivel), data de criacao, saldo, papeis
- Episodios desbloqueados e series desbloqueadas
- Acesso rapido as acoes (editar, ajustar moedas, etc.)

## Arquivos modificados

1. **`supabase/functions/admin-manage-user/index.ts`** (NOVO)
   - Edge function com 3 acoes: create, update, delete
   - Verificacao de admin em todas as acoes

2. **`src/pages/admin/UserManager.tsx`** (EDITADO)
   - Botao "Novo Usuario" no topo
   - Dialog de criacao com formulario
   - Botao de editar (icone Pencil) na tabela
   - Dialog de edicao com campos editaveis
   - Botao de excluir (icone Trash2) na tabela
   - AlertDialog de confirmacao de exclusao
   - Dialog de detalhes ao clicar no nome do usuario

## Detalhes tecnicos

```text
Fluxo de criacao:
  Admin clica "Novo Usuario"
    -> Preenche email, senha, nome
    -> POST /admin-manage-user { action: "create", email, password, display_name }
    -> Edge function: auth.admin.createUser()
    -> Trigger handle_new_user cria profile + wallet + role
    -> Invalida query -> tabela atualiza

Fluxo de exclusao:
  Admin clica icone Trash no usuario
    -> AlertDialog de confirmacao
    -> POST /admin-manage-user { action: "delete", user_id }
    -> Edge function: auth.admin.deleteUser()
    -> CASCADE remove dados relacionados
    -> Invalida query -> tabela atualiza

Fluxo de edicao:
  Admin clica icone Pencil
    -> Dialog com nome atual
    -> POST /admin-manage-user { action: "update", user_id, display_name }
    -> Edge function: update profiles SET display_name
    -> Invalida query -> tabela atualiza
```

