import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Zap, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

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

export const CreditPackages = ({ userId }: CreditPackagesProps) => {
  const queryClient = useQueryClient();
  const [buying, setBuying] = useState<string | null>(null);

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

  const handleBuy = async (packageId: string, packageTitle: string) => {
    setBuying(packageId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await supabase.functions.invoke("buy-coins", {
        body: { package_id: packageId },
      });

      if (res.error) throw new Error(res.error.message);

      const result = res.data as { success: boolean; coins_added: number; new_balance: number };
      if (!result.success) throw new Error("Falha na compra");

      toast.success(`+${result.coins_added} créditos adicionados! Novo saldo: ${result.new_balance}`);

      // Invalidate wallet and transactions
      await queryClient.invalidateQueries({ queryKey: ["wallet", userId] });
      await queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar compra";
      toast.error(msg);
    } finally {
      setBuying(null);
    }
  };

  return (
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
            const isBuying = buying === pkg.id;

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
                  onClick={() => handleBuy(pkg.id, pkg.title)}
                  disabled={isBuying}
                >
                  {isBuying ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Comprar"
                  )}
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
  );
};
