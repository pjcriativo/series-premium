import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, MessageCircle, ChevronDown, ChevronUp, ImageIcon, X, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatDate(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR });
}

// ── Comment moderation panel ──────────────────────────────────────────────────

const CommentModerationPanel = ({ postId }: { postId: string }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-fan-club-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_club_comments")
        .select("id, body, created_at, user_id, is_deleted, profiles:user_id(display_name)")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("fan_club_comments")
        .update({ is_deleted: true })
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fan-club-comments", postId] });
      toast({ title: "Comentário removido" });
    },
  });

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Comentários
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem comentários.</p>
          ) : (
            comments.map((c: any) => (
              <div key={c.id} className={`flex gap-2 items-start rounded-lg px-3 py-2 ${c.is_deleted ? "bg-destructive/10" : "bg-secondary/40"}`}>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold">{c.profiles?.display_name ?? "Usuário"}</span>
                  <span className="text-xs text-muted-foreground ml-2">{formatDate(c.created_at)}</span>
                  {c.is_deleted && <Badge variant="destructive" className="ml-2 text-[10px] py-0">Removido</Badge>}
                  <p className="text-xs text-foreground mt-0.5 truncate">{c.body}</p>
                </div>
                {!c.is_deleted && (
                  <button
                    onClick={() => deleteComment.mutate(c.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Validation constants ──────────────────────────────────────────────────────

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ── New post form ──────────────────────────────────────────────────────────────

interface PostFormData {
  title: string;
  body: string;
  post_type: string;
}

const EMPTY_FORM: PostFormData = { title: "", body: "", post_type: "post" };

const NewPostForm = ({ onCreated }: { onCreated: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato não suportado", description: "Use JPG, PNG ou WebP.", variant: "destructive" });
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

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `fan-club/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  };

  const createPost = useMutation({
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
    onSuccess: () => {
      toast({ title: "Post publicado!" });
      setForm(EMPTY_FORM);
      setImageFile(null);
      setImagePreview(null);
      onCreated();
    },
    onError: () => toast({ title: "Erro ao publicar", variant: "destructive" }),
  });

  const isValid = form.title.trim().length > 0 && form.body.trim().length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-base font-bold text-foreground">Novo Post</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Tipo</Label>
          <Select value={form.post_type} onValueChange={(v) => setForm((f) => ({ ...f, post_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="behind_scenes">Bastidores</SelectItem>
              <SelectItem value="bonus">Episódio Bônus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Título</Label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            placeholder="Título do post"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Conteúdo</Label>
          <Textarea
            placeholder="Escreva o conteúdo do post…"
            className="min-h-[120px]"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Imagem <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          {imagePreview ? (
            <div className="relative w-full">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para selecionar uma imagem</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>
      </div>

      <Button disabled={!isValid || createPost.isPending || uploading} onClick={() => createPost.mutate(form)} className="gap-2">
        {uploading ? "Enviando imagem…" : createPost.isPending ? "Publicando…" : <><Plus className="h-4 w-4" />Publicar</>}
      </Button>
    </div>
  );
};

// ── Edit post dialog ───────────────────────────────────────────────────────────

interface EditPostDialogProps {
  post: any | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EditPostDialog = ({ post, open, onClose, onSaved }: EditPostDialogProps) => {
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync form state whenever the target post changes
  useEffect(() => {
    if (post) {
      setForm({ title: post.title, body: post.body, post_type: post.post_type });
      setImagePreview(post.image_url ?? null);
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato não suportado", description: "Use JPG, PNG ou WebP.", variant: "destructive" });
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
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `fan-club/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  };

  const updatePost = useMutation({
    mutationFn: async (data: PostFormData) => {
      setUploading(true);
      let image_url: string | null | undefined = undefined; // undefined = don't change

      try {
        if (imageFile) {
          image_url = await uploadImage(imageFile);
        } else if (removeImage) {
          image_url = null;
        }
      } finally {
        setUploading(false);
      }

      const payload: any = {
        title: data.title.trim(),
        body: data.body.trim(),
        post_type: data.post_type,
      };
      if (image_url !== undefined) payload.image_url = image_url;

      const { error } = await supabase.from("fan_club_posts").update(payload).eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post atualizado!" });
      onSaved();
      onClose();
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const isValid = form.title.trim().length > 0 && form.body.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.post_type} onValueChange={(v) => setForm((f) => ({ ...f, post_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="post">Post</SelectItem>
                <SelectItem value="behind_scenes">Bastidores</SelectItem>
                <SelectItem value="bonus">Episódio Bônus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Título</Label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              placeholder="Título do post"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Conteúdo</Label>
            <Textarea
              placeholder="Escreva o conteúdo do post…"
              className="min-h-[120px]"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Imagem <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            {imagePreview ? (
              <div className="relative w-full">
                <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para selecionar uma imagem</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updatePost.isPending || uploading}>
            Cancelar
          </Button>
          <Button
            disabled={!isValid || updatePost.isPending || uploading}
            onClick={() => updatePost.mutate(form)}
          >
            {uploading ? "Enviando imagem…" : updatePost.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main manager ──────────────────────────────────────────────────────────────

const FanClubManager = () => {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPost, setEditPost] = useState<any | null>(null);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-fan-club-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_club_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fan_club_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post excluído" });
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-fan-club-posts"] });
      qc.invalidateQueries({ queryKey: ["fan-club-posts"] });
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const TYPE_COLORS: Record<string, string> = {
    post:          "secondary",
    behind_scenes: "outline",
    bonus:         "default",
  };
  const TYPE_LABELS: Record<string, string> = {
    post:          "Post",
    behind_scenes: "Bastidores",
    bonus:         "Bônus",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fan Club</h1>
        <p className="text-sm text-muted-foreground">Gerencie posts, bastidores e conteúdo exclusivo</p>
      </div>

      <NewPostForm onCreated={() => refetch()} />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Posts publicados ({posts.length})
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum post ainda.</p>
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={TYPE_COLORS[post.post_type] as any} className="text-xs">
                      {TYPE_LABELS[post.post_type] ?? post.post_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.body}</p>
                  <CommentModerationPanel postId={post.id} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditPost(post)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="Editar post"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(post.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Excluir post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit dialog */}
      <EditPostDialog
        post={editPost}
        open={!!editPost}
        onClose={() => setEditPost(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-fan-club-posts"] });
          qc.invalidateQueries({ queryKey: ["fan-club-posts"] });
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os comentários e reações do post também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deletePost.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FanClubManager;
