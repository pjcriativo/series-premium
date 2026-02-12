import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Sparkles, Image as ImageIcon } from "lucide-react";

const PAGE_SIZE = 10;

const SeriesManager = () => {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => setPage(0), [search]);

  const { data: seriesList, isLoading } = useQuery({
    queryKey: ["admin-series"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("*, categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (seriesList ?? []).filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("series").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-series"] }); toast({ title: "Série removida" }); },
  });

  const handleGenerateAll = async () => {
    setGenerating(true);
    setGenProgress("Gerando capas para todas as séries...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/generate-covers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ type: "covers" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar capas");
      const ok = data.results?.filter((r: any) => r.status === "ok").length ?? 0;
      const fail = data.results?.filter((r: any) => r.status !== "ok").length ?? 0;
      toast({ title: `Capas geradas: ${ok} ok, ${fail} erros` });
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  };

  const handleGenerateSingle = async (seriesId: string, title: string) => {
    setGenerating(true);
    setGenProgress(`Gerando capa para "${title}"...`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/generate-covers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ type: "covers", series_id: seriesId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar capa");
      toast({ title: `Capa gerada para "${title}"` });
      queryClient.invalidateQueries({ queryKey: ["admin-series"] });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  };

  const handleGenerateBanners = async () => {
    setGenerating(true);
    setGenProgress("Gerando imagens dos banners...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`https://pnuydoujbrpfhohsxndz.supabase.co/functions/v1/generate-covers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ type: "banners" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar banners");
      const ok = data.results?.filter((r: any) => r.status === "ok").length ?? 0;
      toast({ title: `Banners gerados: ${ok}` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
      setGenProgress("");
    }
  };
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Séries</h1>
          <Link to="/admin/series/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Série</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateAll} disabled={generating}>
            <Sparkles className="mr-2 h-4 w-4" /> Gerar Capas (Todas)
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateBanners} disabled={generating}>
            <ImageIcon className="mr-2 h-4 w-4" /> Gerar Banners
          </Button>
        </div>
        {generating && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{genProgress}</p>
            <Progress className="h-2" />
          </div>
        )}
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar séries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Status</TableHead><TableHead>Eps grátis</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma série</TableCell></TableRow>
            ) : (
              paged.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>{s.categories?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant={s.is_published ? "default" : "secondary"}>{s.is_published ? "Publicado" : "Rascunho"}</Badge></TableCell>
                  <TableCell>{s.free_episodes}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleGenerateSingle(s.id, s.title)} disabled={generating} title="Gerar capa IA">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/series/${s.id}/edit`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleteTarget!); setDeleteTarget(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SeriesManager;
