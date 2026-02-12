import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, ShieldCheck } from "lucide-react";

const UserManager = () => {
  const [grantDialog, setGrantDialog] = useState<{ userId: string; name: string } | null>(null);
  const [coinAmount, setCoinAmount] = useState(100);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, coin_balance, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      return profiles.map((p) => ({
        ...p,
        roles: roles?.filter((r) => r.user_id === p.id).map((r) => r.role) ?? [],
      }));
    },
  });

  const grantCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { error: txError } = await supabase.from("coin_transactions").insert({
        user_id: userId,
        amount,
        type: "grant" as const,
        description: `Admin granted ${amount} coins`,
      });
      if (txError) throw txError;

      const { error: profileError } = await supabase.rpc("grant_coins" as any, { _user_id: userId, _amount: amount });
      // Fallback: update directly if RPC doesn't exist
      if (profileError) {
        const { data: profile } = await supabase.from("profiles").select("coin_balance").eq("id", userId).single();
        const newBalance = (profile?.coin_balance ?? 0) + amount;
        const { error } = await supabase.from("profiles").update({ coin_balance: newBalance }).eq("id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setGrantDialog(null);
      toast({ title: "Moedas concedidas!" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as any });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Papel atualizado" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-foreground">Usuários</h1>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Moedas</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum usuário</TableCell>
              </TableRow>
            ) : (
              users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.display_name || "Sem nome"}</TableCell>
                  <TableCell>{u.coin_balance} 🪙</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Conceder moedas"
                        onClick={() => setGrantDialog({ userId: u.id, name: u.display_name || "Usuário" })}
                      >
                        <Coins className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={u.roles.includes("admin") ? "Remover admin" : "Tornar admin"}
                        onClick={() => toggleAdminMutation.mutate({ userId: u.id, isAdmin: u.roles.includes("admin") })}
                      >
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

      <Dialog open={!!grantDialog} onOpenChange={() => setGrantDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder moedas para {grantDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => grantDialog && grantCoinsMutation.mutate({ userId: grantDialog.userId, amount: coinAmount })}
              disabled={grantCoinsMutation.isPending}
            >
              {grantCoinsMutation.isPending ? "Concedendo..." : `Conceder ${coinAmount} moedas`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;
