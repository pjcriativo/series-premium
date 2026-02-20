
# Diagnóstico e Guia Completo: Google OAuth com Supabase

## O Que os Logs Confirmam

Os logs do Supabase mostram que o Google OAuth **já funciona tecnicamente**. O usuário `pjcriativoweb@gmail.com` fez login com sucesso (status 302) às 15h47 de hoje. Porém o `referer` era `http://localhost:3000`, o que indica que:

- O fluxo está sendo iniciado a partir do localhost
- Mas o site de produção é `https://www.epsodiox.com`

O erro `ERR_CONNECTION_REFUSED` ocorre porque depois do Google redirecionar para o Supabase, o Supabase tenta redirecionar de volta para `http://localhost:3000` — e essa URL não está acessível na máquina do usuário final.

## Resultado das Verificacoes

### Codigo React — APROVADO

O codigo em `src/hooks/useAuth.tsx` esta correto:

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, // usa a URL atual do browser
    },
  });
  if (error) throw error;
};
```

O `window.location.origin` retorna automaticamente:
- Em producao: `https://www.epsodiox.com`
- No preview Lovable: `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app`
- Em dev local: `http://localhost:5173`

Nao e necessaria nenhuma mudanca de codigo.

### Componente de Login — APROVADO

O `src/pages/Auth.tsx` ja implementa o botao de Google corretamente com tratamento de erro via toast. O logout tambem funciona via `signOut()` no `useAuth`.

### Protecao de Rotas — APROVADO

O `ProtectedRoute` e o `AdminRoute` ja estao implementados corretamente em `src/App.tsx`.

## O Que Precisa Ser Configurado (Configuracao Externa)

Nao ha nenhuma mudanca de codigo. Apenas configuracoes em dois paineis externos.

### Configuracao 1 — Supabase Dashboard

Acesse: Authentication → URL Configuration

**Site URL** — deve ser:
```
https://www.epsodiox.com
```

**Additional Redirect URLs** — deve conter TODAS essas URLs:
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

O `/**` permite qualquer subrota como `/`, `/auth`, `/admin`, etc.

### Configuracao 2 — Google Cloud Console

Acesse: APIs & Services → Credentials → seu OAuth 2.0 Client ID

**Authorized JavaScript origins** — adicione:
```
https://www.epsodiox.com
https://epsodiox.com
http://localhost:5173
http://localhost:3000
```

**Authorized redirect URIs** — deve conter EXATAMENTE:
```
https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
```

Esta e a unica URI de callback que o Google precisa. O Supabase processa o token e depois redireciona para o seu site usando as URLs da lista acima.

**IMPORTANTE:** Nao adicione `https://www.epsodiox.com/auth/v1/callback` no Google Cloud — essa URL nao existe no seu projeto. A unica callback do Google deve ser a do Supabase.

### Configuracao 3 — Supabase Provider Google

Acesse: Authentication → Providers → Google

Verifique:
- Toggle **Enabled** ligado
- **Client ID** preenchido com o valor do Google Cloud Console
- **Client Secret** preenchido com o valor do Google Cloud Console

## Fluxo OAuth Completo

```text
Usuario clica "Continuar com Google" em https://www.epsodiox.com
  |
  v
signInWithOAuth({ redirectTo: "https://www.epsodiox.com" })
  |
  v
Supabase redireciona para accounts.google.com
(com state PKCE armazenado no localStorage de epsodiox.com)
  |
  v
Usuario autoriza no Google
  |
  v
Google redireciona para:
  https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
(esta URL DEVE estar no Google Cloud Console)
  |
  v
Supabase valida o token, cria a sessao
  |
  v
Supabase redireciona para: https://www.epsodiox.com
(esta URL DEVE estar nas Additional Redirect URLs do Supabase)
  |
  v
onAuthStateChange dispara com SIGNED_IN
  |
  v
navigate(isAdmin ? "/admin" : "/")  ✓
```

## Por Que o Erro PKCE State Ocorre

O erro `OAuth state not found or expired` acontece quando:
- O fluxo e iniciado em `http://localhost:3000`
- O PKCE state e salvo no `localStorage` do `localhost:3000`
- Apos autenticar no Google, o Supabase redireciona para `https://www.epsodiox.com`
- O browser abre `www.epsodiox.com` onde o PKCE state nao existe (e um dominio diferente)
- O Supabase nao consegue validar o state → erro

**Solucao:** Sempre testar de `https://www.epsodiox.com` diretamente. Nao iniciar o fluxo OAuth a partir do localhost quando o redirect final for para producao.

## Checklist Final

- [ ] Supabase → Site URL = `https://www.epsodiox.com`
- [ ] Supabase → Additional Redirect URLs inclui `https://www.epsodiox.com/**`
- [ ] Supabase → Additional Redirect URLs inclui `https://epsodiox.com/**`
- [ ] Supabase → Additional Redirect URLs inclui a URL do preview Lovable com `/**`
- [ ] Supabase → Additional Redirect URLs inclui `http://localhost:5173/**`
- [ ] Supabase → Provider Google habilitado
- [ ] Supabase → Client ID e Client Secret do Google preenchidos
- [ ] Google Cloud → Authorized JavaScript origins inclui `https://www.epsodiox.com`
- [ ] Google Cloud → Authorized redirect URIs inclui `https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback`
- [ ] Testar SEMPRE a partir da URL correta (nao misturar localhost com producao)

## Dicas de Debug

**Como confirmar que funcionou:**
1. Abra `https://www.epsodiox.com/auth` no browser
2. Clique em "Continuar com Google"
3. Voce sera redirecionado para o Google para autorizar
4. Apos autorizar, voltara para `https://www.epsodiox.com/` logado

**Como verificar nos logs do Supabase:**
- Acesse Authentication → Logs no dashboard
- Procure por eventos com `provider: "google"` e `status: 302`
- Se aparecer `referer: https://www.epsodiox.com` o fluxo esta correto

**Nenhuma mudanca de codigo e necessaria** — a implementacao esta completa e correta.
