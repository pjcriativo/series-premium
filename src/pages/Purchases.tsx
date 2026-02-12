import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Purchases = () => {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 py-4">
          <Link to="/me"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-xl font-black text-foreground">Histórico</h1>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-12">Carregando...</p>
        ) : (transactions ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-12">Nenhuma transação encontrada.</p>
        ) : (
          <div className="space-y-2">
            {(transactions ?? []).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <Coins className={`h-4 w-4 ${tx.type === "credit" ? "text-green-500" : "text-red-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{tx.reason.replace("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.type === "credit" ? "text-green-500" : "text-red-500"}`}>
                  {tx.type === "credit" ? "+" : "-"}{tx.coins}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Purchases;
