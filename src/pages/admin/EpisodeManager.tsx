import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

const PAGE_SIZE = 10;

const EpisodeManager = () => {
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => setPage(0), [search]);

  const { data: seriesList } = useQuery({
    queryKey: ["admin-series-list"],
    queryFn: async () => { const { data, error } = await supabase.from("series").select("id, title").order("title"); if (error) throw error; return data; },
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

  const filtered = (episodes ?? []).filter(ep => ep.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("episodes").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-episodes"] }); toast({ title: "Episódio removido" }); },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Episódios</h1>
        <div className="flex gap-3">
          <Select value={selectedSeries} onValueChange={setSelectedSeries}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por série" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as séries</SelectItem>
              {seriesList?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
            </SelectContent>
          </Select>
          <Link to="/admin/episodes/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Episódio</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar episódios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Série</TableHead><TableHead>Episódio</TableHead><TableHead>Título</TableHead><TableHead>Acesso</TableHead><TableHead>Preço</TableHead><TableHead>Status</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum episódio</TableCell></TableRow>
            ) : (
              paged.map((ep: any) => (
                <TableRow key={ep.id}>
                  <TableCell className="text-muted-foreground">{ep.series?.title}</TableCell>
                  <TableCell>#{ep.episode_number}</TableCell>
                  <TableCell className="font-medium">{ep.title}</TableCell>
                  <TableCell><Badge variant={ep.is_free ? "default" : "secondary"}>{ep.is_free ? "Grátis" : "Pago"}</Badge></TableCell>
                  <TableCell>{ep.price_coins} 🪙</TableCell>
                  <TableCell><Badge variant={ep.is_published ? "default" : "outline"}>{ep.is_published ? "Publicado" : "Rascunho"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link to={`/admin/episodes/${ep.id}/edit`}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(ep.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default EpisodeManager;
