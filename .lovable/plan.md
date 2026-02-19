
# Correção do Navbar: Restaurar Itens Originais + Logo Maior

## Problemas identificados

### 1. Itens do menu foram trocados incorretamente
O plano anterior substituiu os itens originais do menu por novos. Os itens corretos (conforme o histórico da plataforma) eram:

| Item | Rota |
|---|---|
| Início | `/` |
| Categorias | `/search` |
| Fã-Clube | `/fan-club` |
| Marca | `/brand` |

O que foi colocado erroneamente: Início, Em Alta, Buscar.

### 2. Logo ainda pequena
A logo tem fundo branco e o arquivo é horizontal (ícone + texto). Em `h-12` (48px) fica visualmente pequena no navbar escuro. Será aumentada para `h-16` (64px).

---

## Mudanças em `src/components/Navbar.tsx`

### Logo: `h-12` → `h-16`
```tsx
// De:
<img src={logo} alt="Epsodiox" className="h-12 w-auto" />
// Para:
<img src={logo} alt="Epsodiox" className="h-16 w-auto" />
```

### Itens do menu: restaurar os 4 originais
```tsx
// Remover imports desnecessários (Home, TrendingUp, Search)
// Restaurar os 4 links originais:

<Link to="/" className="flex items-center gap-1.5 text-base font-medium text-primary hover:text-primary/80 transition-colors">
  Início
</Link>
<Link to="/search" className="flex items-center gap-1.5 text-base font-medium text-primary/70 hover:text-primary transition-colors">
  Categorias
</Link>
<Link to="/fan-club" className="flex items-center gap-1.5 text-base font-medium text-primary/70 hover:text-primary transition-colors">
  Fã-Clube
</Link>
<Link to="/brand" className="flex items-center gap-1.5 text-base font-medium text-primary/70 hover:text-primary transition-colors">
  Marca
</Link>
```

---

## Arquivo modificado
- `src/components/Navbar.tsx` — apenas logo maior e itens do menu restaurados, sem nenhuma mudança de lógica ou estilo
