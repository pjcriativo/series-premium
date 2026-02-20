import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, ShieldCheck, AlertTriangle, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfileHeaderProps {
  displayName: string | null;
  email: string | undefined;
  avatarUrl: string | null;
  balance: number;
  isAdmin: boolean;
  onBuyCredits: () => void;
}

export const ProfileHeader = ({
  displayName,
  email,
  avatarUrl,
  balance,
  isAdmin,
  onBuyCredits,
}: ProfileHeaderProps) => {
  const initials =
    displayName?.charAt(0)?.toUpperCase() ?? email?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-primary shadow-lg">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? "avatar"} />}
          <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {isAdmin && (
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <h1 className="text-xl font-bold text-foreground">{displayName ?? "Usuário"}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">{balance}</span>
            <span className="text-muted-foreground">moedas</span>
          </Badge>
          <Button size="sm" onClick={onBuyCredits} className="gap-1.5">
            <Coins className="h-4 w-4" />
            Comprar Créditos
          </Button>
        </div>

        {balance === 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-full px-4 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            <span className="text-xs text-destructive font-medium">Saldo zerado — você não pode assistir episódios pagos</span>
            <Link
              to="/coin-store"
              className="flex items-center gap-1 text-xs font-semibold text-destructive underline underline-offset-2 hover:text-destructive/80 transition-colors ml-1"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </Link>
          </div>
        )}
      </div>

      {isAdmin && (
        <Link
          to="/admin"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Acessar Painel Admin
        </Link>
      )}
    </div>
  );
};
