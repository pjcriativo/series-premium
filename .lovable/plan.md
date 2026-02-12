

# Redirecionar Admin para Painel Admin apos Login

## O que muda

Quando um usuario com role `admin` fizer login, ele sera redirecionado automaticamente para `/admin` em vez de `/` (home). De dentro do painel admin, ele podera acessar seu perfil de usuario.

## Mudancas

### 1. Redirect pos-login baseado no role (Auth.tsx)

Apos login bem-sucedido, verificar se o usuario e admin antes de redirecionar:
- Se admin -> redireciona para `/admin`
- Se usuario normal -> redireciona para `/`

Isso se aplica tanto ao login por email/senha quanto ao redirect automatico quando o usuario ja esta logado.

### 2. Adicionar link "Meu Perfil" no menu lateral do Admin (AdminLayout.tsx)

Adicionar um item de navegacao no sidebar/drawer do admin para acessar `/me` (perfil do usuario), permitindo que o admin acesse seu perfil sem sair do contexto admin.

## Detalhes Tecnicos

### Auth.tsx
- No `handleSubmit` caso `login`: apos `signIn`, consultar `user_roles` para verificar se e admin e redirecionar para `/admin` ou `/`
- No `useEffect` de redirect automatico (linha 46-49): verificar `isAdmin` do hook `useAuth` e redirecionar de acordo

### AdminLayout.tsx
- Adicionar item `{ to: "/me", icon: User, label: "Meu Perfil" }` na lista `navItems` ou como link separado proximo ao botao "Sair"

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/pages/Auth.tsx` | Modificar - redirect condicional pos-login |
| `src/pages/admin/AdminLayout.tsx` | Modificar - adicionar link para perfil |

