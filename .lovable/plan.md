
# O que falta para o Login com Google funcionar

## Diagnóstico: O código está pronto

O app já tem tudo implementado corretamente no lado do código:
- Botão "Continuar com Google" na tela de Auth
- Função `signInWithGoogle()` no hook `useAuth.tsx` usando `supabase.auth.signInWithOAuth`
- Redirecionamento correto para `window.location.origin` após o login

O problema está exclusivamente em **configurações externas** que precisam ser feitas manualmente no Google Cloud Console e no Supabase Dashboard. Não há mudança de código necessária.

---

## O que precisa ser feito (tudo fora do código)

### Passo 1 — Criar credenciais OAuth no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto (ou use um existente)
3. Vá em **APIs & Services → OAuth consent screen**
   - Defina o app como "External"
   - Preencha nome do app, email de suporte
   - Em **Authorized domains**, adicione: `pnuydoujbrpfhohsxndz.supabase.co`
   - Scopes necessários: `email`, `profile`, `openid`
4. Vá em **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Em **Authorized JavaScript origins**, adicione:
     - `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app` (preview)
     - Seu domínio de produção (quando tiver)
   - Em **Authorized redirect URIs**, adicione a URL de callback do Supabase:
     - `https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback`
5. Anote o **Client ID** e o **Client Secret** gerados

---

### Passo 2 — Ativar o provedor Google no Supabase Dashboard

1. Acesse o painel do Supabase → **Authentication → Providers**
2. Encontre **Google** e ative o toggle
3. Cole o **Client ID** e **Client Secret** obtidos no passo anterior
4. Salve

---

### Passo 3 — Configurar URLs no Supabase

1. No Supabase Dashboard → **Authentication → URL Configuration**
2. Em **Site URL**, coloque a URL do seu site principal:
   - `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app`
3. Em **Redirect URLs (allow list)**, adicione:
   - `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app`
   - `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app/**`
   - Seu domínio de produção (quando tiver)

---

## Resumo visual do fluxo

```text
[Usuário clica "Continuar com Google"]
              ↓
  signInWithGoogle() no useAuth.tsx
  (código já pronto ✓)
              ↓
  Supabase redireciona para o Google
  (precisa: Google OAuth configurado ✓ passo 1)
              ↓
  Usuário faz login no Google
              ↓
  Google redireciona para:
  https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
  (precisa: Redirect URI no Google Cloud ✓ passo 1)
              ↓
  Supabase processa e redireciona para:
  window.location.origin (o app)
  (precisa: Site URL configurada ✓ passo 3)
              ↓
  onAuthStateChange dispara no app
  Usuário logado ✓ (código já pronto ✓)
```

---

## O que este plano NÃO muda no código

Nenhuma linha de código precisa ser alterada. Todo o trabalho é de configuração manual em dois painéis externos:

| Onde | O que fazer |
|---|---|
| Google Cloud Console | Criar OAuth Client ID + Secret, configurar domínios e redirect URI |
| Supabase Dashboard → Auth → Providers | Ativar Google e colar Client ID + Secret |
| Supabase Dashboard → Auth → URL Configuration | Configurar Site URL e lista de redirecionamentos permitidos |

Após esses 3 passos, o login com Google funcionará sem nenhuma alteração de código.
