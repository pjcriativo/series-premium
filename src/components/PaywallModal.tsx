import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Coins, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { unlockEpisode, unlockSeries } from "@/lib/unlockService";

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
  const [loading, setLoading] = useState<"episode" | "series" | null>(null);

  const canAffordEpisode = balance >= priceCoin;
  const canAffordSeries = seriesTotalCost != null && seriesTotalCost > 0 && balance >= seriesTotalCost;
  const showSeriesOption = seriesId && seriesTotalCost != null && seriesTotalCost > 0 && seriesTotalCost !== priceCoin;

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

  const canAffordAny = canAffordEpisode || canAffordSeries;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Desbloquear Conteúdo
          </DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Episode price */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Episódio</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              {priceCoin} moedas
            </span>
          </div>

          {/* Series price */}
          {showSeriesOption && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Série completa</span>
              <span className="font-semibold flex items-center gap-1">
                <Coins className="h-4 w-4 text-primary" />
                {seriesTotalCost} moedas
              </span>
            </div>
          )}

          {/* Balance */}
          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
            <span className="text-muted-foreground">Seu saldo</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              {balance} moedas
            </span>
          </div>

          {/* Actions */}
          {canAffordAny ? (
            <div className="space-y-2">
              {canAffordEpisode && (
                <Button
                  onClick={handleUnlockEpisode}
                  disabled={!!loading}
                  className="w-full rounded-full"
                  variant="secondary"
                >
                  {loading === "episode" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Desbloquear episódio — {priceCoin} moedas
                </Button>
              )}
              {showSeriesOption && canAffordSeries && (
                <Button
                  onClick={handleUnlockSeries}
                  disabled={!!loading}
                  className="w-full rounded-full"
                >
                  {loading === "series" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Desbloquear série — {seriesTotalCost} moedas
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-destructive text-center">Saldo insuficiente</p>
              <Button
                onClick={() => { onOpenChange(false); navigate("/wallet"); }}
                className="w-full rounded-full"
              >
                Comprar moedas
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;
