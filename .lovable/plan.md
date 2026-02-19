
# Correções no Navbar e na Tela de Login

## Problema 1: Acesso ao Admin não aparece no HoverCard

O HoverCard do usuário logado (Navbar) mostra apenas "Completar" (link para carteira). Não existe nenhum link para o painel `/admin`, então o admin não tem como acessar o painel pelo Navbar quando já está logado na home.

**Solução:** Adicionar um link "Painel Admin" no HoverCard, visível apenas quando `isAdmin === true`.

```tsx
// No HoverCard, após o botão "Completar":
{isAdmin && (
  <Link to="/admin" className="block mt-2">
    <Button variant="outline" className="w-full h-9 text-sm font-bold">
      Painel Admin
    </Button>
  </Link>
)}
```

## Problema 2: Bug de redirect na tela de login (Auth.tsx)

Na linha 62-67 do `Auth.tsx`, a query de verificação de admin após o login está incorreta — ela não filtra pelo `user_id` do usuário que acabou de fazer login:

```typescript
// ERRADO — sem filtro de user_id, pega qualquer admin do sistema:
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("role", "admin")    // <-- falta .eq("user_id", userId)
  .maybeSingle();
navigate(roleData ? "/admin" : "/");
```

Além disso, o `useEffect` (linhas 48-52) já cuida do redirect para `/admin` quando `isAdmin` é `true` (vindo do contexto `useAuth`), então essa query manual é redundante e bugada.

**Solução:** Remover a query manual de verificação de role dentro do `handleSubmit`. O `useEffect` já trata o redirect corretamente ao detectar `user && isAdmin`.

```typescript
case "login": {
  await signIn(email, password);
  // Redirect handled automatically by useEffect watching user + isAdmin
  break;
}
```

## Arquivos modificados

- `src/components/Navbar.tsx` — adicionar link "Painel Admin" no HoverCard para admins
- `src/pages/Auth.tsx` — remover a query bugada de verificação de role no handleSubmit do login

## O que NÃO será alterado

- Tamanho da logo (mantém 150px conforme solicitado)
- Itens do menu (Início, Categorias, Fã-Clube, Marca)
- Estilo visual do navbar
- Lógica de autenticação no `useAuth.tsx`
