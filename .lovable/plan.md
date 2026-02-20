
# Aprimorar Página de Perfil /me com Edição Completa e Integração de Carteira

## Análise do que já existe

O projeto já tem uma base sólida. A rota `/me` existe e usa `ProtectedRoute`. Há tabelas reais no Supabase: `profiles`, `wallets`, `transactions`. A loja de moedas (`CoinStore.tsx`) já funciona com a edge function `buy-coins`. O histórico de transações já é exibido.

**O que está faltando:**
- Campos `phone` e `bio` na tabela `profiles`
- Formulário para editar o perfil (nome, telefone, bio)
- Upload de avatar via Supabase Storage
- Visual mais completo e moderno para a página /me
- Skeleton loading enquanto os dados carregam

## Estrutura do banco de dados — alteração necessária

A tabela `profiles` precisa de 2 novos campos:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text;
```

Não são necessárias novas tabelas — `wallets` e `transactions` já existem e funcionam.

## Arquitetura da solução

A página `/me` será reformulada em uma estrutura de componentes separados:

```text
src/
├── pages/
│   └── Profile.tsx              ← reformulado como orquestrador
└── components/
    └── profile/
        ├── ProfileHeader.tsx    ← avatar, nome, email, saldo
        ├── EditProfileForm.tsx  ← form com nome, telefone, bio, avatar
        ├── WalletCard.tsx       ← saldo atual + botão para loja
        ├── CreditPackages.tsx   ← 3 pacotes com compra simulada
        └── TransactionHistory.tsx ← tabela de histórico
```

## O que será implementado

### 1. Migração de banco de dados
Adicionar `phone` (text, nullable) e `bio` (text, nullable) à tabela `profiles`. Os campos existentes e os dados atuais não são afetados.

### 2. ProfileHeader.tsx
- Avatar circular com inicial do nome como fallback
- Nome completo e email (somente leitura)
- Saldo atual de moedas exibido com badge
- Botão "Comprar Créditos" que abre o modal/scroll para pacotes

### 3. EditProfileForm.tsx
- Campos: Nome completo, Telefone, Bio (textarea)
- Upload de avatar: selecionar imagem → enviar para `covers` bucket no Storage → salvar URL em `profiles.avatar_url`
- Validação: nome obrigatório, telefone max 20 chars, bio max 300 chars
- Estado de loading durante salvamento
- Toast de sucesso ou erro

### 4. WalletCard.tsx
- Card com saldo atual e data da última atualização
- Botão "Adicionar Créditos" que abre seção de pacotes

### 5. CreditPackages.tsx
- 3 pacotes fixos criados na loja: 50, 120 e 300 créditos (lidos do Supabase `coin_packages`)
- Clicar em "Comprar" chama a edge function `buy-coins` existente
- Invalida query de wallet ao completar
- Toast de sucesso

### 6. TransactionHistory.tsx
- Lista das últimas 20 transações ordenadas por `created_at DESC`
- Ícone verde para crédito, vermelho para débito
- Razão traduzida para português
- Mensagem amigável quando não há transações
- Skeleton loading enquanto carrega

### 7. Profile.tsx reformulado
- Carrega todos os dados em paralelo com `useQuery`
- Exibe skeleton loading enquanto qualquer dado essencial está carregando
- Nunca deixa spinner infinito (try/catch/finally em todos os fetches)
- Mantém: toggle de auto-desbloqueio, "Continuar Assistindo", "Séries Assistidas", botão de Sair e link Admin

## Segurança
- Todos os updates de `profiles` usam `eq("id", user.id)` — RLS do Supabase garante que só o próprio usuário pode atualizar
- O saldo nunca é alterado diretamente pelo frontend — toda compra passa pela edge function `buy-coins` existente
- Upload de avatar é feito no bucket `covers` (já público) com path `avatars/{user_id}/{filename}` para isolar por usuário

## Arquivos afetados
1. **NOVO** `src/components/profile/ProfileHeader.tsx`
2. **NOVO** `src/components/profile/EditProfileForm.tsx`
3. **NOVO** `src/components/profile/WalletCard.tsx`
4. **NOVO** `src/components/profile/CreditPackages.tsx`
5. **NOVO** `src/components/profile/TransactionHistory.tsx`
6. **MODIFICADO** `src/pages/Profile.tsx` — reformulado para usar os novos componentes
7. **MIGRAÇÃO** — adicionar `phone` e `bio` à tabela `profiles`
