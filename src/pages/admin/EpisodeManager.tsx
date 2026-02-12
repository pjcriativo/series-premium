import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface EpisodeForm {
  series_id: string;
  title: string;
  episode_number: number;
  is_free: boolean;
  coin_cost: number;
  duration_seconds: number;
}

const emptyForm: EpisodeForm = {
  series_id: "",
  title: "",
  episode_number: 1,
  is_free: false,
  coin_cost: 0,
  duration_seconds: 0,
};

const EpisodeManager = () => {
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeForm>(emptyForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: seriesList } = useQuery({
    queryKey: ["admin-series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("id, title").order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: episodes, isLoading } = useQuery({
    queryKey: ["admin-episodes", selectedSeries],
    queryFn: async () => {
      let query = supabase.from("episodes").select("*, series:series_id(title)").order("episode_number");
      if (selectedSeries !== "all") query = query.eq("series_id", selectedSeries);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const uploadVideo = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("videos").upload(path, file);
    if (error) throw error;
    return path;
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: EpisodeForm) => {
      let videoUrl: string | undefined;
      if (videoFile) {
        videoUrl = await uploadVideo(videoFile);
      }
      const payload: any = { ...formData };
      if (videoUrl) payload.video_url = videoUrl;

      if (editId) {
        const { error } = await supabase.from("episodes").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("episodes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-episodes"] });
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setVideoFile(null);
      toast({ title: editId ? "Episódio atualizado" : "Episódio criado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("episodes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-episodes"] });
      toast({ title: "Episódio removido" });
    },
  });

  const openEdit = (ep: any) => {
    setEditId(ep.id);
    setForm({
      series_id: ep.series_id,
      title: ep.title,
      episode_number: ep.episode_number,
      is_free: ep.is_free,
      coin_cost: ep.coin_cost,
      duration_seconds: ep.duration_seconds ?? 0,
    });
    setVideoFile(null);
    setOpen(true);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, series_id: selectedSeries !== "all" ? selectedSeries : "" });
    setVideoFile(null);
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Episódios</h1>
        <div className="flex gap-3">
          <Select value={selectedSeries} onValueChange={setSelectedSeries}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as séries</SelectItem>
              {seriesList?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Novo Episódio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Episódio" : "Novo Episódio"}</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMutation.mutate(form);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Série</Label>
                  <Select value={form.series_id} onValueChange={(v) => setForm({ ...form, series_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma série" />
                    </SelectTrigger>
                    <SelectContent>
                      {seriesList?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº do episódio</Label>
                    <Input
                      type="number"
                      value={form.episode_number}
                      onChange={(e) => setForm({ ...form, episode_number: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vídeo</Label>
                  <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Custo (moedas)</Label>
                    <Input
                      type="number"
                      value={form.coin_cost}
                      onChange={(e) => setForm({ ...form, coin_cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (seg)</Label>
                    <Input
                      type="number"
                      value={form.duration_seconds}
                      onChange={(e) => setForm({ ...form, duration_seconds: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_free} onCheckedChange={(v) => setForm({ ...form, is_free: v })} />
                  <Label>Episódio gratuito</Label>
                </div>
                <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Série</TableHead>
              <TableHead>Episódio</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead>Custo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : episodes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum episódio</TableCell>
              </TableRow>
            ) : (
              episodes?.map((ep: any) => (
                <TableRow key={ep.id}>
                  <TableCell className="text-muted-foreground">{ep.series?.title}</TableCell>
                  <TableCell>#{ep.episode_number}</TableCell>
                  <TableCell className="font-medium">{ep.title}</TableCell>
                  <TableCell>
                    <Badge variant={ep.is_free ? "default" : "secondary"}>
                      {ep.is_free ? "Grátis" : "Bloqueado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{ep.coin_cost} 🪙</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ep)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ep.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

export default EpisodeManager;
