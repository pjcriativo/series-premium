import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WalletCardProps {
  balance: number;
  updatedAt: string | undefined;
  onAddCredits: () => void;
}

export const WalletCard = ({ balance, updatedAt, onAddCredits }: WalletCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Saldo atual
              </p>
              <p className="text-2xl font-bold text-foreground">
                {balance} <span className="text-sm font-normal text-muted-foreground">moedas</span>
              </p>
              {updatedAt && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <RefreshCw className="h-2.5 w-2.5" />
                  Atualizado{" "}
                  {formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onAddCredits} className="gap-1.5">
            <Coins className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
