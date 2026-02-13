import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Coins, Loader2, X, CreditCard, Sparkles, Zap, Star, Play, Crown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { unlockEpisode, unlockSeries } from "@/lib/unlockService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeId: string;
  priceCoin: number;
  balance: number;
  seriesId?: string;
  seriesTitle?: string;
  seriesTotalCost?: number;
  onUnlocked: () => void;
  onNavigateToWatch?: (episodeId: string) => void;
}

const PaywallModal = ({
  open,
  onOpenChange,
  episodeTitle,
  episodeId,
  priceCoin,
  balance,
  seriesId,
  seriesTitle,
  seriesTotalCost,
  onUnlocked,
  onNavigateToWatch,
}: PaywallModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<"episode" | "series" | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("card");

  const canAffordEpisode = balance >= priceCoin;
  const canAffordSeries = seriesTotalCost != null && seriesTotalCost > 0 && balance >= seriesTotalCost;
  const showSeriesOption = seriesId && seriesTotalCost != null && seriesTotalCost > 0;

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
    enabled: open,
  });

  const handleUnlockEpisode = async () => {
    setLoading("episode");
    try {
      await unlockEpisode(episodeId);
      toast({ title: "Desbloqueado!", description: "Aproveite o episódio." });
      onOpenChange(false);
      onUnlocked();
      if (onNavigateToWatch) onNavigateToWatch(episodeId);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível desbloquear.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleUnlockSeries = async () => {
    if (!seriesId) return;
    setLoading("series");
    try {
      await unlockSeries(seriesId);
      toast({ title: "Série desbloqueada!", description: "Todos os episódios disponíveis." });
      onOpenChange(false);
      onUnlocked();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível desbloquear.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCoins = async (packageId: string) => {
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

  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Calculate bonus info for each package
  const getPackageBonus = (pkg: { coins: number; price_cents: number }) => {
    // Estimate base coins from price (e.g. 1 BRL = 100 coins baseline)
    const baseCoinsPer100Cents = packages && packages.length > 0
      ? Math.round(packages[0].coins / (packages[0].price_cents / 100))
      : 100;
    const expectedBase = Math.round((pkg.price_cents / 100) * baseCoinsPer100Cents);
    const bonus = pkg.coins - expectedBase;
    const bonusPercent = expectedBase > 0 ? Math.round((bonus / expectedBase) * 100) : 0;
    return {
      base: expectedBase,
      bonus: Math.max(0, bonus),
      percent: Math.max(0, bonusPercent),
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden border-border [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Preço:</span>
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground">{priceCoin}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Saldo:</span>
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-bold text-foreground">{balance}</span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="max-h-[75vh]">
          <div className="p-5 space-y-6">
            {/* Unlock Cards - Side by Side */}
            <div className={`grid gap-4 ${showSeriesOption ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {/* Unlock Episode Card */}
              <button
                onClick={handleUnlockEpisode}
                disabled={!canAffordEpisode || !!loading}
                className="w-full rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-5 flex flex-col gap-4 transition-all hover:border-primary/60 hover:from-primary/20 disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-foreground">Desbloquear episódio</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Apenas este episódio</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-base font-bold text-foreground">
                    {loading === "episode" ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Coins className="h-5 w-5 text-primary" />
                        {priceCoin}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    Acesso imediato
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="h-3.5 w-3.5 text-primary" />
                    Alta qualidade
                  </span>
                </div>
              </button>

              {/* Unlock Series Card */}
              {showSeriesOption && (
                <button
                  onClick={handleUnlockSeries}
                  disabled={!canAffordSeries || !!loading}
                  className="w-full rounded-xl border border-primary/40 bg-gradient-to-br from-primary/25 to-accent/10 p-5 flex flex-col gap-4 transition-all hover:border-primary/70 hover:from-primary/30 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">Desbloquear série</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Todos os episódios</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-base font-bold text-foreground">
                      {loading === "series" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Coins className="h-5 w-5 text-primary" />
                          {seriesTotalCost}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5 text-primary" />
                      Acesso completo
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-primary" />
                      Melhor valor
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Recarregar moedas */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Recarregar moedas</h3>
              <div className="grid grid-cols-3 gap-3">
                {(packages ?? []).map((pkg) => {
                  const bonusInfo = getPackageBonus(pkg);
                  return (
                    <button
                      key={pkg.id}
                      onClick={() => handleBuyCoins(pkg.id)}
                      disabled={buying !== null}
                      className="relative rounded-xl border border-border bg-secondary/40 p-4 flex flex-col gap-2 transition-all hover:border-primary/50 hover:bg-secondary/60 active:scale-[0.97] disabled:opacity-50 text-left"
                    >
                      {bonusInfo.percent > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                          +{bonusInfo.percent}%
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-lg font-bold text-foreground">{pkg.coins.toLocaleString("pt-BR")}</span>
                      </div>
                      {bonusInfo.bonus > 0 && (
                        <div className="text-[11px] text-muted-foreground space-y-0.5">
                          <p>Imediato: {bonusInfo.base.toLocaleString("pt-BR")}</p>
                          <p className="text-primary">Bônus: {bonusInfo.bonus.toLocaleString("pt-BR")}</p>
                        </div>
                      )}
                      <span className="text-xs font-semibold text-primary mt-auto">
                        {formatBRL(pkg.price_cents)}
                      </span>
                      {buying === pkg.id && (
                        <Loader2 className="absolute top-2 right-2 h-3.5 w-3.5 animate-spin text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagamento */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Pagamento</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedPayment("card")}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:border-primary/50 ${
                    selectedPayment === "card" ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-foreground" />
                  <span className="text-xs font-medium text-foreground">Cartão</span>
                </button>
                <button
                  onClick={() => setSelectedPayment("gpay")}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:border-primary/50 ${
                    selectedPayment === "gpay" ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                  }`}
                >
                  <span className="text-base font-bold text-foreground">G Pay</span>
                  <span className="text-xs font-medium text-foreground">Google Pay</span>
                </button>
                <button
                  onClick={() => setSelectedPayment("mp")}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 transition-all hover:border-primary/50 ${
                    selectedPayment === "mp" ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                  }`}
                >
                  <span className="text-sm font-bold text-foreground leading-tight">Mercado Pago</span>
                  <span className="text-xs font-medium text-foreground">MP</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;
