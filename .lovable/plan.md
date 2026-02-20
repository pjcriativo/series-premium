
# Correção do Perfil e Bloqueio de Compra sem Pagamento

## Diagnóstico dos Problemas

### Problema 1 — Card de perfil no Navbar sem link para o perfil completo

O HoverCard do avatar no `Navbar.tsx` mostra email + saldo com dois botões:
- "Completar" → redireciona para `/wallet` (loja de moedas), não para o perfil
- "Sair" → logout

Não existe nenhum botão/link "Ver Perfil" apontando para `/me`. O usuário clica no avatar esperando ir ao perfil e vai parar na loja de moedas, ou a tela parece vazia porque a rota `/profile` não existe (a rota correta é `/me`).

### Problema 2 — Compra de moedas sem pagamento real

A Edge Function `buy-coins/index.ts` na rota de compra normal:
1. Recebe `package_id`
2. Busca o pacote no banco
3. **Imediatamente credita as moedas na carteira**
4. Registra transação com `reason: "purchase"`

Não há nenhuma validação de pagamento (Stripe, PIX, etc.). Qualquer clique em "Comprar" adiciona moedas gratuitamente. Isso é uma falha crítica de monetização.

O usuário mencionou que **Stripe será adicionado depois**. Portanto, a solução correta agora é **bloquear a compra** e mostrar uma tela de "Em breve" ao invés de processar o pagamento falso.

---

## O que será corrigido

### Fix 1 — Navbar HoverCard: adicionar link "Meu Perfil"

Em `src/components/Navbar.tsx`, adicionar um botão "Meu Perfil" no HoverCard que leva para `/me`, posicionado antes de "Completar".

### Fix 2 — Bloquear compra de moedas sem pagamento

**Estratégia:** Como o Stripe ainda será integrado, a abordagem é substituir a ação de compra por um modal/estado de "Em breve — pagamento via Stripe em configuração". O botão "Comprar" nos dois lugares onde aparece:

- `src/components/profile/CreditPackages.tsx` (no perfil `/me`)
- `src/pages/CoinStore.tsx` (na loja `/wallet`)

...não irá mais chamar a Edge Function `buy-coins`. Em vez disso, mostrará um modal com:

```
Pagamento em breve
O sistema de pagamento está sendo configurado.
Em breve você poderá comprar moedas com Stripe, PIX e cartão de crédito.
```

**A Edge Function `buy-coins` permanece intacta** (será conectada ao Stripe depois), mas o frontend deixa de chamá-la para compras normais de usuários. O fluxo de admin_grant (crédito administrativo) continua funcionando normalmente.

### Fix 3 — Rota "Completar" no Navbar

O botão "Completar" no HoverCard do Navbar atualmente aponta para `/wallet`. Isso será mantido pois a loja terá o aviso "Em breve". Mas será adicionado também o botão de perfil para clareza.

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/Navbar.tsx` | Adicionar link "Meu Perfil" no HoverCard antes do botão "Completar" |
| `src/components/profile/CreditPackages.tsx` | Substituir chamada à Edge Function por modal "Pagamento em breve" |
| `src/pages/CoinStore.tsx` | Substituir chamada à Edge Function por modal "Pagamento em breve" |

---

## UX do modal "Pagamento em breve"

Ao clicar em "Comprar" em qualquer pacote, em vez de processar:

```
[Ícone de cadeado ou cartão]
Pagamento em breve

O sistema de compra de moedas está em configuração.
Em breve você poderá comprar com:
• Cartão de crédito via Stripe
• PIX
• Google Pay

Aguarde a liberação!

[Fechar]
```

Implementado como um `Dialog` do Radix UI já disponível no projeto — sem dependências novas.

---

## O que NÃO será alterado

- A Edge Function `buy-coins` — permanece para quando o Stripe for integrado
- O fluxo de `admin_grant` — admins continuam podendo creditar manualmente
- O banco de dados — nenhuma mudança de schema necessária
- A lógica de desbloqueio de episódios — permanece igual
- A rota `/me` e o perfil completo — continuam funcionando

---

## Notas técnicas

- O HoverCard do Navbar já existe com Radix UI — sem alteração estrutural
- O Dialog de "Em breve" usa o componente `src/components/ui/dialog.tsx` já existente
- Quando o Stripe for integrado, bastará remover o modal de bloqueio e reconectar `handleBuy` à Edge Function com o checkout do Stripe
