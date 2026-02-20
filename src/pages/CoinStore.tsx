import { ArrowLeft, Coins, Sparkles, Zap, Crown, Gem, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showComingSoon, setShowComingSoon] = useState(false);

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

        {/* Coming soon notice */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5 flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Pagamento em configuração</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Em breve você poderá comprar moedas com Stripe, PIX e cartão de crédito.
            </p>
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
                onClick={() => setShowComingSoon(true)}
                className={`relative rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${isPopular ? "ring-2 ring-primary" : ""}`}
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
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Os pacotes de moedas estarão disponíveis em breve.
        </p>
      </main>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Pagamento em breve
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            O sistema de compra de moedas está sendo configurado.
          </p>
          <div className="mt-4 rounded-lg bg-muted/50 border border-border p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-foreground mb-2">Em breve você poderá pagar com:</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-primary">✓</span> Cartão de crédito via Stripe
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-primary">✓</span> PIX
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-primary">✓</span> Google Pay
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">Aguarde a liberação! 🚀</p>
          <Button className="w-full mt-4" onClick={() => setShowComingSoon(false)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default CoinStore;
