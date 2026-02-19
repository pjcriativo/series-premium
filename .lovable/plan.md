
# Tornar o Navbar Transparente e Flutuante Sobre o Slider

## Diagnóstico

### Problema 1 — Fundo sólido no navbar
`src/components/Navbar.tsx` linha 27:
```tsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-background/95">
```
O `bg-background/95` cria um fundo escuro sólido separando o menu do slider, gerando a barra visível que o usuário vê. Deve ser `bg-transparent` para que o navbar flutue sobre o conteúdo como uma plataforma de streaming.

### Problema 2 — Espaço negro acima do slider
`src/pages/Index.tsx` linha 173:
```tsx
<main className="flex-1 pb-20 pt-[182px]">
```
O `pt-[182px]` empurra todo o conteúdo (incluindo o slider) para baixo em 182px. Como o navbar é `fixed` (flutua sobre a página), esse padding gera um bloco negro vazio entre o topo e o slider.

A solução correta para o estilo streaming é remover o `pt-[182px]` — o slider vai começar do topo da viewport, e o navbar transparente vai flutuar naturalmente sobre ele, exatamente como Netflix/Prime Video fazem.

---

## Mudanças planejadas

### 1. `src/components/Navbar.tsx` — Tornar o fundo transparente

Trocar `bg-background/95` por `bg-transparent`:

```tsx
// Antes:
<nav className="fixed top-0 left-0 right-0 z-50 bg-background/95">

// Depois:
<nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
```

O menu permanece `fixed` (fixo no topo, não rola com a página), mas sem fundo visível — flutuará sobre o slider e o conteúdo.

### 2. `src/pages/Index.tsx` — Remover o padding-top do main

Remover o `pt-[182px]` do elemento `<main>`:

```tsx
// Antes:
<main className="flex-1 pb-20 pt-[182px]">

// Depois:
<main className="flex-1 pb-20">
```

Isso faz o slider ocupar o espaço completo desde o topo, com o navbar transparente sobreposto.

---

## Resultado visual esperado

```text
┌─────────────────────────────────────────┐
│ [Logo]  Início  Categorias  Fã-Clube  [Entrar]  ← navbar transparente, fixo
│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  (sem barra, sem fundo)
│                                         │
│       [ IMAGEM DO SLIDER / BANNER ]     │ ← slider começa do topo
│                                         │
│  Título da série                        │
│  [▶ Assistir]                          │
└─────────────────────────────────────────┘
```

---

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `src/components/Navbar.tsx` | `bg-background/95` → `bg-transparent` |
| `src/pages/Index.tsx` | Remover `pt-[182px]` do `<main>` |

## O que NÃO será alterado

- Tamanho da logo (mantém `h-[150px]`)
- Posicionamento `fixed` do navbar (continua fixo, não rola)
- Todos os gradientes do slider (inferior, esquerda, direita)
- Links e botões do navbar
