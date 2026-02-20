import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coins, Zap, Star, Crown, CreditCard, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreditPackagesProps {
  userId: string;
}

const packageIcons = [Zap, Star, Crown];
const packageColors = [
  "from-blue-500/10 to-blue-500/5 border-blue-500/20",
  "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20",
];
const iconColors = ["text-blue-500", "text-purple-500", "text-amber-500"];

export const CreditPackages = ({ userId: _userId }: CreditPackagesProps) => {
  const [showComingSoon, setShowComingSoon] = useState(false);

  const { data: packages, isLoading } = useQuery({
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

  return (
    <>
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          Pacotes de Crédito
        </h2>

        {isLoading && (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && packages && packages.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {packages.slice(0, 3).map((pkg, idx) => {
              const Icon = packageIcons[idx] ?? Coins;
              const gradientClass = packageColors[idx] ?? packageColors[0];
              const iconClass = iconColors[idx] ?? "text-primary";

              return (
                <div
                  key={pkg.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br border ${gradientClass}`}
                >
                  <div className={`h-8 w-8 ${iconClass}`}>
                    <Icon className="h-full w-full" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{pkg.coins}</p>
                    <p className="text-[10px] text-muted-foreground">moedas</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">
                      R$ {(pkg.price_cents / 100).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-xs gap-1"
                    onClick={() => setShowComingSoon(true)}
                  >
                    Comprar
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && (!packages || packages.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum pacote disponível no momento
          </p>
        )}
      </section>

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
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
