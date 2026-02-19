
# Upload de Imagem para o Storage no Formulário do Fan Club

## Situação Atual

O campo de imagem no `NewPostForm` (`src/pages/admin/FanClubManager.tsx`) é um simples `<Input>` de texto para colar uma URL externa:

```tsx
<Input
  placeholder="https://…"
  value={form.image_url}
  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
/>
```

Isso é frágil — URLs externas podem sair do ar, e o processo de copiar/colar é trabalhoso para o admin.

## Solução

Substituir o campo de URL por um seletor de arquivo nativo (`<input type="file">`), com:

- Preview da imagem selecionada antes de publicar
- Upload para o bucket `covers` do Supabase Storage (já público, já usado pelas capas de séries)
- Botão de remoção da imagem selecionada
- Indicador de progresso de upload (texto "Enviando…" no botão Publicar)

O padrão de upload já existe no `SeriesForm.tsx` e será replicado com pequenas adaptações.

## Alterações Técnicas

### Arquivo único: `src/pages/admin/FanClubManager.tsx`

**1. Estado adicional no `NewPostForm`:**

```typescript
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [uploading, setUploading] = useState(false);
```

**2. Handler de seleção de arquivo:**

```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] ?? null;
  setImageFile(file);
  setImagePreview(file ? URL.createObjectURL(file) : null);
};
```

**3. Função de upload para o bucket `covers`:**

```typescript
const uploadImage = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `fan-club/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("covers").upload(path, file);
  if (error) throw error;
  return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
};
```

As imagens do Fan Club ficam em uma subpasta `fan-club/` dentro do bucket `covers`, separadas das capas de séries.

**4. Integração na `mutationFn`:**

```typescript
mutationFn: async (data: PostFormData) => {
  setUploading(true);
  let image_url: string | null = null;
  if (imageFile) {
    image_url = await uploadImage(imageFile);
  }
  setUploading(false);
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

**5. Limpar estado após publicar:**

```typescript
onSuccess: () => {
  toast({ title: "Post publicado!" });
  setForm(EMPTY_FORM);
  setImageFile(null);
  setImagePreview(null);
  onCreated();
},
```

**6. UI do campo de imagem (substitui o Input de URL):**

```tsx
<div className="col-span-2 space-y-1.5">
  <Label>
    Imagem <span className="text-muted-foreground font-normal">(opcional)</span>
  </Label>

  {/* Preview */}
  {imagePreview && (
    <div className="relative w-full">
      <img
        src={imagePreview}
        alt="Preview"
        className="w-full max-h-48 object-cover rounded-lg"
      />
      <button
        type="button"
        onClick={() => { setImageFile(null); setImagePreview(null); }}
        className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-destructive transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )}

  {/* File input */}
  {!imagePreview && (
    <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Clique para selecionar uma imagem
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
    </label>
  )}
</div>
```

**7. Botão Publicar com estado de upload:**

```tsx
<Button disabled={!isValid || createPost.isPending || uploading} ...>
  {uploading ? "Enviando imagem…" : createPost.isPending ? "Publicando…" : (
    <><Plus className="h-4 w-4" />Publicar</>
  )}
</Button>
```

**8. Novos imports:**

```typescript
import { ImageIcon, X } from "lucide-react"; // adicionar X e ImageIcon
```

## Fluxo Completo

```text
Admin seleciona arquivo  →  Preview local (URL.createObjectURL)
                         →  Clica "Publicar"
                         →  Upload para covers/fan-club/{uuid}.ext
                         →  Supabase retorna URL pública
                         →  INSERT em fan_club_posts com image_url
                         →  Post aparece no feed do Fan Club com imagem
```

## O que NÃO muda

- Nenhuma migração de banco necessária — `image_url` já é `text nullable`
- Nenhuma mudança no bucket (já público, já tem RLS de leitura pública)
- Nenhuma mudança na página `FanClub.tsx` do usuário
- A lógica de moderation de comentários permanece intacta

## Possível Problema: RLS de upload no Storage

O bucket `covers` pode ou não ter política de INSERT para admins autenticados. Verificarei se há necessidade de adicionar uma política de Storage RLS para `fan-club/*` para usuários com role `admin`. Se necessário, criarei uma migration adicionando:

```sql
CREATE POLICY "Admins can upload fan club images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND name LIKE 'fan-club/%'
  AND has_role(auth.uid(), 'admin'::app_role)
);
```
