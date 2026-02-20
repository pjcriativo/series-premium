
# Correção do Login com Google — Configuração Supabase + Google Cloud

## Diagnóstico do Erro

O erro `ERR_CONNECTION_REFUSED` com `localhost` acontece porque:

1. O usuário clica em "Continuar com Google" na produção (`https://www.epsodiox.com`)
2. O Google autentica o usuário com sucesso
3. O Google tenta redirecionar para a callback URL registrada no Google Cloud Console
4. A callback URL registrada no Google Cloud aponta para `localhost` (ambiente de desenvolvimento), **não para a URL de produção**
5. O browser tenta acessar `localhost` e falha com `ERR_CONNECTION_REFUSED`

**O código está correto.** `redirectTo: window.location.origin` é a implementação certa — ele usa a URL atual do browser automaticamente. O problema é exclusivamente de configuração externa.

## O Que Precisa Ser Configurado

### Parte 1 — Google Cloud Console

Você precisa adicionar as URLs corretas no seu projeto OAuth no Google Cloud.

**Onde acessar:** https://console.cloud.google.com → APIs & Services → Credentials → seu OAuth 2.0 Client ID

**Na seção "Authorized JavaScript origins", adicione:**
```
https://www.epsodiox.com
https://epsodiox.com
```

**Na seção "Authorized redirect URIs", adicione:**
```
https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
```

Esta é a URL mais importante — é para ela que o Google envia o usuário após autenticar. O Supabase então processa o token e redireciona para o seu site.

**Remova ou mantenha separado o localhost:**
- Se você usa `localhost` para desenvolvimento local, pode mantê-lo, mas certifique-se que as URLs de produção também estão adicionadas.

### Parte 2 — Supabase Dashboard (URL Configuration)

**Onde acessar:** https://supabase.com/dashboard/project/pnuydoujbrpfhohsxndz/auth/url-configuration

**Site URL** (campo principal):
```
https://www.epsodiox.com
```

**Additional Redirect URLs** (lista de URLs permitidas):
```
https://www.epsodiox.com
https://www.epsodiox.com/**
https://epsodiox.com
https://epsodiox.com/**
https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app
https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app/**
```

O `**` no final é importante — permite que qualquer subrota (como `/`, `/auth`, etc.) seja aceita como destino do redirect.

### Parte 3 — Verificar Provider Google no Supabase

**Onde acessar:** https://supabase.com/dashboard/project/pnuydoujbrpfhohsxndz/auth/providers

Confirmar que:
- O provider **Google** está habilitado (toggle ligado)
- O **Client ID** e **Client Secret** do Google Cloud estão preenchidos corretamente

## Análise do Código Atual

O código de autenticação está implementado corretamente seguindo as boas práticas:

**`src/hooks/useAuth.tsx` — signInWithGoogle:**
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin, // correto: usa a URL atual do browser
    },
  });
  if (error) throw error;
};
```

**O listener `onAuthStateChange` está correto** — configurado antes de `getSession()`, detecta `SIGNED_IN` após o redirect do Google e atualiza o estado automaticamente.

**Não é necessária nenhuma mudança de código** para o Google OAuth funcionar — apenas as configurações externas acima.

## Fluxo Completo do OAuth (Para Referência)

```text
1. Usuário clica "Continuar com Google" em https://www.epsodiox.com
         ↓
2. signInWithOAuth({ provider: "google", redirectTo: "https://www.epsodiox.com" })
         ↓
3. Supabase redireciona para accounts.google.com com os parâmetros OAuth
         ↓
4. Usuário autoriza no Google
         ↓
5. Google redireciona para: https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
   (esta URL DEVE estar no Google Cloud Console como "Authorized redirect URI")
         ↓
6. Supabase processa o token, cria/atualiza o usuário
         ↓
7. Supabase redireciona para: https://www.epsodiox.com
   (esta URL DEVE estar nas "Additional Redirect URLs" do Supabase)
         ↓
8. onAuthStateChange dispara com evento SIGNED_IN
         ↓
9. Usuário é redirecionado para / ou /admin conforme o papel
```

## Checklist de Configuração

- [ ] Google Cloud Console → Authorized JavaScript origins: `https://www.epsodiox.com`
- [ ] Google Cloud Console → Authorized redirect URIs: `https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback`
- [ ] Supabase → Site URL: `https://www.epsodiox.com`
- [ ] Supabase → Additional Redirect URLs inclui `https://www.epsodiox.com/**`
- [ ] Supabase → Provider Google habilitado com Client ID e Secret corretos

## Nenhuma mudança de código necessária

A implementação atual já segue todas as boas práticas:
- `onAuthStateChange` configurado corretamente no `AuthProvider`
- `redirectTo: window.location.origin` usa a URL atual dinamicamente
- `getSession()` recupera sessão existente no carregamento inicial
- O fluxo de redirecionamento pós-login (`navigate(isAdmin ? "/admin" : "/")`) está correto
