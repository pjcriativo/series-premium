
# Adicionar Botão "Sair" no HoverCard do Perfil (Navbar)

## Problema

O HoverCard do avatar na Navbar (desktop) exibe nome, saldo de moedas, botão "Completar" e "Painel Admin" para admins — mas **não tem opção de Sair**. O usuário precisa de uma forma de fazer logout diretamente por esse menu.

## Solução

Adicionar um botão "Sair" com ícone `LogOut` ao final do HoverCard, logo abaixo do botão "Painel Admin" (ou abaixo de "Completar" para não-admins).

## Mudança Técnica

### Arquivo: `src/components/Navbar.tsx`

**1. Adicionar import de `LogOut` ao lucide-react** (já importa `Coins` e `ShieldCheck`):
```typescript
import { Coins, ShieldCheck, LogOut } from "lucide-react";
```

**2. Obter a função `signOut` do hook `useAuth`** (já desestrutura `user`, `profile`, `isAdmin`):
```typescript
const { user, profile, isAdmin, signOut } = useAuth();
```

**3. Adicionar o botão "Sair" no HoverCard, após o bloco do Painel Admin:**
```tsx
<button
  onClick={signOut}
  className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
>
  <LogOut className="h-4 w-4" />
  Sair
</button>
```

## Resultado Visual

```
┌─────────────────────────────┐
│ [M] Marcos Gonçalves        │
│      UID 8d7a5411...        │
├─────────────────────────────┤
│  🪙 100 Moedas  🪙 0 Bônus  │
├─────────────────────────────┤
│  [    Completar           ] │
│  [🛡  Painel Admin        ] │  ← só para admins
│  [↩  Sair                ] │  ← NOVO
└─────────────────────────────┘
```

## Arquivo Alterado

Apenas **`src/components/Navbar.tsx`**:
- Adicionar `LogOut` ao import do `lucide-react`
- Adicionar `signOut` ao destructuring do `useAuth()`
- Adicionar botão "Sair" ao final do `HoverCardContent`

Nenhuma alteração de banco de dados necessária.
