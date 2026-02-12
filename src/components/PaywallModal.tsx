import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Coins, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeTitle: string;
  episodeId: string;
  priceCoin: number;
  balance: number;
  onUnlocked: () => void;
}

const PaywallModal = ({ open, onOpenChange, episodeTitle, episodeId, priceCoin, balance, onUnlocked }: PaywallModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const canAfford = balance >= priceCoin;

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("unlock-episode", {
        body: { episode_id: episodeId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast({ title: "Desbloqueado!", description: "Aproveite o episódio." });
      onOpenChange(false);
      onUnlocked();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível desbloquear.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Desbloquear Episódio
          </DialogTitle>
          <DialogDescription>{episodeTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Preço</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              {priceCoin} moedas
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Seu saldo</span>
            <span className="font-semibold flex items-center gap-1">
              <Coins className="h-4 w-4 text-primary" />
              {balance} moedas
            </span>
          </div>

          {canAfford ? (
            <Button onClick={handleUnlock} disabled={loading} className="w-full rounded-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Desbloquear por {priceCoin} moedas
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-destructive text-center">Saldo insuficiente</p>
              <Button onClick={() => { onOpenChange(false); navigate("/wallet"); }} className="w-full rounded-full">
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
