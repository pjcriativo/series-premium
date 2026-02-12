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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Coins, ShieldCheck, Search, Receipt } from "lucide-react";

const PAGE_SIZE = 10;

const UserManager = () => {
  const [adjustDialog, setAdjustDialog] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [adjustMode, setAdjustMode] = useState<"credit" | "debit">("credit");
  const [coinAmount, setCoinAmount] = useState(100);
  const [adminToggle, setAdminToggle] = useState<{ userId: string; isAdmin: boolean; name: string } | null>(null);
  const [txDialog, setTxDialog] = useState<{ userId: string; name: string } | null>(null);
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

  const { data: transactions } = useQuery({
    queryKey: ["admin-user-transactions", txDialog?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", txDialog!.userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!txDialog,
  });

  const filtered = (users ?? []).filter(u => (u.display_name || "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const adjustCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase.functions.invoke("buy-coins", { body: { admin_grant: true, target_user_id: userId, coins: amount } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setAdjustDialog(null);
      toast({ title: "Saldo ajustado!" });
    },
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

  const handleAdjustSubmit = () => {
    if (!adjustDialog || coinAmount <= 0) return;
    const finalCoins = adjustMode === "credit" ? coinAmount : -coinAmount;
    adjustCoinsMutation.mutate({ userId: adjustDialog.userId, amount: finalCoins });
  };

  const reasonLabels: Record<string, string> = {
    purchase: "Compra",
    episode_unlock: "Desbloqueio ep.",
    series_unlock: "Desbloqueio série",
    admin_adjust: "Ajuste admin",
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-foreground">Usuários</h1>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar usuários..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Moedas</TableHead><TableHead>Papéis</TableHead><TableHead>Criado em</TableHead><TableHead className="w-40">Ações</TableHead></TableRow></TableHeader>
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
                      <Button variant="ghost" size="icon" title="Ajustar moedas" onClick={() => { setAdjustDialog({ userId: u.id, name: u.display_name || "Usuário", balance: u.balance }); setAdjustMode("credit"); setCoinAmount(100); }}>
                        <Coins className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Transações" onClick={() => setTxDialog({ userId: u.id, name: u.display_name || "Usuário" })}>
                        <Receipt className="h-4 w-4" />
                      </Button>
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

      {/* Adjust Coins Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar moedas — {adjustDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Saldo atual: <span className="font-semibold text-foreground">{adjustDialog?.balance} 🪙</span></p>
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={adjustMode} onValueChange={(v) => setAdjustMode(v as "credit" | "debit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Creditar</SelectItem>
                  <SelectItem value="debit">Debitar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" value={coinAmount} onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)} min={1} />
            </div>
            <Button className="w-full" onClick={handleAdjustSubmit} disabled={adjustCoinsMutation.isPending || coinAmount <= 0}>
              {adjustCoinsMutation.isPending ? "Processando..." : `${adjustMode === "credit" ? "Creditar" : "Debitar"} ${coinAmount} moedas`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={!!txDialog} onOpenChange={() => setTxDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Transações — {txDialog?.name}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Moedas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma transação</TableCell></TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-muted-foreground">{new Date(tx.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant={tx.type === "credit" ? "default" : "destructive"}>
                        {tx.type === "credit" ? "Crédito" : "Débito"}
                      </Badge>
                    </TableCell>
                    <TableCell>{reasonLabels[tx.reason] || tx.reason}</TableCell>
                    <TableCell>{tx.coins} 🪙</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Admin Toggle Confirmation */}
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
