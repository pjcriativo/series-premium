import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Coins, LogOut, ShieldCheck, History } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, profile, signOut, isAdmin } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center py-8 gap-3">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {profile?.display_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground">{profile?.display_name ?? "Usuário"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        <div className="space-y-2">
          <Link to="/wallet" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
            <Coins className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">Carteira</span>
            <span className="text-sm font-bold text-foreground">{wallet?.balance ?? 0} moedas</span>
          </Link>

          <Link to="/purchases" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
            <History className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">Histórico de Compras</span>
          </Link>

          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm font-medium text-foreground">Painel Admin</span>
            </Link>
          )}
        </div>

        <Button variant="ghost" className="w-full mt-8 text-muted-foreground gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
