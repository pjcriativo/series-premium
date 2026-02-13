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
import { Coins, ShieldCheck, Search, Receipt, UserPlus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  balance: number;
  roles: string[];
}

const UserManager = () => {
  const [adjustDialog, setAdjustDialog] = useState<{ userId: string; name: string; balance: number } | null>(null);
  const [adjustMode, setAdjustMode] = useState<"credit" | "debit">("credit");
  const [coinAmount, setCoinAmount] = useState(100);
  const [adminToggle, setAdminToggle] = useState<{ userId: string; isAdmin: boolean; name: string } | null>(null);
  const [txDialog, setTxDialog] = useState<{ userId: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // New CRUD states
  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", display_name: "" });
  const [editDialog, setEditDialog] = useState<{ userId: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; name: string } | null>(null);
  const [detailDialog, setDetailDialog] = useState<UserRow | null>(null);

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
      return profiles.map((p) => ({ ...p, balance: walletMap.get(p.id) ?? 0, roles: roles?.filter((r) => r.user_id === p.id).map((r) => r.role) ?? [] })) as UserRow[];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["admin-user-transactions", txDialog?.userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").eq("user_id", txDialog!.userId).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!txDialog,
  });

  const { data: detailUnlocks } = useQuery({
    queryKey: ["admin-user-unlocks", detailDialog?.id],
    queryFn: async () => {
      const [epRes, serRes] = await Promise.all([
        supabase.from("episode_unlocks").select("id, episode_id, unlocked_at").eq("user_id", detailDialog!.id).order("unlocked_at", { ascending: false }).limit(20),
        supabase.from("series_unlocks").select("id, series_id, unlocked_at").eq("user_id", detailDialog!.id).order("unlocked_at", { ascending: false }).limit(20),
      ]);
      return { episodes: epRes.data ?? [], series: serRes.data ?? [] };
    },
    enabled: !!detailDialog,
  });

  const filtered = (users ?? []).filter(u => (u.display_name || "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const adjustCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data, error } = await supabase.functions.invoke("buy-coins", { body: { admin_grant: true, target_user_id: userId, coins: amount } });
      if (error) throw error; if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setAdjustDialog(null); toast({ title: "Saldo ajustado!" }); },
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

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "create", email: createForm.email, password: createForm.password, display_name: createForm.display_name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setCreateDialog(false);
      setCreateForm({ email: "", password: "", display_name: "" });
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (err: any) => toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" }),
  });

  const editUserMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "update", user_id: editDialog!.userId, display_name: editName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditDialog(null);
      toast({ title: "Usuário atualizado!" });
    },
    onError: (err: any) => toast({ title: "Erro ao editar", description: err.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteConfirm(null);
      toast({ title: "Usuário excluído!" });
    },
    onError: (err: any) => toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }),
  });

  const handleAdjustSubmit = () => {
    if (!adjustDialog || coinAmount <= 0) return;
    adjustCoinsMutation.mutate({ userId: adjustDialog.userId, amount: adjustMode === "credit" ? coinAmount : -coinAmount });
  };

  const reasonLabels: Record<string, string> = {
    purchase: "Compra", episode_unlock: "Desbloqueio ep.", series_unlock: "Desbloqueio série", admin_adjust: "Ajuste admin",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
        <Button onClick={() => setCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar usuários..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Moedas</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-52">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário</TableCell></TableRow>
            ) : (
              paged.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => setDetailDialog(u)}>
                    {u.display_name || "Sem nome"}
                  </TableCell>
                  <TableCell>{u.balance} 🪙</TableCell>
                  <TableCell><div className="flex gap-1">{u.roles.map((r) => (<Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>))}</div></TableCell>
                  <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Detalhes" onClick={() => setDetailDialog(u)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Editar nome" onClick={() => { setEditDialog({ userId: u.id, name: u.display_name || "" }); setEditName(u.display_name || ""); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Ajustar moedas" onClick={() => { setAdjustDialog({ userId: u.id, name: u.display_name || "Usuário", balance: u.balance }); setAdjustMode("credit"); setCoinAmount(100); }}>
                        <Coins className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Transações" onClick={() => setTxDialog({ userId: u.id, name: u.display_name || "Usuário" })}>
                        <Receipt className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title={u.roles.includes("admin") ? "Remover admin" : "Tornar admin"} onClick={() => setAdminToggle({ userId: u.id, isAdmin: u.roles.includes("admin"), name: u.display_name || "Usuário" })}>
                        <ShieldCheck className={`h-4 w-4 ${u.roles.includes("admin") ? "text-primary" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeleteConfirm({ userId: u.id, name: u.display_name || "Usuário" })}>
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input value={createForm.display_name} onChange={(e) => setCreateForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Nome do usuário" />
            </div>
            <Button className="w-full" onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending || !createForm.email || createForm.password.length < 6}>
              {createUserMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar Usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome de exibição</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <Button className="w-full" onClick={() => editUserMutation.mutate()} disabled={editUserMutation.isPending || !editName.trim()}>
              {editUserMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{deleteConfirm?.name}</span>? Esta ação é irreversível e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirm && deleteUserMutation.mutate(deleteConfirm.userId)}>
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes — {detailDialog?.display_name || "Usuário"}</DialogTitle></DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs break-all">{detailDialog.id}</span>
                <span className="text-muted-foreground">Nome:</span>
                <span>{detailDialog.display_name || "—"}</span>
                <span className="text-muted-foreground">Saldo:</span>
                <span>{detailDialog.balance} 🪙</span>
                <span className="text-muted-foreground">Papéis:</span>
                <div className="flex gap-1">{detailDialog.roles.map(r => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}</div>
                <span className="text-muted-foreground">Criado em:</span>
                <span>{new Date(detailDialog.created_at).toLocaleString("pt-BR")}</span>
              </div>

              {detailUnlocks && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Séries desbloqueadas ({detailUnlocks.series.length})</h4>
                    {detailUnlocks.series.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma</p> : (
                      <ul className="text-xs space-y-1">{detailUnlocks.series.map(s => <li key={s.id} className="text-muted-foreground">{s.series_id} — {new Date(s.unlocked_at).toLocaleDateString("pt-BR")}</li>)}</ul>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Episódios desbloqueados ({detailUnlocks.episodes.length})</h4>
                    {detailUnlocks.episodes.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum</p> : (
                      <ul className="text-xs space-y-1">{detailUnlocks.episodes.map(e => <li key={e.id} className="text-muted-foreground">{e.episode_id} — {new Date(e.unlocked_at).toLocaleDateString("pt-BR")}</li>)}</ul>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => { setDetailDialog(null); setEditDialog({ userId: detailDialog.id, name: detailDialog.display_name || "" }); setEditName(detailDialog.display_name || ""); }}>
                  <Pencil className="mr-1 h-3 w-3" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDetailDialog(null); setAdjustDialog({ userId: detailDialog.id, name: detailDialog.display_name || "Usuário", balance: detailDialog.balance }); }}>
                  <Coins className="mr-1 h-3 w-3" /> Moedas
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDetailDialog(null); setTxDialog({ userId: detailDialog.id, name: detailDialog.display_name || "Usuário" }); }}>
                  <Receipt className="mr-1 h-3 w-3" /> Transações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                <SelectContent><SelectItem value="credit">Creditar</SelectItem><SelectItem value="debit">Debitar</SelectItem></SelectContent>
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
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Motivo</TableHead><TableHead>Moedas</TableHead></TableRow></TableHeader>
            <TableBody>
              {!transactions || transactions.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma transação</TableCell></TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">{new Date(tx.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><Badge variant={tx.type === "credit" ? "default" : "destructive"}>{tx.type === "credit" ? "Crédito" : "Débito"}</Badge></TableCell>
                  <TableCell>{reasonLabels[tx.reason] || tx.reason}</TableCell>
                  <TableCell>{tx.coins} 🪙</TableCell>
                </TableRow>
              ))}
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
            <AlertDialogAction onClick={() => adminToggle && toggleAdminMutation.mutate({ userId: adminToggle.userId, isAdmin: adminToggle.isAdmin })}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManager;
