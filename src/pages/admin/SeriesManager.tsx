import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface SeriesForm {
  title: string;
  slug: string;
  synopsis: string;
  cover_url: string;
  category_id: string;
  total_episodes: number;
  free_episodes: number;
  is_published: boolean;
}

const emptyForm: SeriesForm = {
  title: "", slug: "", synopsis: "", cover_url: "", category_id: "",
  total_episodes: 0, free_episodes: 3, is_published: false,
};

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const SeriesManager = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeriesForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: seriesList, isLoading } = useQuery({
    queryKey: ["admin-series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*, categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadCover = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: SeriesForm) => {
      let coverUrl = formData.cover_url;
      if (coverFile) coverUrl = await uploadCover(coverFile);
      const payload = { ...formData, cover_url: coverUrl, category_id: formData.category_id || null };
      if (editId) {
        const { error } = await supabase.from("series").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("series").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
      setOpen(false); setEditId(null); setForm(emptyForm); setCoverFile(null);
      toast({ title: editId ? "Série atualizada" : "Série criada" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-series"] }); toast({ title: "Série removida" }); },
  });

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      title: s.title, slug: s.slug ?? "", synopsis: s.synopsis ?? "", cover_url: s.cover_url ?? "",
      category_id: s.category_id ?? "", total_episodes: s.total_episodes, free_episodes: s.free_episodes,
      is_published: s.is_published,
    });
    setCoverFile(null); setOpen(true);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setCoverFile(null); setOpen(true); };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Séries</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nova Série</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? "Editar Série" : "Nova Série"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} required />
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
                  <Input type="number" value={form.total_episodes} onChange={(e) => setForm({ ...form, total_episodes: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Episódios grátis</Label>
                  <Input type="number" value={form.free_episodes} onChange={(e) => setForm({ ...form, free_episodes: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                  <Label>Publicado</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capa</Label>
                <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Eps grátis</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : seriesList?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma série</TableCell></TableRow>
            ) : (
              seriesList?.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>{s.categories?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.is_published ? "default" : "secondary"}>
                      {s.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.free_episodes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SeriesManager;
