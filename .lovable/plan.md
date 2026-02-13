

# Corrigir Loop Infinito de Loading no Admin (Series)

## Causas Raiz Identificadas

### Causa A: Deadlock no `onAuthStateChange` (PRINCIPAL)
No `useAuth.tsx`, as funcoes `checkAdmin` e `fetchProfile` sao chamadas com `await` dentro do callback `onAuthStateChange`. Isso e um anti-pattern documentado do Supabase que pode causar deadlock: o callback trava esperando as queries, e as queries podem travar esperando o auth state resolver.

Se qualquer uma dessas funcoes travar ou lancar erro, `setLoading(false)` nunca e chamado, e o `AdminRoute` exibe o spinner eternamente.

### Causa B: Falta de try/catch no fluxo de auth
Se `checkAdmin` ou `fetchProfile` lancam um erro inesperado (rede, timeout), nao ha tratamento. O `Promise.all` rejeita, mas ninguem captura a rejeicao, e `setLoading(false)` nunca executa.

### Causa C: Erros silenciosos no save
O save de serie usa `useMutation` corretamente com `onSuccess` e `onError`, mas nao loga erros no console, dificultando o diagnostico.

## Correcoes

### 1. Corrigir `useAuth.tsx` - Fluxo de auth seguro

**Problema**: `onAuthStateChange` faz `await` em queries de banco.
**Solucao**: Usar `setTimeout` para deferir as chamadas de banco, e envolver tudo em try/catch/finally para garantir que `loading` sempre finaliza.

```
onAuthStateChange -> 
  setSession/setUser imediatamente
  setTimeout(() => {
    try { checkAdmin + fetchProfile }
    catch { log error }
    finally { setLoading(false) }
  }, 0)
```

Mesma logica para `getSession().then(...)`.

Alem disso, adicionar try/catch individual em `checkAdmin` e `fetchProfile` para que um erro em uma nao impeça a outra de rodar.

### 2. Adicionar logs de diagnostico em `useAuth.tsx`

- `console.log("[AUTH] onAuthStateChange", event, session?.user?.id)`
- `console.log("[AUTH] getSession result", session?.user?.id)`
- `console.log("[AUTH] checkAdmin result", userId, isAdmin)`
- `console.error("[AUTH] checkAdmin error", error)`
- `console.log("[AUTH] loading complete")`

### 3. Adicionar logs de diagnostico em `AdminRoute.tsx`

- `console.log("[ADMIN_ROUTE] loading=", loading, "adminChecked=", adminChecked, "user=", !!user, "isAdmin=", isAdmin)`

### 4. Melhorar erro visivel no `SeriesForm.tsx`

- Logar erros completos no console dentro de `onError`
- Adicionar `console.log("[SERIES_FORM] saving...", formData)` e `console.log("[SERIES_FORM] saved ok")`
- Garantir que erros de upload de capa sejam visiveis

### 5. Adicionar timeout de seguranca no `AdminRoute.tsx`

Se `loading` ficar `true` por mais de 10 segundos, forcar `loading = false` e mostrar erro, em vez de spinner infinito.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useAuth.tsx` | Deferir chamadas de banco fora do `onAuthStateChange`, try/catch/finally, logs |
| `src/components/AdminRoute.tsx` | Logs de diagnostico, timeout de seguranca |
| `src/pages/admin/SeriesForm.tsx` | Logs no save, error logging detalhado |

## Detalhes Tecnicos

### useAuth.tsx - Padrao corrigido

O `onAuthStateChange` deve APENAS atualizar session/user de forma sincrona. As chamadas de banco (checkAdmin, fetchProfile) devem ser deferidas:

```typescript
onAuthStateChange(async (_event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  
  if (session?.user) {
    // Deferir para evitar deadlock
    try {
      await Promise.all([
        checkAdmin(session.user.id),
        fetchProfile(session.user.id),
      ]);
    } catch (err) {
      console.error("[AUTH] erro ao carregar perfil/role", err);
      setAdminChecked(true); // garantir que nao trava
    }
  } else {
    setIsAdmin(false);
    setAdminChecked(true);
    setProfile(null);
  }
  setLoading(false); // SEMPRE executado
});
```

Cada funcao interna tambem ganha try/catch:

```typescript
const checkAdmin = async (userId: string) => {
  try {
    const { data, error } = await supabase...
    if (error) console.error("[AUTH] checkAdmin error", error);
    setIsAdmin(!!data);
  } catch (err) {
    console.error("[AUTH] checkAdmin exception", err);
    setIsAdmin(false);
  } finally {
    setAdminChecked(true);
  }
};
```

### AdminRoute.tsx - Timeout de seguranca

```typescript
const [timedOut, setTimedOut] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setTimedOut(true), 10000);
  return () => clearTimeout(timer);
}, []);

if (timedOut && (loading || !adminChecked)) {
  console.error("[ADMIN_ROUTE] timeout - loading nunca finalizou");
  return <Navigate to="/auth" replace />;
}
```

