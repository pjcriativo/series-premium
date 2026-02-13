import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Coins, Loader2, X, CreditCard, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-border [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
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
          <div className="p-4 space-y-4">
            {/* Episode title */}
            <p className="text-xs text-muted-foreground text-center">{episodeTitle}</p>

            {/* Unlock Episode */}
            <button
              onClick={handleUnlockEpisode}
              disabled={!canAffordEpisode || !!loading}
              className="w-full rounded-xl border border-border bg-secondary/50 p-3 flex items-center justify-between transition-all hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Desbloquear episódio</p>
                  <p className="text-xs text-muted-foreground">Apenas este episódio</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                {loading === "episode" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <>
                    <Coins className="h-4 w-4 text-primary" />
                    {priceCoin}
                  </>
                )}
              </div>
            </button>

            {/* Unlock Series */}
            {showSeriesOption && (
              <button
                onClick={handleUnlockSeries}
                disabled={!canAffordSeries || !!loading}
                className="w-full rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 to-accent/10 p-3 flex items-center justify-between transition-all hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/30 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Desbloquear série</p>
                    <p className="text-xs text-muted-foreground">Todos os episódios</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                  {loading === "series" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <Coins className="h-4 w-4 text-primary" />
                      {seriesTotalCost}
                    </>
                  )}
                </div>
              </button>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recarregar moedas</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Coin Packages Grid */}
            <div className="grid grid-cols-3 gap-2">
              {(packages ?? []).map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleBuyCoins(pkg.id)}
                  disabled={buying !== null}
                  className="relative rounded-xl border border-border bg-secondary/40 p-3 flex flex-col items-center gap-1.5 transition-all hover:border-primary/50 hover:bg-secondary/60 active:scale-95 disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{pkg.coins}</span>
                  <span className="text-[10px] text-muted-foreground">moedas</span>
                  <span className="text-xs font-semibold text-primary mt-0.5">
                    {formatBRL(pkg.price_cents)}
                  </span>
                  {buying === pkg.id && (
                    <Loader2 className="absolute top-1 right-1 h-3 w-3 animate-spin text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Pagamento</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button className="rounded-xl border border-border bg-secondary/40 p-3 flex flex-col items-center gap-1.5 transition-all hover:border-primary/50">
                <CreditCard className="h-5 w-5 text-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Cartão</span>
              </button>
              <button className="rounded-xl border border-border bg-secondary/40 p-3 flex flex-col items-center gap-1.5 transition-all hover:border-primary/50">
                <span className="text-sm font-bold text-foreground">G Pay</span>
                <span className="text-[10px] font-medium text-muted-foreground">Google Pay</span>
              </button>
              <button className="rounded-xl border border-border bg-secondary/40 p-3 flex flex-col items-center gap-1.5 transition-all hover:border-primary/50">
                <span className="text-xs font-bold text-foreground leading-tight">Mercado Pago</span>
                <span className="text-[10px] font-medium text-muted-foreground">MP</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;
