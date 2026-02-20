
# Corrigir Upload de Vídeo no Formulário de Episódio

## Diagnóstico do Problema

O upload de vídeo usa `XMLHttpRequest` com `POST` diretamente para a URL raw do Supabase Storage:

```
POST https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/videos/${path}
```

Esse método tem dois problemas críticos:

1. **Método HTTP errado**: A API de storage do Supabase para upload requer o envio do arquivo como corpo raw (binary), mas o endpoint `POST /storage/v1/object/{bucket}/{path}` pode estar esperando `multipart/form-data`. O SDK usa o método correto internamente.

2. **Extension hardcoded**: O path sempre usa `.mp4` (`${crypto.randomUUID()}.mp4`), mas o arquivo pode ter content-type diferente dependendo do browser — se o arquivo não for exatamente MP4 nativo, o upload pode falhar silenciosamente mesmo retornando 200.

3. **Sem verificação de RLS/Policy**: O bucket `videos` é privado. O XHR com token JWT funciona para leitura via signed URL, mas para **escrita** o Supabase Storage exige que a política RLS da tabela `storage.objects` permita `INSERT` para usuários autenticados. Isso não é verificado no código atual — pode ser a causa raiz do erro silencioso.

4. **Erro silencioso**: O `xhr.onload` verifica `xhr.status >= 200 && xhr.status < 300`, mas se o Supabase retornar `400` ou `403`, o erro é descartado sem log do corpo da resposta — impossível saber o motivo real.

## Solução

Substituir o XHR manual pelo SDK do Supabase (`.storage.from("videos").upload()`), que:
- Usa o método e headers corretos automaticamente
- Suporta `onUploadProgress` para manter a barra de progresso
- Retorna o erro completo com mensagem legível
- É testado e mantido pelo time do Supabase

## Mudança Técnica

### Arquivo: `src/pages/admin/EpisodeForm.tsx`

Substituir a função `uploadVideoWithProgress` atual:

**Antes (XHR manual, problemático):**
```typescript
const uploadVideoWithProgress = async (file: File): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");

  return new Promise((resolve, reject) => {
    const path = `${crypto.randomUUID()}.mp4`;
    const url = `https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/videos/${path}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve(path) : reject(new Error("Upload falhou")));
    xhr.onerror = () => reject(new Error("Upload falhou"));
    xhr.send(file);
  });
};
```

**Depois (SDK do Supabase com progresso):**
```typescript
const uploadVideoWithProgress = async (file: File): Promise<string> => {
  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("videos")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      onUploadProgress: (progress) => {
        setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
      },
    });

  if (error) throw new Error(error.message);
  return data.path;
};
```

## Por Que Isso Resolve

| Problema Atual | Solução com SDK |
|---|---|
| XHR POST pode não enviar no formato correto | SDK usa o método e formato certos internamente |
| Extensão sempre `.mp4` (hardcoded) | Extensão extraída do nome real do arquivo |
| Erros silenciosos sem mensagem | `error.message` do SDK é descritivo |
| Progresso via `xhr.upload.onprogress` | SDK suporta `onUploadProgress` nativamente |
| Sem `upsert`, pode conflitar | `upsert: false` deixa explícito |

## Verificação de Permissões (Storage RLS)

O bucket `videos` é privado. Para que o upload funcione, a tabela `storage.objects` precisa ter uma policy de `INSERT` para admins. Vou verificar se isso já existe e, se não existir, incluir a migration necessária.

A policy necessária é:
```sql
-- Admins podem fazer upload no bucket videos
CREATE POLICY "Admins can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  public.has_role(auth.uid(), 'admin')
);
```

## Arquivos Alterados

- **`src/pages/admin/EpisodeForm.tsx`**: Substituir função `uploadVideoWithProgress` pelo SDK do Supabase
- **Migration SQL** (se necessário): Adicionar policy de INSERT para admins no bucket `videos`
