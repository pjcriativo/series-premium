import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface PkgForm {
  title: string;
  coins: number;
  price_cents: number;
  stripe_price_id: string;
  is_active: boolean;
}

const emptyForm: PkgForm = { title: "", coins: 100, price_cents: 990, stripe_price_id: "", is_active: true };
const PAGE_SIZE = 10;

const CoinPackageManager = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PkgForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => setPage(0), [search]);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_packages").select("*").order("coins");
      if (error) throw error;
      return data;
    },
  });

  const filtered = (packages ?? []).filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const saveMutation = useMutation({
    mutationFn: async (f: PkgForm) => {
      const payload = { ...f, stripe_price_id: f.stripe_price_id || null };
      if (editId) {
        const { error } = await supabase.from("coin_packages").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coin_packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      setOpen(false); setEditId(null); setForm(emptyForm);
      toast({ title: editId ? "Pacote atualizado" : "Pacote criado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coin_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-packages"] }); toast({ title: "Pacote removido" }); },
  });

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({ title: p.title, coins: p.coins, price_cents: p.price_cents, stripe_price_id: p.stripe_price_id ?? "", is_active: p.is_active });
    setOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Pacotes de Moedas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditId(null); setForm(emptyForm); }}><Plus className="mr-2 h-4 w-4" /> Novo Pacote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Pacote" : "Novo Pacote"}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moedas</Label>
                  <Input type="number" min={1} value={form.coins} onChange={(e) => setForm({ ...form, coins: parseInt(e.target.value) || 0 })} required />
                </div>
                <div className="space-y-2">
                  <Label>Preço (centavos BRL)</Label>
                  <Input type="number" min={1} value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: parseInt(e.target.value) || 0 })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stripe Price ID</Label>
                <Input value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} placeholder="price_..." />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Ativo</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar pacotes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Moedas</TableHead>
              <TableHead>Preço (BRL)</TableHead>
              <TableHead>Stripe ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhum pacote</TableCell></TableRow>
            ) : (
              paged.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.coins} 🪙</TableCell>
                  <TableCell>R$ {(p.price_cents / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{p.stripe_price_id || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Ativo" : "Inativo"}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleteTarget!); setDeleteTarget(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CoinPackageManager;
