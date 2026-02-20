
# Correção do ERR_CONNECTION_REFUSED — Site URL Incorreto no Supabase

## Diagnóstico Definitivo

O screenshot confirma: a URL do browser após o login com Google é:
```
localhost:3000/#access_token=eyJhbGciOiJIUzI1NiIs...
```

O `access_token` presente na URL significa que a autenticação com Google funcionou completamente. O problema é que o Supabase está redirecionando o usuário para `http://localhost:3000` após a autenticação, porque o **Site URL** no Supabase Dashboard ainda está configurado como `http://localhost:3000`.

O código em `useAuth.tsx` usa `redirectTo: window.location.origin`, que envia a URL de origem correta para o Supabase no momento do login. Porém o Supabase usa o **Site URL** como fallback principal quando monta o redirect final — e esse valor ainda aponta para localhost.

## Nenhuma mudança de código necessária

O código está perfeito. A correção é apenas de configuração externa no Supabase Dashboard.

## O Que Precisa Ser Feito (Ação Manual do Usuário)

### Passo 1 — Alterar o Site URL no Supabase

Acesse: https://supabase.com/dashboard/project/pnuydoujbrpfhohsxndz/auth/url-configuration

**Campo "Site URL"** — altere de:
```
http://localhost:3000
```
Para:
```
https://www.epsodiox.com
```

### Passo 2 — Confirmar as Additional Redirect URLs

No mesmo painel, certifique-se que a lista "Additional Redirect URLs" contém:
```
https://www.epsodiox.com
https://www.epsodiox.com/**
https://epsodiox.com
https://epsodiox.com/**
https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app
https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app/**
http://localhost:5173
http://localhost:5173/**
http://localhost:3000
http://localhost:3000/**
```

### Passo 3 — Confirmar o Google Cloud Console

No Google Cloud Console, em APIs & Services → Credentials → OAuth 2.0 Client ID:

**Authorized JavaScript origins:**
```
https://www.epsodiox.com
https://epsodiox.com
http://localhost:5173
http://localhost:3000
```

**Authorized redirect URIs** — deve conter APENAS:
```
https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
```

## Por Que o Token Aparece na URL do localhost

O fluxo que está ocorrendo atualmente:

```text
1. Usuário clica "Continuar com Google" em epsodiox.com
         ↓
2. Supabase envia redirectTo: "https://www.epsodiox.com" para o Google
         ↓
3. Google autentica e redireciona para:
   https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
         ↓
4. Supabase processa o token com sucesso
         ↓
5. Supabase consulta o "Site URL" configurado = http://localhost:3000  ← PROBLEMA
         ↓
6. Supabase redireciona para: http://localhost:3000/#access_token=...
         ↓
7. Browser tenta acessar localhost:3000 → ERR_CONNECTION_REFUSED
```

Após corrigir o Site URL para `https://www.epsodiox.com`:

```text
5. Supabase consulta o "Site URL" configurado = https://www.epsodiox.com  ✓
         ↓
6. Supabase redireciona para: https://www.epsodiox.com/#access_token=...
         ↓
7. onAuthStateChange detecta SIGNED_IN ✓
         ↓
8. navigate(isAdmin ? "/admin" : "/")  ✓
```

## Checklist de Verificação

- [ ] Supabase Dashboard → Site URL alterado para `https://www.epsodiox.com`
- [ ] Supabase Dashboard → Additional Redirect URLs inclui `https://www.epsodiox.com/**`
- [ ] Google Cloud Console → Authorized redirect URIs inclui apenas `https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback`
- [ ] Google Cloud Console → Authorized JavaScript origins inclui `https://www.epsodiox.com`
- [ ] Testar em aba anônima partindo de `https://www.epsodiox.com/auth`

## Nenhuma mudança de código necessária

A implementação React está completamente correta. Apenas o Site URL no Supabase precisa ser alterado de `http://localhost:3000` para `https://www.epsodiox.com`.
