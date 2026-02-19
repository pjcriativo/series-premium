
# Documentação Completa do Epsodiox — Reescrita do README.md

## O que será feito

O arquivo `README.md` atual contém apenas o template genérico do Lovable. Ele será completamente substituído por uma documentação técnica e funcional completa do sistema Epsodiox, cobrindo tudo que foi desenvolvido.

---

## Estrutura da documentação

O README terá as seguintes seções:

1. **Cabeçalho e Badges** — Nome, versão, status
2. **Visão Geral** — O que é o Epsodiox
3. **Funcionalidades desenvolvidas** — Lista detalhada por módulo
4. **Stack tecnológica** — Frontend, Backend, Infraestrutura
5. **Arquitetura do banco de dados** — Todas as tabelas e suas finalidades
6. **Edge Functions** — Cada função, sua responsabilidade e endpoints
7. **Rotas da aplicação** — Todas as rotas públicas, protegidas e admin
8. **Módulos principais** — Descrição de cada hook, serviço e componente chave
9. **Painel Administrativo** — Recursos disponíveis
10. **Configurações necessárias para produção** — Google OAuth, Stripe, Supabase URLs
11. **Como rodar localmente** — Passo a passo
12. **Variáveis de ambiente**
13. **Scripts disponíveis**

---

## Conteúdo detalhado de cada seção

### Versão
`v1.0.0` — baseado no `package.json` onde `"version": "0.0.0"` será documentado como v1.0 (primeira versão funcional completa).

### Funcionalidades desenvolvidas

Com base na leitura completa do código, as seguintes funcionalidades serão documentadas:

**Autenticação**
- Login/Cadastro por email e senha
- Login com Google OAuth (requer configuração externa)
- Recuperação de senha por email
- Redefinição de senha por link
- Proteção de rotas com `ProtectedRoute` e `AdminRoute`
- Hook `useAuth` com contexto global, perfil e papel do usuário
- Hook `useRequireAuth` para redirecionamento automático

**Conteúdo**
- Catálogo de séries com categorias
- Episódios verticais (formato 9:16) compatíveis com vídeo no Storage ou YouTube embed
- Player de vídeo com controles (play/pause, mute, seek, fullscreen)
- Retomada de vídeo no segundo exato (`onLoadedMetadata` seek)
- End screen com próximo episódio
- Tela de Reels (feed vertical estilo TikTok) com scroll snap
- Detalhe da série com lista de episódios e botão "Retomar"

**Monetização**
- Moedas virtuais (sistema de créditos)
- Loja de moedas com pacotes configuráveis pelo admin
- Desbloqueio de episódio individual
- Desbloqueio de série completa (bundle)
- Auto-desbloqueio: opção no perfil para desbloquear automaticamente ao chegar no fim do episódio
- PaywallModal com opção de desbloquear episódio ou série completa
- Prevenção de saldo negativo na carteira

**Social**
- Curtidas e favoritos em episódios (tabelas `episode_likes`, `episode_favorites`)
- Contadores públicos de likes e favoritos
- Botão de compartilhamento nativo (Web Share API)
- Hook `useEpisodeSocial` centraliza toda a lógica social

**Progresso e Histórico**
- Salvamento automático do progresso a cada 5 segundos e no unmount
- Seção "Continue Assistindo" na Home com link direto ao episódio correto
- Seção "Continue Assistindo" no Perfil
- Histórico de transações com tipo e data relativa

**Busca**
- Busca por título de série em tempo real (client-side)
- Filtragem por categoria

**Painel Administrativo**
- Dashboard com métricas: views totais, usuários, séries, episódios, moedas compradas, retenção, top séries retomadas, vendas por tipo
- Gráfico de barras horizontais (Recharts) de views por série
- Gerenciamento de Categorias (CRUD)
- Gerenciamento de Séries (CRUD com upload de capa)
- Gerenciamento de Episódios (CRUD com upload de vídeo ou YouTube URL)
- Gerenciamento de Usuários (criar, editar, excluir, promover a admin)
- Ajuste manual de saldo da carteira por admin
- Gerenciamento de Pacotes de Moedas
- Gerenciamento de Banners do Hero Slider
- Layout responsivo: sidebar fixa no desktop, drawer (Sheet) no mobile

**UX e Interface**
- Dark mode padrão
- Animações `fade-in` / `fade-out` entre páginas do player
- Hero Slider com banners configuráveis e autoplay (Embla Carousel)
- Carrossel horizontal por categoria (HorizontalCarousel)
- Seção "Em Alta" com trending das últimas 7 dias
- Ícone Play visível nos cards de "Continue Assistindo"
- Bottom Navigation para mobile
- Breadcrumbs no player e no admin
- Skeleton loading states em todas as páginas

### Stack tecnológica

**Frontend**
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Tipagem estática |
| Vite | 5.4.19 | Build tool |
| Tailwind CSS | 3.4.17 | Estilização |
| shadcn/ui + Radix UI | — | Componentes acessíveis |
| TanStack Query | 5.83.0 | Gerenciamento de estado/cache |
| React Router DOM | 6.30.1 | Roteamento SPA |
| React Hook Form + Zod | 7.61.1 + 3.x | Formulários e validação |
| Embla Carousel | 8.6.0 | Carrosséis |
| Recharts | 2.15.4 | Gráficos do dashboard |
| date-fns | 3.6.0 | Formatação de datas |
| lucide-react | 0.462.0 | Ícones |
| Sonner | 1.7.4 | Toast notifications |

**Backend / Infraestrutura**
| Tecnologia | Uso |
|---|---|
| Supabase (PostgreSQL) | Banco de dados relacional |
| Supabase Auth | Autenticação (email + Google OAuth) |
| Supabase Storage | Armazenamento de vídeos e capas |
| Supabase Edge Functions (Deno) | Lógica de negócio segura no servidor |
| Row-Level Security (RLS) | Controle de acesso por usuário |
| Stripe (integrado) | Processamento de pagamentos (webhook configurado) |

### Banco de dados (tabelas)

| Tabela | Finalidade |
|---|---|
| `profiles` | Dados públicos do usuário (nome, avatar, auto_unlock) |
| `user_roles` | Papéis: `user` e `admin` |
| `wallets` | Saldo de moedas por usuário |
| `transactions` | Histórico de créditos e débitos |
| `categories` | Categorias de séries |
| `series` | Séries com título, sinopse, capa, categoria, free_episodes |
| `episodes` | Episódios com video_url ou youtube_url, price_coins |
| `episode_unlocks` | Desbloqueios individuais de episódio |
| `series_unlocks` | Desbloqueios de série completa |
| `user_progress` | Progresso por série: último episódio e posição em segundos |
| `views` | Registro de visualizações (analytics) |
| `coin_packages` | Pacotes de moedas disponíveis na loja |
| `banners` | Banners do hero slider (título, imagem, link para série) |
| `episode_likes` | Curtidas em episódios |
| `episode_favorites` | Favoritos em episódios |

### Edge Functions

| Função | Método | Descrição |
|---|---|---|
| `unlock-episode` | POST | Desbloqueia episódio ou série completa, debita moedas, registra transação |
| `buy-coins` | POST | Compra pacote de moedas (crédito) ou ajuste admin de saldo |
| `admin-manage-user` | POST | CRUD de usuários via Supabase Admin API (apenas admins) |
| `stripe-webhook` | POST | Recebe eventos do Stripe para confirmar pagamentos |
| `generate-covers` | POST | Utilitário para geração de capas |

### Rotas da aplicação

**Públicas**
- `/` — Home (Hero Slider, Continue Assistindo, Em Alta, categorias)
- `/reels` — Feed de Reels estilo TikTok
- `/fan-club` — Página Fan Club
- `/brand` — Página de marca
- `/search` — Busca de séries
- `/series/:id` — Detalhe de série com lista de episódios
- `/watch/:episodeId` — Player de episódio (acesso verificado no servidor)
- `/auth` — Login, cadastro, recuperação e redefinição de senha

**Protegidas (requer login)**
- `/me` — Perfil do usuário
- `/wallet` — Loja de moedas
- `/purchases` — Histórico de compras

**Admin (requer papel `admin`)**
- `/admin` — Dashboard com métricas
- `/admin/categories` — Categorias
- `/admin/series` — Séries
- `/admin/series/new` — Nova série
- `/admin/series/:id/edit` — Editar série
- `/admin/episodes` — Episódios
- `/admin/episodes/new` — Novo episódio
- `/admin/episodes/:id/edit` — Editar episódio
- `/admin/users` — Usuários
- `/admin/packages` — Pacotes de moedas
- `/admin/banners` — Banners

### Configurações necessárias para produção

**Google OAuth**
1. Google Cloud Console → criar OAuth Client ID (Web Application)
2. Authorized JavaScript origins: URL do site
3. Authorized redirect URIs: `https://<PROJECT_ID>.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → colar Client ID e Secret
5. Supabase Dashboard → Authentication → URL Configuration → Site URL e Redirect URLs

**Stripe**
- Criar produto e preço no Stripe Dashboard
- Configurar webhook apontando para a Edge Function `stripe-webhook`
- Adicionar secret `STRIPE_WEBHOOK_SECRET` nas Edge Function secrets

**Domínio Personalizado**
- Registro A: `185.158.133.1`
- Registro TXT de verificação

### Como rodar localmente

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
npm install
npm run dev
```

### Variáveis de ambiente

O `.env` é auto-populado pelo Lovable com:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Linting com ESLint |
| `npm run test` | Testes com Vitest |
| `npm run test:watch` | Testes em modo watch |

---

## Arquivo a ser modificado

| Arquivo | Ação |
|---|---|
| `README.md` | Substituição completa do conteúdo |

## O que NÃO será alterado
- Nenhum arquivo de código fonte
- Nenhuma configuração do projeto
- Nenhuma migração de banco de dados
