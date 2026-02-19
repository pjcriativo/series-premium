
# Combobox com Busca de Séries no Formulário de Episódio

## Objetivo

Substituir o `<Select>` simples de séries no formulário de episódio por um **Combobox** — um campo que combina input de texto com lista filtrada — permitindo ao admin digitar o nome da série para localizá-la rapidamente, sem precisar rolar por uma lista longa.

## Como Funciona o Combobox

O projeto já possui os componentes `Command` e `Popover` instalados (via `cmdk` e `@radix-ui/react-popover`). O padrão Combobox do shadcn/ui combina esses dois:

```
[Botão trigger com nome da série selecionada ▼]
    ↓ abre
┌─────────────────────────────┐
│ 🔍 Buscar série...          │
├─────────────────────────────┤
│ Amor em Chamas              │
│ Confusões em Família        │
│ O Livro de Enoque      ✓   │
│ Sombras do Passado          │
└─────────────────────────────┘
```

- Digitar filtra a lista em tempo real (client-side, já está tudo carregado)
- Clicar em um item seleciona a série e fecha o popover
- O botão mostra o nome da série selecionada ou "Selecione uma série"
- Ícone de check marca a série atualmente selecionada

## Mudanças Técnicas

### Arquivo: `src/pages/admin/EpisodeForm.tsx`

**1. Novos imports:**
```typescript
import { useState } from "react"; // já existe
import { Check, ChevronsUpDown, ArrowLeft } from "lucide-react"; // adicionar Check e ChevronsUpDown
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
```

**2. Novo estado para controlar abertura do popover:**
```typescript
const [seriesOpen, setSeriesOpen] = useState(false);
```

**3. Substituir o bloco `<Select>` pelo Combobox:**

Antes (linhas 172–180):
```tsx
<div className="space-y-2">
  <Label>Série</Label>
  <Select value={form.series_id} onValueChange={(v) => setForm({ ...form, series_id: v })}>
    <SelectTrigger><SelectValue placeholder="Selecione uma série" /></SelectTrigger>
    <SelectContent>
      {seriesList?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
    </SelectContent>
  </Select>
</div>
```

Depois:
```tsx
<div className="space-y-2">
  <Label>Série</Label>
  <Popover open={seriesOpen} onOpenChange={setSeriesOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={seriesOpen}
        className="w-full justify-between font-normal"
      >
        {form.series_id
          ? seriesList?.find((s) => s.id === form.series_id)?.title
          : "Selecione uma série"}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-full p-0" align="start">
      <Command>
        <CommandInput placeholder="Buscar série..." />
        <CommandList>
          <CommandEmpty>Nenhuma série encontrada.</CommandEmpty>
          <CommandGroup>
            {seriesList?.map((s) => (
              <CommandItem
                key={s.id}
                value={s.title}
                onSelect={() => {
                  setForm({ ...form, series_id: s.id });
                  setSeriesOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${form.series_id === s.id ? "opacity-100" : "opacity-0"}`} />
                {s.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
```

**4. Remover imports não mais utilizados:**
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` podem ser removidos do import (não são usados em mais nenhum lugar no arquivo)

## Por que usar `value={s.title}` no CommandItem?

O `cmdk` usa a prop `value` do `CommandItem` para filtrar os itens pelo texto digitado. Usando `value={s.title}`, a busca nativa do `cmdk` já cuida da filtragem — sem precisar implementar lógica adicional de filtro. A seleção real continua usando `s.id` no `onSelect`.

## Arquivo Alterado

Apenas **`src/pages/admin/EpisodeForm.tsx`**:
- Adicionar imports: `Popover`, `PopoverContent`, `PopoverTrigger`, `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList`, `Check`, `ChevronsUpDown`
- Adicionar estado `seriesOpen`
- Substituir bloco `<Select>` pelo Combobox (Popover + Command)
- Remover imports do `Select` que ficaram sem uso

Nenhuma alteração de banco de dados necessária.
