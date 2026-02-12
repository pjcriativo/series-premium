

# Navegacao Admin: Links para voltar ao painel e acessar o site

## O que muda

Duas melhorias na navegacao do painel admin:

1. **Link "Ver Site"** no menu lateral do admin - abre a pagina inicial (`/`) sem precisar fazer logout
2. **Botao "Voltar ao Admin"** na pagina de perfil (`/me`) - visivel apenas para admins, permite retornar ao painel rapidamente

## Mudancas

### 1. AdminLayout.tsx - Adicionar link "Ver Site"

Adicionar um item no menu lateral (abaixo dos itens existentes ou como link separado proximo ao botao "Sair") com icone `ExternalLink` ou `Globe` apontando para `/`, permitindo ao admin visitar o site principal.

### 2. Profile.tsx - Adicionar botao "Voltar ao Admin"

Como o componente ja tem acesso ao `isAdmin` via `useAuth()`, basta adicionar um botao/link condicional no topo da pagina que aparece apenas para admins, redirecionando para `/admin`.

## Detalhes Tecnicos

### AdminLayout.tsx
- Adicionar `{ to: "/", icon: Globe, label: "Ver Site" }` na lista `navItems` (ou como link separado para diferenciar visualmente)
- Importar icone `Globe` do lucide-react

### Profile.tsx
- Adicionar um `Link` para `/admin` com icone `ShieldCheck` (ja importado) no topo da pagina, renderizado condicionalmente com `{isAdmin && ...}`
- Texto: "Voltar ao Painel Admin"

| Arquivo | Acao |
|---------|------|
| `src/pages/admin/AdminLayout.tsx` | Adicionar link "Ver Site" no menu |
| `src/pages/Profile.tsx` | Adicionar botao "Voltar ao Admin" para admins |

