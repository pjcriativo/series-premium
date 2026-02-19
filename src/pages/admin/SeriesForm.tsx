import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface FormData {
  title: string;
  slug: string;
  synopsis: string;
  cover_url: string;
  category_id: string;
  total_episodes: number;
  free_episodes: number;
  is_published: boolean;
}

const emptyForm: FormData = {
  title: "", slug: "", synopsis: "", cover_url: "",
  category_id: "", total_episodes: 0, free_episodes: 3, is_published: false,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const SeriesForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverWarning, setCoverWarning] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: series } = useQuery({
    queryKey: ["admin-series-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (series) {
      setForm({
        title: series.title,
        slug: series.slug,
        synopsis: series.synopsis ?? "",
        cover_url: series.cover_url ?? "",
        category_id: series.category_id ?? "",
        total_episodes: series.total_episodes,
        free_episodes: series.free_episodes,
        is_published: series.is_published,
      });
    }
  }, [series]);

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      let coverUrl = formData.cover_url;
      if (coverFile) coverUrl = await uploadCover(coverFile);

      const payload = {
        title: formData.title,
        slug: formData.slug,
        synopsis: formData.synopsis || null,
        cover_url: coverUrl || null,
        category_id: formData.category_id || null,
        total_episodes: formData.total_episodes,
        free_episodes: formData.free_episodes,
        is_published: formData.is_published,
      };

      if (id) {
        const { error } = await supabase.from("series").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("series").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-series-list"] });
      toast({ title: id ? "Série atualizada" : "Série criada" });
      navigate("/admin/series");
    },
    onError: (err: any) => {
      console.error("[SERIES_FORM] save error", err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/series">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{isNew ? "Nova Série" : "Editar Série"}</h1>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
        className="max-w-2xl space-y-4"
      >
        <div className="space-y-2">
          <Label>Título</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </div>

        <div className="space-y-2">
          <Label>Sinopse</Label>
          <Textarea value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Total de episódios</Label>
            <Input
              type="number"
              value={form.total_episodes}
              onChange={(e) => setForm({ ...form, total_episodes: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Episódios grátis</Label>
            <Input
              type="number"
              value={form.free_episodes}
              onChange={(e) => setForm({ ...form, free_episodes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
            <Label>Publicado</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Capa</Label>
          {form.cover_url && !coverFile && (
            <img src={form.cover_url} alt="Capa atual" className="h-24 w-auto rounded-md object-cover mb-2" />
          )}
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setCoverFile(file);
              if (file && file.size > 5 * 1024 * 1024) {
                setCoverWarning("⚠️ Imagem grande (acima de 5 MB). O upload pode demorar mais. Considere usar uma imagem menor.");
              } else {
                setCoverWarning(null);
              }
            }}
          />
          {coverWarning && (
            <p className="text-sm text-destructive">{coverWarning}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </div>
  );
};

export default SeriesForm;
