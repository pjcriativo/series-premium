import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BannerForm {
  title: string;
  subtitle: string;
  image_url: string;
  link_series_id: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: BannerForm = { title: "", subtitle: "", image_url: "", link_series_id: "", sort_order: 0, is_active: true };

const BannerManager = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [changingImageId, setChangingImageId] = useState<string | null>(null);
  const changeImageRef = useRef<HTMLInputElement>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, series:link_series_id(id, title)")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: seriesList } = useQuery({
    queryKey: ["admin-series-list"],
    queryFn: async () => {
      const { data } = await supabase.from("series").select("id, title").order("title");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        image_url: form.image_url || null,
        link_series_id: form.link_series_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: editingId ? "Banner atualizado" : "Banner criado" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Banner removido" });
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleQuickImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !changingImageId) return;
    const id = changingImageId;
    const ext = file.name.split(".").pop();
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file);
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); setChangingImageId(null); return; }
    const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
    const { error: updateErr } = await supabase.from("banners").update({ image_url: urlData.publicUrl }).eq("id", id);
    if (updateErr) { toast({ title: "Erro ao atualizar", variant: "destructive" }); } else {
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Imagem atualizada" });
    }
    setChangingImageId(null);
    if (changeImageRef.current) changeImageRef.current.value = "";
  };

  const openEdit = (banner: any) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
      link_series_id: banner.link_series_id || "",
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingId(null); setForm(emptyForm); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Banners</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} /></div>
              <div>
                <Label>Imagem</Label>
              {form.image_url && (
                  <div className="relative mb-2">
                    <img src={form.image_url} alt="" className="w-full aspect-[21/9] object-cover rounded-md" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => setForm((f) => ({ ...f, image_url: "" }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </div>
              <div>
                <Label>Série vinculada</Label>
                <Select value={form.link_series_id} onValueChange={(v) => setForm((f) => ({ ...f, link_series_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar série" /></SelectTrigger>
                  <SelectContent>
                    {(seriesList || []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={(c) => setForm((f) => ({ ...f, is_active: c }))} />
                  <Label>Ativo</Label>
                </div>
              </div>
              <Button className="w-full" disabled={!form.title || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Imagem</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Série</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : (banners || []).map((b: any) => (
            <TableRow key={b.id}>
              <TableCell>
                {b.image_url ? <img src={b.image_url} className="h-10 w-20 rounded object-cover" /> : <ImagePlus className="h-10 w-10 text-muted-foreground" />}
              </TableCell>
              <TableCell className="font-medium">{b.title}</TableCell>
              <TableCell className="text-muted-foreground">{b.series?.title || "—"}</TableCell>
              <TableCell>{b.sort_order}</TableCell>
              <TableCell>{b.is_active ? "✅" : "❌"}</TableCell>
              <TableCell className="text-right space-x-1">
                <TooltipProvider delayDuration={300}>
                  <Tooltip><TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" disabled={changingImageId === b.id} onClick={() => { setChangingImageId(b.id); setTimeout(() => changeImageRef.current?.click(), 0); }}>
                      {changingImageId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger><TooltipContent>Trocar imagem</TooltipContent></Tooltip>
                </TooltipProvider>
                <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(b.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <input ref={changeImageRef} type="file" accept="image/*" className="hidden" onChange={handleQuickImageChange} />
    </div>
  );
};

export default BannerManager;
