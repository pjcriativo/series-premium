import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, ShieldCheck, Search } from "lucide-react";

const PAGE_SIZE = 10;

const UserManager = () => {
  const [grantDialog, setGrantDialog] = useState<{ userId: string; name: string } | null>(null);
  const [coinAmount, setCoinAmount] = useState(100);
  const [adminToggle, setAdminToggle] = useState<{ userId: string; isAdmin: boolean; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => setPage(0), [search]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("id, display_name, avatar_url, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: wallets } = await supabase.from("wallets").select("user_id, balance");
      const walletMap = new Map((wallets ?? []).map((w) => [w.user_id, w.balance]));
      return profiles.map((p) => ({ ...p, balance: walletMap.get(p.id) ?? 0, roles: roles?.filter((r) => r.user_id === p.id).map((r) => r.role) ?? [] }));
    },
  });

  const filtered = (users ?? []).filter(u => (u.display_name || "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const grantCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase.functions.invoke("buy-coins", { body: { admin_grant: true, target_user_id: userId, coins: amount } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setGrantDialog(null); toast({ title: "Moedas concedidas!" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) { const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any); if (error) throw error; }
      else { const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as any }); if (error) throw error; }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setAdminToggle(null); toast({ title: "Papel atualizado" }); },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-foreground">Usuários</h1>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar usuários..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Moedas</TableHead><TableHead>Papéis</TableHead><TableHead>Criado em</TableHead><TableHead className="w-32">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário</TableCell></TableRow>
            ) : (
              paged.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.display_name || "Sem nome"}</TableCell>
                  <TableCell>{u.balance} 🪙</TableCell>
                  <TableCell><div className="flex gap-1">{u.roles.map((r) => (<Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>))}</div></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Conceder moedas" onClick={() => setGrantDialog({ userId: u.id, name: u.display_name || "Usuário" })}><Coins className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title={u.roles.includes("admin") ? "Remover admin" : "Tornar admin"} onClick={() => setAdminToggle({ userId: u.id, isAdmin: u.roles.includes("admin"), name: u.display_name || "Usuário" })}>
                        <ShieldCheck className={`h-4 w-4 ${u.roles.includes("admin") ? "text-primary" : ""}`} />
                      </Button>
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

      <Dialog open={!!grantDialog} onOpenChange={() => setGrantDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conceder moedas para {grantDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)} min={1} /></div>
            <Button className="w-full" onClick={() => grantDialog && grantCoinsMutation.mutate({ userId: grantDialog.userId, amount: coinAmount })} disabled={grantCoinsMutation.isPending}>
              {grantCoinsMutation.isPending ? "Concedendo..." : `Conceder ${coinAmount} moedas`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!adminToggle} onOpenChange={() => setAdminToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{adminToggle?.isAdmin ? "Remover papel admin" : "Tornar admin"}</AlertDialogTitle>
            <AlertDialogDescription>
              {adminToggle?.isAdmin ? `Remover o papel de administrador de ${adminToggle.name}?` : `Tornar ${adminToggle?.name} administrador?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (adminToggle) { toggleAdminMutation.mutate({ userId: adminToggle.userId, isAdmin: adminToggle.isAdmin }); } }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManager;
