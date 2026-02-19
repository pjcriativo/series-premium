
# Upload de Imagem para o Storage — Fan Club Admin

## Situação Atual

O `NewPostForm` em `src/pages/admin/FanClubManager.tsx` ainda usa um `<Input type="text">` para URL externa no campo de imagem (linhas 176-183). O código anterior foi aprovado mas não foi persistido no arquivo.

## O que será alterado

### Arquivo: `src/pages/admin/FanClubManager.tsx`

#### 1. Remover `Input` dos imports (linha 7) — não será mais usado no formulário

#### 2. Adicionar imports de ícones (linha 17)
Adicionar `ImageIcon` e `X` ao import de `lucide-react`.

#### 3. Refatorar a interface `PostFormData` (linha 104–109)
Remover o campo `image_url` do estado do formulário — a URL virá do Storage após o upload, não de um campo de texto.

```typescript
interface PostFormData {
  title: string;
  body: string;
  post_type: string;
}
const EMPTY_FORM: PostFormData = { title: "", body: "", post_type: "post" };
```

#### 4. Adicionar 3 novos estados ao `NewPostForm` (após linha 115)
```typescript
const [imageFile, setImageFile]     = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [uploading, setUploading]     = useState(false);
```

#### 5. Adicionar handler de seleção e função de upload
```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setImageFile(file);
  setImagePreview(file ? URL.createObjectURL(file) : null);
};

const uploadImage = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `fan-club/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
};
```

#### 6. Atualizar a `mutationFn` para fazer upload antes do INSERT
```typescript
mutationFn: async (data: PostFormData) => {
  setUploading(true);
  let image_url: string | null = null;
  try {
    if (imageFile) image_url = await uploadImage(imageFile);
  } finally {
    setUploading(false);
  }
  const { error } = await supabase.from("fan_club_posts").insert({
    author_id: user!.id,
    title: data.title.trim(),
    body: data.body.trim(),
    image_url,
    post_type: data.post_type,
  });
  if (error) throw error;
},
```

#### 7. Limpar estados de imagem no `onSuccess`
```typescript
onSuccess: () => {
  toast({ title: "Post publicado!" });
  setForm(EMPTY_FORM);
  setImageFile(null);
  setImagePreview(null);
  onCreated();
},
```

#### 8. Substituir o campo de URL pela UI de upload (linhas 176-183)

Substituir o bloco `<div>` com `<Input placeholder="https://…">` por:

- Quando **nenhuma imagem** selecionada: área clicável com borda tracejada e ícone `ImageIcon`
- Quando **imagem selecionada**: preview `<img>` com altura máxima de 48 e botão `X` para remover no canto superior direito

#### 9. Atualizar o botão Publicar para refletir o estado de upload
```tsx
<Button disabled={!isValid || createPost.isPending || uploading} ...>
  {uploading
    ? "Enviando imagem…"
    : createPost.isPending
    ? "Publicando…"
    : <><Plus className="h-4 w-4" />Publicar</>
  }
</Button>
```

## Sobre a RLS de Storage

A migration de política de INSERT para o bucket `covers` (pasta `fan-club/`) foi gerada na sessão anterior. Se o upload retornar erro de permissão ao testar, será necessário rodar a migration no SQL Editor do Supabase.

## Resumo das mudanças

| Aspecto | Antes | Depois |
|---|---|---|
| Campo de imagem | `<Input type="text">` com URL | Seletor de arquivo nativo |
| Preview | Nenhum | Preview local antes de publicar |
| Upload | Não havia | `supabase.storage.from("covers").upload` |
| Feedback | Nenhum | "Enviando imagem…" no botão |
| Armazenamento | URL externa (pode sair do ar) | Storage interno do Supabase |

Nenhuma migração de banco é necessária — `image_url` já é `text nullable` na tabela `fan_club_posts`.
