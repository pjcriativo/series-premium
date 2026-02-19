# 🎬 Epsodiox

> Plataforma de streaming de séries em formato vertical (9:16), com monetização via moedas virtuais, painel administrativo completo e integração com Stripe.

![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Status](https://img.shields.io/badge/status-produção-green)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Funcionalidades](#-funcionalidades)
3. [Stack Tecnológica](#-stack-tecnológica)
4. [Arquitetura do Banco de Dados](#-arquitetura-do-banco-de-dados)
5. [Edge Functions](#-edge-functions)
6. [Rotas da Aplicação](#-rotas-da-aplicação)
7. [Componentes e Módulos Principais](#-componentes-e-módulos-principais)
8. [Painel Administrativo](#-painel-administrativo)
9. [Configurações para Produção](#-configurações-para-produção)
10. [Como Rodar Localmente](#-como-rodar-localmente)
11. [Variáveis de Ambiente](#-variáveis-de-ambiente)
12. [Scripts Disponíveis](#-scripts-disponíveis)

---

## 🌐 Visão Geral

O **Epsodiox** é uma plataforma SPA (Single Page Application) de streaming de séries em formato vertical (9:16), projetada para consumo mobile-first. O sistema permite que usuários assistam episódios gratuitos ou pagos usando moedas virtuais, acompanhem seu progresso, interajam com curtidas e favoritos, e compartilhem conteúdo.

Administradores têm acesso a um painel completo de gestão de conteúdo, usuários, métricas e configuração de banners e pacotes de moedas.

**URL de Preview:** `https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app`

**Supabase Project ID:** `pnuydoujbrpfhohsxndz`

---

## ✅ Funcionalidades

### 🔐 Autenticação

| Recurso | Detalhes |
|---|---|
| Login por email/senha | `supabase.auth.signInWithPassword` |
| Cadastro com nome | Salva `display_name` em `profiles` via trigger |
| Login com Google OAuth | `supabase.auth.signInWithOAuth` — requer configuração externa |
| Recuperação de senha | Envia e-mail com link para redefinição |
| Redefinição de senha | Fluxo via `?mode=reset` na rota `/auth` |
| Proteção de rotas | `ProtectedRoute` (login) e `AdminRoute` (papel admin) |
| Context global | `AuthProvider` expõe `session`, `user`, `profile`, `isAdmin` |
| Hook `useRequireAuth` | Redireciona para `/auth` se não autenticado |
| Timeout de admin | `AdminRoute` tem timeout de 10s para prevenir tela presa |

---

### 🎬 Conteúdo

| Recurso | Detalhes |
|---|---|
| Catálogo de séries | Organizado por categorias, com capa, título e sinopse |
| Episódios verticais 9:16 | Suporta `video_url` (Storage) ou `youtube_url` (embed) |
| Player de vídeo nativo | Controles: play/pause, mute, seek, fullscreen |
| Retomada de vídeo | Retoma no segundo exato via `onLoadedMetadata` + seek |
| End screen | Tela ao final do episódio com botão para o próximo |
| Feed de Reels | Scroll snap vertical estilo TikTok (`/reels`) |
| Detalhe da série | Lista de episódios com status de desbloqueio e botão "Retomar" |
| Episódios gratuitos | Configurável por série (`free_episodes`) ou por episódio (`is_free`) |

---

### 💰 Monetização

| Recurso | Detalhes |
|---|---|
| Moedas virtuais | Sistema de créditos por usuário (`wallets`) |
| Loja de moedas | Pacotes configuráveis pelo admin (`coin_packages`) |
| Desbloqueio de episódio | Debita moedas e registra em `episode_unlocks` |
| Desbloqueio de série completa | Bundle — debita moedas e registra em `series_unlocks` |
| Auto-desbloqueio | Opção no perfil: desbloqueia automaticamente ao final do ep. |
| PaywallModal | Modal com opção de desbloquear ep. individual ou série completa |
| Prevenção de saldo negativo | Verificação de saldo antes de qualquer débito |
| Integração Stripe | Webhook configurado para processar pagamentos reais |
| Histórico de transações | Listado em `/purchases` com tipo (`credit`/`debit`) e data relativa |

---

### ❤️ Social

| Recurso | Detalhes |
|---|---|
| Curtidas em episódios | Tabela `episode_likes`, toggle por usuário |
| Favoritos em episódios | Tabela `episode_favorites`, toggle por usuário |
| Contadores públicos | Exibidos no player e nos Reels |
| Compartilhamento | Web Share API nativa (fallback para clipboard) |
| Hook `useEpisodeSocial` | Centraliza toda a lógica social (likes, favoritos, share) |

---

### 📈 Progresso e Histórico

| Recurso | Detalhes |
|---|---|
| Auto-save de progresso | A cada 5 segundos e no `unmount` do player |
| Continue Assistindo (Home) | Seção com link direto ao episódio + posição correta |
| Continue Assistindo (Perfil) | Lista de séries em andamento no perfil do usuário |
| Histórico de compras | Transações com tipo, motivo e data relativa (`/purchases`) |

---

### 🔍 Busca

| Recurso | Detalhes |
|---|---|
| Busca por título | Filtragem client-side em tempo real |
| Filtro por categoria | Seleção de categoria com reset |
| Rota dedicada | `/search` com campo de busca e grade de resultados |

---

### 🎨 UX e Interface

| Recurso | Detalhes |
|---|---|
| Dark mode padrão | Configurado via `next-themes` e tokens CSS |
| Animações de página | `fade-in` / `fade-out` entre episódios no player |
| Hero Slider | Banners configuráveis com autoplay (Embla Carousel) |
| Carrosséis por categoria | `HorizontalCarousel` com scroll horizontal |
| Seção "Em Alta" | Trending das últimas 7 dias por views |
| Ícone Play nos cards | Visível nos cards de "Continue Assistindo" |
| Bottom Navigation | Navegação inferior para mobile (`BottomNav`) |
| Breadcrumbs | No player (`/watch`) e no painel admin |
| Skeleton loading | Estados de carregamento em todas as páginas principais |
| Responsive | Mobile-first, sidebar no desktop, drawer (Sheet) no mobile |

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3.1 | Framework de interface |
| TypeScript | 5.8.3 | Tipagem estática |
| Vite | 5.4.19 | Build tool e dev server |
| Tailwind CSS | 3.4.17 | Estilização utilitária |
| shadcn/ui + Radix UI | — | Componentes acessíveis e headless |
| TanStack Query | 5.83.0 | Gerenciamento de estado/cache assíncrono |
| React Router DOM | 6.30.1 | Roteamento SPA |
| React Hook Form | 7.61.1 | Formulários com performance otimizada |
| Zod | 3.x | Validação de schemas e formulários |
| Embla Carousel | 8.6.0 | Carrosséis e Hero Slider |
| Recharts | 2.15.4 | Gráficos no dashboard admin |
| date-fns | 3.6.0 | Formatação e manipulação de datas |
| lucide-react | 0.462.0 | Biblioteca de ícones |
| Sonner | 1.7.4 | Toast notifications |
| next-themes | 0.3.0 | Gerenciamento de tema dark/light |

### Backend e Infraestrutura

| Tecnologia | Uso |
|---|---|
| Supabase (PostgreSQL 14.1) | Banco de dados relacional principal |
| Supabase Auth | Autenticação via email e Google OAuth |
| Supabase Storage | Armazenamento de vídeos e imagens de capa |
| Supabase Edge Functions (Deno) | Lógica de negócio segura no servidor |
| Row-Level Security (RLS) | Controle de acesso granular por usuário |
| Stripe | Processamento de pagamentos (webhook integrado) |

---

## 🗄️ Arquitetura do Banco de Dados

### Diagrama de Relacionamentos

```
profiles ──── user_roles
    │
    ├── wallets
    │       └── transactions
    │
    └── user_progress ──── series
                               │
                         ┌─────┴─────┐
                     episodes     banners
                         │
              ┌──────────┼──────────┐
        episode_unlocks  │  series_unlocks
                    episode_likes
                    episode_favorites
                         │
                        views
```

### Tabelas

| Tabela | Finalidade | Campos-chave |
|---|---|---|
| `profiles` | Dados públicos do usuário | `id`, `display_name`, `avatar_url`, `auto_unlock` |
| `user_roles` | Papéis do sistema | `user_id`, `role` (`admin` \| `user`) |
| `wallets` | Saldo de moedas por usuário | `user_id`, `balance` |
| `transactions` | Histórico financeiro | `user_id`, `coins`, `type`, `reason`, `ref_id` |
| `categories` | Categorias de séries | `id`, `name`, `slug` |
| `series` | Catálogo de séries | `id`, `title`, `slug`, `cover_url`, `free_episodes`, `category_id` |
| `episodes` | Episódios das séries | `id`, `series_id`, `episode_number`, `video_url`, `youtube_url`, `price_coins`, `is_free` |
| `episode_unlocks` | Desbloqueios individuais | `user_id`, `episode_id`, `unlocked_at` |
| `series_unlocks` | Desbloqueios de série completa | `user_id`, `series_id`, `unlocked_at` |
| `user_progress` | Progresso de visualização | `user_id`, `series_id`, `last_episode_number`, `last_position_seconds` |
| `views` | Analytics de visualizações | `user_id`, `episode_id`, `series_id`, `watched_seconds` |
| `coin_packages` | Pacotes de moedas da loja | `id`, `title`, `coins`, `price_cents`, `stripe_price_id` |
| `banners` | Banners do Hero Slider | `id`, `title`, `subtitle`, `image_url`, `link_series_id`, `sort_order` |
| `episode_likes` | Curtidas em episódios | `user_id`, `episode_id` |
| `episode_favorites` | Favoritos em episódios | `user_id`, `episode_id` |

### Enums

| Enum | Valores |
|---|---|
| `app_role` | `admin`, `user` |
| `transaction_type` | `credit`, `debit` |
| `transaction_reason` | `purchase`, `episode_unlock`, `series_unlock`, `admin_adjust` |

### Funções de Banco de Dados

| Função | Descrição |
|---|---|
| `has_role(_role, _user_id)` | Verifica se um usuário possui determinado papel — usada nas RLS policies |

---

## ⚡ Edge Functions

Todas as Edge Functions rodam em **Deno** no Supabase e têm `verify_jwt = false` (autenticação manual via `Authorization` header).

### `unlock-episode` — POST

Desbloqueia um episódio individual ou uma série completa.

**Body:**
```json
{ "episode_id": "uuid" }
// ou
{ "series_id": "uuid" }
```

**Lógica:**
1. Verifica autenticação pelo header `Authorization`
2. Busca o episódio e verifica se já está desbloqueado
3. Verifica saldo na carteira
4. Debita moedas (`wallets.balance`)
5. Registra em `episode_unlocks` ou `series_unlocks`
6. Registra a transação em `transactions`

---

### `buy-coins` — POST

Credita moedas na carteira do usuário.

**Body:**
```json
{ "package_id": "uuid" }
// ou (admin)
{ "user_id": "uuid", "coins": 100, "reason": "admin_adjust" }
```

**Lógica:**
1. Valida autenticação
2. Busca o pacote em `coin_packages`
3. Incrementa `wallets.balance`
4. Registra transação de `credit` em `transactions`

---

### `admin-manage-user` — POST

CRUD completo de usuários via Supabase Admin API. **Acesso restrito a admins.**

**Operações suportadas:**
```json
{ "action": "create", "email": "...", "password": "...", "display_name": "..." }
{ "action": "update", "user_id": "...", "display_name": "...", "role": "admin" }
{ "action": "delete", "user_id": "..." }
{ "action": "adjust_wallet", "user_id": "...", "coins": 50 }
```

---

### `stripe-webhook` — POST

Recebe e processa eventos do Stripe.

**Eventos tratados:**
- `checkout.session.completed` — confirma pagamento e credita moedas

**Configuração necessária:**
- Secret `STRIPE_WEBHOOK_SECRET` nas variáveis da Edge Function
- Webhook no Stripe Dashboard apontando para: `https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/stripe-webhook`

---

### `generate-covers` — POST

Utilitário para geração ou processamento de imagens de capa de séries.

---

## 🗺️ Rotas da Aplicação

### Públicas (sem login)

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `Index.tsx` | Home: Hero Slider, Continue Assistindo, Em Alta, categorias |
| `/reels` | `ReelsFeed.tsx` | Feed de Reels vertical estilo TikTok |
| `/fan-club` | `FanClub.tsx` | Página do Fan Club |
| `/brand` | `Brand.tsx` | Página de marca/sobre |
| `/search` | `Search.tsx` | Busca de séries com filtro por categoria |
| `/series/:id` | `SeriesDetail.tsx` | Detalhe da série: sinopse, episódios, botão Retomar |
| `/watch/:episodeId` | `EpisodePlayer.tsx` | Player de episódio (acesso validado internamente) |
| `/auth` | `Auth.tsx` | Login, cadastro, recuperação e redefinição de senha |

### Protegidas (requer login — `ProtectedRoute`)

| Rota | Componente | Descrição |
|---|---|---|
| `/me` | `Profile.tsx` | Perfil, avatar, auto-unlock, Continue Assistindo |
| `/wallet` | `CoinStore.tsx` | Loja de moedas e histórico de compras |
| `/purchases` | `Purchases.tsx` | Histórico completo de transações |

### Admin (requer papel `admin` — `AdminRoute`)

| Rota | Componente | Descrição |
|---|---|---|
| `/admin` | `Dashboard.tsx` | Métricas, gráficos, KPIs |
| `/admin/categories` | `CategoryManager.tsx` | CRUD de categorias |
| `/admin/series` | `SeriesManager.tsx` | Lista de séries |
| `/admin/series/new` | `SeriesForm.tsx` | Criar nova série |
| `/admin/series/:id/edit` | `SeriesForm.tsx` | Editar série existente |
| `/admin/episodes` | `EpisodeManager.tsx` | Lista de episódios |
| `/admin/episodes/new` | `EpisodeForm.tsx` | Criar novo episódio |
| `/admin/episodes/:id/edit` | `EpisodeForm.tsx` | Editar episódio existente |
| `/admin/users` | `UserManager.tsx` | Gerenciar usuários e papéis |
| `/admin/packages` | `CoinPackageManager.tsx` | Gerenciar pacotes de moedas |
| `/admin/banners` | `BannerManager.tsx` | Gerenciar banners do Hero Slider |

---

## 🧩 Componentes e Módulos Principais

### Hooks

| Hook | Arquivo | Responsabilidade |
|---|---|---|
| `useAuth` | `hooks/useAuth.tsx` | Contexto global de autenticação, perfil, papel e ações |
| `useRequireAuth` | `hooks/useAuth.tsx` | Redireciona para `/auth` se não autenticado |
| `useEpisodePlayer` | `hooks/useEpisodePlayer.ts` | Estado do player: progresso, unlock, auto-unlock, next ep |
| `useEpisodeSocial` | `hooks/useEpisodeSocial.ts` | Likes, favoritos, compartilhamento |
| `useMobile` | `hooks/use-mobile.tsx` | Detecta viewport mobile (`< 768px`) |

### Serviços

| Serviço | Arquivo | Responsabilidade |
|---|---|---|
| `canAccessEpisode` | `lib/unlockService.ts` | Verifica se usuário pode acessar episódio (is_free, free_episodes, unlocks) |
| `unlockEpisode` | `lib/unlockService.ts` | Chama Edge Function `unlock-episode` para ep. individual |
| `unlockSeries` | `lib/unlockService.ts` | Chama Edge Function `unlock-episode` para série completa |

### Componentes de Layout

| Componente | Responsabilidade |
|---|---|
| `Navbar` | Barra de navegação superior com logo, busca e perfil |
| `BottomNav` | Navegação inferior mobile com 5 ícones |
| `AdminLayout` | Layout do admin: sidebar desktop + drawer mobile |
| `AdminBreadcrumb` | Breadcrumb contextual nas páginas admin |

### Componentes de Conteúdo

| Componente | Responsabilidade |
|---|---|
| `HeroSlider` | Slider de banners com autoplay e navegação |
| `HeroBanner` | Card individual do slider |
| `HorizontalCarousel` | Carrossel horizontal de cards por categoria |
| `CategoryRow` | Linha de uma categoria com título e carrossel |
| `SeriesCard` | Card de série com capa, título e indicador de progresso |
| `ReelCard` | Card de episódio no feed de Reels |
| `PaywallModal` | Modal de desbloqueio com opções ep./série |

### Proteção de Rotas

| Componente | Lógica |
|---|---|
| `ProtectedRoute` | Aguarda `loading`, redireciona para `/auth` se sem `user` |
| `AdminRoute` | Aguarda `loading` e `adminChecked`, redireciona por papel |

---

## 🖥️ Painel Administrativo

### Dashboard (`/admin`)

- **Métricas totais:** Views, Usuários ativos, Séries, Episódios, Moedas vendidas
- **Taxa de retenção:** Cálculo baseado em usuários com progresso vs. total
- **Top séries retomadas:** Ranking por `user_progress`
- **Vendas por tipo:** Distribuição entre `episode_unlock` e `series_unlock`
- **Gráfico de views por série:** Barras horizontais com Recharts

### Gerenciamento de Conteúdo

- **Categorias:** Criar, editar e excluir categorias com slug automático
- **Séries:** CRUD completo com upload de capa para Supabase Storage, definição de `free_episodes`, publicação
- **Episódios:** CRUD com upload de vídeo ou YouTube URL, número do episódio, preço em moedas, toggle gratuito

### Gerenciamento de Usuários

- Listar todos os usuários com papel e saldo
- Criar novo usuário (via Edge Function com Admin API)
- Editar nome e papel (`user` / `admin`)
- Excluir usuário
- Ajustar saldo da carteira manualmente

### Configurações

- **Pacotes de moedas:** Título, quantidade de moedas, preço em centavos, `stripe_price_id`, ativo/inativo
- **Banners:** Título, subtítulo, imagem, link para série, ordem de exibição, ativo/inativo

---

## ⚙️ Configurações para Produção

### 1. Google OAuth

**No Google Cloud Console:**

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Vá em **APIs & Services → OAuth consent screen**
   - Tipo: **External**
   - Authorized domains: `pnuydoujbrpfhohsxndz.supabase.co`
   - Scopes: `email`, `profile`, `openid`
4. Vá em **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - **Authorized JavaScript origins:**
     ```
     https://seu-dominio.com
     https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app
     ```
   - **Authorized redirect URIs:**
     ```
     https://pnuydoujbrpfhohsxndz.supabase.co/auth/v1/callback
     ```
5. Copie o **Client ID** e **Client Secret**

**No Supabase Dashboard:**

1. **Authentication → Providers → Google**
   - Ative o toggle
   - Cole Client ID e Client Secret
2. **Authentication → URL Configuration**
   - Site URL: `https://seu-dominio.com`
   - Redirect URLs:
     ```
     https://seu-dominio.com
     https://seu-dominio.com/**
     https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app
     https://id-preview--06cee25c-9e0d-4e4c-adc2-3b80eee530c2.lovable.app/**
     ```

---

### 2. Stripe

1. Crie produtos e preços no [Stripe Dashboard](https://dashboard.stripe.com)
2. Copie os `price_id` e atualize os registros em `coin_packages.stripe_price_id`
3. Configure o webhook no Stripe apontando para:
   ```
   https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/stripe-webhook
   ```
4. Adicione o secret nas Edge Functions do Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

### 3. Domínio Personalizado

Para conectar um domínio no Lovable:

1. No painel Lovable → **Project → Settings → Domains → Connect Domain**
2. Configure no seu provedor DNS:
   - **Registro A:** `185.158.133.1`
   - **Registro TXT:** conforme instrução da verificação do Lovable

---

### 4. Supabase Storage (Buckets necessários)

| Bucket | Uso |
|---|---|
| `covers` | Imagens de capa das séries |
| `videos` | Arquivos de vídeo dos episódios |
| `banners` | Imagens dos banners do Hero Slider |
| `avatars` | Fotos de perfil dos usuários |

---

## 💻 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Supabase (projeto já configurado)

### Instalação

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>

# 2. Entre na pasta do projeto
cd epsodiox

# 3. Instale as dependências
npm install
# ou
bun install

# 4. Inicie o servidor de desenvolvimento
npm run dev
# ou
bun run dev
```

O app estará disponível em `http://localhost:8080`

---

## 🔑 Variáveis de Ambiente

As variáveis de ambiente são auto-populadas pelo Lovable e salvas no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://pnuydoujbrpfhohsxndz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=pnuydoujbrpfhohsxndz
```

> ⚠️ **Nunca** exponha a `service_role` key no frontend. Use apenas a `anon` (publishable) key no cliente.

Para as Edge Functions (configurar no Supabase Dashboard → Edge Functions → Secrets):

```
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento na porta 8080 |
| `npm run build` | Gera o build de produção em `/dist` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Executa o ESLint em todos os arquivos |
| `npm run test` | Executa os testes com Vitest (modo CI) |
| `npm run test:watch` | Executa testes em modo watch interativo |

---

## 📁 Estrutura de Arquivos

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Componentes shadcn/ui (Radix)
│   ├── AdminBreadcrumb.tsx
│   ├── AdminRoute.tsx   # Guard de rota admin
│   ├── BottomNav.tsx    # Navegação mobile inferior
│   ├── CategoryRow.tsx  # Linha de categoria com carrossel
│   ├── HeroBanner.tsx   # Card do banner hero
│   ├── HeroSlider.tsx   # Slider de banners
│   ├── HorizontalCarousel.tsx
│   ├── Navbar.tsx
│   ├── PaywallModal.tsx # Modal de desbloqueio
│   ├── ProtectedRoute.tsx
│   ├── ReelCard.tsx
│   └── SeriesCard.tsx
├── hooks/
│   ├── useAuth.tsx      # Contexto de autenticação global
│   ├── useEpisodePlayer.ts
│   └── useEpisodeSocial.ts
├── integrations/
│   └── supabase/
│       ├── client.ts    # Cliente Supabase configurado
│       └── types.ts     # Tipos gerados automaticamente
├── lib/
│   ├── unlockService.ts # Serviço de desbloqueio de conteúdo
│   └── utils.ts
├── pages/
│   ├── admin/           # Páginas do painel administrativo
│   ├── Auth.tsx
│   ├── CoinStore.tsx
│   ├── EpisodePlayer.tsx
│   ├── FanClub.tsx
│   ├── Index.tsx        # Home
│   ├── Profile.tsx
│   ├── Purchases.tsx
│   ├── ReelsFeed.tsx
│   ├── Search.tsx
│   └── SeriesDetail.tsx
└── App.tsx              # Roteamento principal

supabase/
├── functions/           # Edge Functions (Deno)
│   ├── admin-manage-user/
│   ├── buy-coins/
│   ├── generate-covers/
│   ├── stripe-webhook/
│   └── unlock-episode/
└── migrations/          # Histórico de migrações SQL
```

---

## 🔒 Segurança

- **RLS (Row-Level Security)** ativa em todas as tabelas com dados de usuário
- **Edge Functions** com verificação manual de JWT para operações sensíveis
- **AdminRoute** com dupla verificação: `user` autenticado + papel `admin` na tabela `user_roles`
- **Saldo negativo** impedido na Edge Function `unlock-episode` antes de qualquer débito
- **Admin API** do Supabase usada exclusivamente via Edge Function, nunca exposta ao cliente

---

## 📄 Licença

Todos os direitos reservados © Epsodiox 2025.
