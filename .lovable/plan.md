
# Corrigir Sobreposição da Navbar sobre o Vídeo no Player

## Diagnóstico do problema

A Navbar possui uma logo com `h-[150px]` (150px de altura), o que torna a barra de navegação muito mais alta do que os `pt-16` (64px) aplicados no `<main>` do player. O resultado é que a navbar flutua sobre o vídeo em vez de ficar acima dele.

Há dois pontos a corrigir:

1. **Navbar muito alta** — A logo de 150px é desproporcional para uma barra de navegação fixa. Reduzir para um tamanho adequado (~40-48px) em todas as páginas.
2. **Padding-top insuficiente no player** — O `pt-16` (64px) não acompanha a altura real da navbar.

---

## Estratégia: Corrigir a altura da logo na Navbar

A abordagem mais limpa e que beneficia todo o app é **reduzir a logo para um tamanho adequado** na Navbar, mantendo a barra proporcional. Uma navbar padrão tem entre 56–72px de altura total. Isso resolve o problema para todas as páginas ao mesmo tempo.

### Mudança 1 — `src/components/Navbar.tsx`

Alterar a classe da logo de `h-[150px]` para `h-10` (40px), que é proporcional para navbars:

```tsx
// Antes:
<img src={logo} alt="Epsodiox" className="h-[150px] w-auto" />

// Depois:
<img src={logo} alt="Epsodiox" className="h-10 w-auto" />
```

Isso faz a navbar ficar com ~64-72px de altura total (logo 40px + padding vertical `py-4` = 16px × 2 = 64px total), que é a altura padrão compatível com `pt-16`.

### Mudança 2 — Ajustar padding do player para garantia extra

Como segurança adicional, no `EpisodePlayer.tsx` atualizar o padding-top do `<main>` e do skeleton de carregamento para `pt-20` ao invés de `pt-16`, garantindo uma margem confortável mesmo se a navbar mudar de tamanho no futuro:

```tsx
// Antes (linha 85):
<main className={cn("pt-16 px-4 lg:px-8 pb-20 md:pb-8", ...)}>

// Depois:
<main className={cn("pt-20 px-4 lg:px-8 pb-20 md:pb-8", ...)}>

// Também na linha 48 (estado de loading):
<main className="pt-20 px-4 lg:px-8">
```

---

## Resultado visual esperado

```text
ANTES:
┌──────────────────────────────────────────────────┐
│  [Logo 150px]   Início  Categorias  Fã-Clube      │  ← navbar ~182px de altura
│                                                   │
│    [ VÍDEO SENDO COBERTO AQUI ]                  │  ← 64px de pt não é suficiente
└──────────────────────────────────────────────────┘

DEPOIS:
┌──────────────────────────────────────────────────┐
│  [Logo 40px]   Início  Categorias  Fã-Clube       │  ← navbar ~72px de altura
└──────────────────────────────────────────────────┘
│                                                   │
│    [ VÍDEO VISÍVEL COMPLETAMENTE ]               │  ← pt-20 (80px) ≥ 72px navbar
└──────────────────────────────────────────────────┘
```

---

## Resumo das mudanças

| Arquivo | Alteração |
|---|---|
| `src/components/Navbar.tsx` | Logo de `h-[150px]` → `h-10` |
| `src/pages/EpisodePlayer.tsx` | Padding-top do `<main>` de `pt-16` → `pt-20` (no estado normal e no skeleton de loading) |

## O que NÃO será alterado
- Nenhuma lógica de autenticação, paywall ou episódios
- Layout de duas colunas do player
- Animações de transição
- Demais páginas (só a Navbar é compartilhada; o ajuste beneficia todas)
