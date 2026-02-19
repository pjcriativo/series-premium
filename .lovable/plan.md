
# Animação de Transição ao Navegar entre Episódios no Player

## Contexto atual

Ao clicar em outro episódio na grade (ou no botão "Próximo Episódio"), o `navigate(`/watch/${ep.id}`)` é chamado diretamente, causando uma troca abrupta e sem transição visual.

O projeto usa `tailwindcss-animate` (já instalado) e possui keyframes de `accordion-down/up`, mas não possui keyframes de fade/scale para o player.

---

## Solução: Fade-out → navigate → Fade-in

A estratégia é:
1. Ao clicar em outro episódio, em vez de navegar imediatamente, disparar um **fade-out** no container do player
2. Após a animação terminar (~300ms), executar o `navigate()`
3. Ao montar o novo episódio, o container faz **fade-in** automaticamente via CSS

Isso é feito puramente com React state + CSS Tailwind, sem nenhuma biblioteca extra.

---

## Mudanças planejadas

### 1. `tailwind.config.ts` — Adicionar keyframes de fade

Adicionar os keyframes `fade-in` e `fade-out` com translateY sutil (como nos exemplos da documentação do projeto):

```ts
keyframes: {
  // existentes...
  "fade-in": {
    "0%": { opacity: "0", transform: "translateY(8px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "fade-out": {
    "0%": { opacity: "1", transform: "translateY(0)" },
    "100%": { opacity: "0", transform: "translateY(-8px)" },
  },
},
animation: {
  // existentes...
  "fade-in": "fade-in 0.25s ease-out",
  "fade-out": "fade-out 0.2s ease-in forwards",
},
```

### 2. `src/pages/EpisodePlayer.tsx` — Adicionar estado de transição e animação

**a) Novo estado `isTransitioning`:**

```tsx
const [isTransitioning, setIsTransitioning] = useState(false);
```

**b) Função `navigateWithTransition` — substitui chamadas diretas de `navigate`:**

```tsx
const navigateWithTransition = useCallback((path: string) => {
  setIsTransitioning(true);
  setTimeout(() => {
    navigate(path);
  }, 200); // duração do fade-out
}, [navigate]);
```

**c) Aplicar classe de animação no container principal do player:**

```tsx
// `<main>` recebe a classe de animação condicional
<main className={cn(
  "pt-16 px-4 lg:px-8 pb-20 md:pb-8",
  isTransitioning ? "animate-fade-out" : "animate-fade-in"
)}>
```

**d) Substituir os 3 pontos onde `navigate` é chamado para trocar episódio:**

| Localização | Chamada atual | Nova chamada |
|---|---|---|
| Grade de episódios (botão numérico) | `navigate(\`/watch/${ep.id}\`)` | `navigateWithTransition(\`/watch/${ep.id}\`)` |
| Botão "Próximo Episódio" (end screen) | dentro de `handleNext` no hook | Expor callback ou tratar no componente |
| PaywallModal `onNavigateToWatch` | `navigate(\`/watch/${epId}\`)` | `navigateWithTransition(\`/watch/${epId}\`)` |

Para o `handleNext` (que vive no hook `useEpisodePlayer`), a abordagem mais limpa é **não alterar o hook** e sim sobrescrever o comportamento no componente, usando o `navigateWithTransition` diretamente nas chamadas de `onClick` da tela de fim de episódio:

```tsx
// End screen - "Próximo Episódio"
<Button onClick={() => {
  if (isNextAccessible) {
    navigateWithTransition(`/watch/${nextEpisode.id}`);
  } else {
    handleNext(); // para auto-unlock, mantém lógica do hook
  }
}} ...>
```

---

## Resultado visual

```text
[Clique no episódio 4]
      ↓
Container faz fade-out para baixo (200ms)
      ↓
navigate('/watch/episodio-4-id') é chamado
      ↓
Componente remonta → fade-in de cima para baixo (250ms)
```

A transição é suave, sem flash de tela branca.

---

## Resumo das mudanças

| Arquivo | Alteração |
|---|---|
| `tailwind.config.ts` | Adicionar keyframes `fade-in` / `fade-out` e suas animações |
| `src/pages/EpisodePlayer.tsx` | Estado `isTransitioning`, função `navigateWithTransition`, classe condicional no `<main>`, atualizar pontos de navegação entre episódios |

## O que NÃO será alterado
- Hook `useEpisodePlayer` (nenhuma mudança de lógica)
- Layout, grid de episódios, paywall
- Navegação para a página da série (botão "Todos os episódios" — não precisa de transição)
- Lógica de auto-unlock
