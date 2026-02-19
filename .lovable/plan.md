
# Ajuste Visual do Navbar — Tamanho da Logo e Itens do Menu

## O que está errado atualmente
- Logo: `h-8` (32px) — muito pequena
- Links do menu: `text-sm` sem ícones, gap pequeno
- Botão direito: apenas avatar/ícone, sem destaque visual

## O que a imagem de referência mostra
- Logo: **significativamente maior** — ícone de play colorido + texto "Epsodiox" em branco, aproximadamente `h-12` (48px)
- Menu central: ícones + texto lado a lado, fonte maior, mais espaçamento entre itens
- Itens visíveis: "Início" (ícone casa), "Em Alta" (ícone trending), "Buscar" (ícone lupa) — com cor roxa para o texto
- Botão direito: **"Entrar"** em destaque com gradiente roxo/laranja (similar ao botão primário)
- Navbar com fundo escuro semitransparente mais pronunciado

## Mudanças planejadas em `src/components/Navbar.tsx`

### 1. Logo maior
```tsx
// De:
<img src={logo} alt="Epsodiox" className="h-8 w-auto" />
// Para:
<img src={logo} alt="Epsodiox" className="h-12 w-auto" />
```

### 2. Nav links com ícones e texto maior
Adicionar ícones (Home, TrendingUp, Search) junto ao texto, aumentar fonte e espaçamento:
```tsx
import { Home, TrendingUp, Search as SearchIcon, Coins, User } from "lucide-react";

// Links com ícone + label, text-base, gap-6
<Link to="/" className="flex items-center gap-1.5 text-base font-medium text-primary">
  <Home className="h-4 w-4" /> Início
</Link>
<Link to="/search" className="flex items-center gap-1.5 text-base font-medium text-primary/80 hover:text-primary">
  <TrendingUp className="h-4 w-4" /> Em Alta
</Link>
<Link to="/search" className="flex items-center gap-1.5 text-base font-medium text-primary/80 hover:text-primary">
  <SearchIcon className="h-4 w-4" /> Buscar
</Link>
```

### 3. Botão "Entrar" em destaque (quando não logado)
```tsx
// Substituir o avatar/HoverCard por um botão destacado quando não autenticado
{!user ? (
  <Link to="/auth">
    <Button className="bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold px-6 h-10 rounded-full">
      Entrar
    </Button>
  </Link>
) : (
  // HoverCard existente com avatar
)}
```

### 4. Padding vertical da navbar maior
```tsx
// De py-3 para py-4 para dar mais altura à barra
<div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
```

### 5. Fundo da navbar com mais visibilidade
```tsx
// De bg-transparent para um fundo mais pronunciado
<nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm">
```

## Arquivo modificado
- `src/components/Navbar.tsx` — apenas ajustes de tamanho, ícones e estilo visual, sem mudança de lógica
