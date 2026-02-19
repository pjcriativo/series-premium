
# Validação de Arquivo antes do Upload — FanClubManager

## Situação Atual

O `handleImageChange` (linhas 118–122) aceita qualquer arquivo sem validação:
- Nenhuma verificação de tipo MIME
- Nenhuma verificação de tamanho
- Erros de upload só aparecem depois do envio (custoso e confuso para o usuário)

## Regras de Validação a Implementar

| Regra | Detalhe |
|---|---|
| Tipos aceitos | `image/jpeg`, `image/png`, `image/webp` |
| Tamanho máximo | 5 MB (5 × 1024 × 1024 bytes) |
| Momento | Antes de qualquer upload, direto no `handleImageChange` |
| Feedback | Toast de erro imediato + campo não preenchido |

## Mudanças no Arquivo `src/pages/admin/FanClubManager.tsx`

### 1. Adicionar constantes de validação (antes de `NewPostForm`, linha 111)

```typescript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
```

### 2. Atualizar `handleImageChange` (linhas 118–122) com validação

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;

  // Zera o input para permitir re-selecionar o mesmo arquivo após erro
  e.target.value = "";

  if (!file) return;

  if (!ACCEPTED_TYPES.includes(file.type)) {
    toast({
      title: "Formato não suportado",
      description: "Use JPG, PNG ou WebP.",
      variant: "destructive",
    });
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    toast({
      title: "Imagem muito grande",
      description: `O arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é 5 MB.`,
      variant: "destructive",
    });
    return;
  }

  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));
};
```

### 3. Restringir o `accept` do input para os tipos exatos (linha 225)

```tsx
accept="image/jpeg,image/png,image/webp"
```

Isso já filtra o seletor nativo do sistema operacional, reduzindo a chance de o usuário selecionar um tipo errado.

## Comportamento Esperado

- Arquivo válido (ex: foto.jpg, 2 MB) → preview aparece normalmente
- Tipo inválido (ex: arquivo.gif, documento.pdf) → toast "Formato não suportado" e campo limpo
- Arquivo muito grande (ex: raw.png, 10 MB) → toast "Imagem muito grande — X.X MB. O limite é 5 MB." e campo limpo
- Após erro, o usuário pode selecionar outro arquivo imediatamente (input resetado)

## Arquivos Alterados

- `src/pages/admin/FanClubManager.tsx` — apenas `handleImageChange` e o atributo `accept` do `<input>`
