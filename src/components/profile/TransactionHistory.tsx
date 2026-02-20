import { ArrowUpCircle, ArrowDownCircle, Receipt } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const reasonLabels: Record<string, string> = {
  purchase: "Compra de moedas",
  episode_unlock: "Desbloqueio de episódio",
  series_unlock: "Desbloqueio de série",
  admin_adjust: "Ajuste admin",
};

interface Transaction {
  id: string;
  type: "credit" | "debit";
  reason: string;
  coins: number;
  created_at: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export const TransactionHistory = ({ transactions, isLoading }: TransactionHistoryProps) => {
  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        Histórico de Transações
      </h2>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!transactions || transactions.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground bg-card border border-border rounded-xl">
          <Receipt className="h-8 w-8 opacity-40" />
          <p className="text-sm">Nenhuma transação ainda</p>
          <p className="text-xs opacity-60">Compre créditos para começar</p>
        </div>
      )}

      {!isLoading && transactions && transactions.length > 0 && (
        <div className="space-y-1.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              {tx.type === "credit" ? (
                <ArrowUpCircle className="h-5 w-5 text-green-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {reasonLabels[tx.reason] ?? tx.reason}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(tx.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
              <span
                className={`text-sm font-bold shrink-0 ${
                  tx.type === "credit" ? "text-green-500" : "text-destructive"
                }`}
              >
                {tx.type === "credit" ? "+" : "-"}
                {tx.coins}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
