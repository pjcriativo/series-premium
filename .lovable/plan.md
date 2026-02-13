
# Adicionar Navbar com Menu e Hover Card no Perfil

## O Que Sera Feito

Replicar a navbar do ReelShort original com:

1. **Menu de navegacao horizontal** no topo: Logo, Inicio, Categorias, etc.
2. **Hover card no avatar/perfil** que mostra um mini painel ao passar o mouse, com:
   - Avatar + nome ("Convidado" ou email do usuario)
   - Botao "Login" (se nao logado)
   - Saldo de moedas e bonus
   - Botao "Completar" (link para loja de moedas)
   - Funciona tanto para visitantes nao logados quanto para usuarios logados

## Detalhes da Implementacao

### Navbar Redesenhada

A navbar atual e minimalista (logo + icones). Sera expandida para incluir links de navegacao como no site original:

- **Logo** ReelShort (esquerda)
- **Links**: Inicio, Categorias (links de navegacao)
- **Direita**: Icone de busca, avatar com hover card

### Hover Card do Perfil

Usando o componente `HoverCard` do Radix (ja instalado no projeto), ao passar o mouse sobre o avatar:

**Se nao logado:**
- Avatar generico + "Convidado"
- Botao "Login" ao lado
- Moedas: 0 | Bonus: 0
- Botao vermelho "Completar" (redireciona para /auth)

**Se logado:**
- Avatar com inicial + email/nome
- Moedas: saldo real da carteira
- Bonus: 0 (placeholder)
- Botao vermelho "Completar" (redireciona para /wallet)

### Mobile

No mobile, a navbar mantem o formato atual compacto (logo + icones) pois a navegacao principal e feita pelo BottomNav. O hover card nao aparece no mobile (hover nao existe em touch).

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/Navbar.tsx` | Redesenho completo: adicionar links de navegacao + HoverCard no avatar com saldo de moedas |

## Detalhes Tecnicos

### Estrutura da Navbar

```
<nav>
  <!-- Esquerda: Logo + Links (hidden no mobile) -->
  <div>
    <Link to="/">ReelShort</Link>
    <Link to="/">Inicio</Link>
    <Link to="/search">Categorias</Link>
  </div>

  <!-- Direita: Busca + Avatar com HoverCard -->
  <div>
    <SearchIcon />
    <HoverCard>
      <HoverCardTrigger>
        <Avatar /> <!-- sempre visivel, logado ou nao -->
      </HoverCardTrigger>
      <HoverCardContent>
        <!-- Mini painel com saldo e acoes -->
      </HoverCardContent>
    </HoverCard>
  </div>
</nav>
```

### HoverCard Content

```
+----------------------------------+
| [Avatar]  Convidado    [Login]   |
|           UID xxx               |
|                                  |
|   🪙 0          🪙 0            |
|   Moedas        Bonus           |
|                                  |
|   [=== Completar ===]           |
+----------------------------------+
```

O componente `HoverCard` do Radix ja esta disponivel em `src/components/ui/hover-card.tsx`. O avatar sera sempre renderizado (mesmo sem login), servindo como trigger do hover card.
