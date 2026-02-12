import { ArrowLeft, Coins, Sparkles, Zap, Crown, Gem } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

const iconMap: Record<string, any> = {
  Starter: Zap,
  Popular: Sparkles,
  Premium: Crown,
  Ultra: Gem,
};

const colorMap: Record<string, string> = {
  Starter: "from-blue-500 to-cyan-400",
  Popular: "from-primary to-purple-400",
  Premium: "from-amber-500 to-orange-400",
  Ultra: "from-rose-500 to-pink-400",
};

const CoinStore = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [buying, setBuying] = useState<string | null>(null);

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: packages } = useQuery({
    queryKey: ["coin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_packages")
        .select("*")
        .eq("is_active", true)
        .order("coins", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleBuy = async (packageId: string) => {
    if (!user) return;
    setBuying(packageId);
    try {
      const { data, error } = await supabase.functions.invoke("buy-coins", {
        body: { package_id: packageId },
      });
      if (error) throw error;
      if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
      } else {
        toast({
          title: "Moedas adicionadas! 🎉",
          description: `+${data.coins_added} moedas. Novo saldo: ${data.new_balance}`,
        });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const formatBRL = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 px-4 pb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 py-4">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-xl font-black text-foreground">Loja de Moedas</h1>
        </div>

        <div className="rounded-xl bg-card border border-border p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Coins className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seu saldo</p>
            <p className="text-2xl font-black text-foreground">{wallet?.balance ?? 0}</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Escolha um pacote</h2>
        <div className="grid grid-cols-2 gap-3">
          {(packages ?? []).map((pkg) => {
            const Icon = iconMap[pkg.title] ?? Coins;
            const color = colorMap[pkg.title] ?? "from-primary to-primary";
            const isPopular = pkg.title === "Popular";
            return (
              <button
                key={pkg.id}
                onClick={() => handleBuy(pkg.id)}
                disabled={buying !== null}
                className={`relative rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${isPopular ? "ring-2 ring-primary" : ""}`}
              >
                {isPopular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</span>
                )}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-black text-foreground">{pkg.coins}</span>
                <span className="text-xs text-muted-foreground">moedas</span>
                <span className="text-xs font-semibold text-foreground mt-1">{formatBRL(pkg.price_cents)}</span>
                {buying === pkg.id && <span className="text-[10px] text-primary animate-pulse">Processando...</span>}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">As moedas são creditadas instantaneamente na sua conta.</p>
      </main>
      <BottomNav />
    </div>
  );
};

export default CoinStore;
