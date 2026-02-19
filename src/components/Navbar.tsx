import { Link } from "react-router-dom";
import { Coins, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import logo from "@/assets/epsodiox-logo.png";

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || user?.email || "Convidado";
  const uid = user?.id ? user.id.slice(0, 8) + "..." : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        {/* Left: Logo + Nav Links (desktop only) */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Epsodiox" className="h-[150px] w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1.5 text-base font-medium text-white hover:text-white/80 transition-colors">
              Início
            </Link>
            <Link to="/search" className="flex items-center gap-1.5 text-base font-medium text-white/80 hover:text-white transition-colors">
              Categorias
            </Link>
            <Link to="/fan-club" className="flex items-center gap-1.5 text-base font-medium text-white/80 hover:text-white transition-colors">
              Fã-Clube
            </Link>
            <Link to="/brand" className="flex items-center gap-1.5 text-base font-medium text-white/80 hover:text-white transition-colors">
              Marca
            </Link>
          </div>
        </div>

        {/* Right: Auth button or Avatar with HoverCard */}
        <div className="flex items-center gap-3">
          {!user ? (
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-brand-orange text-primary-foreground font-bold px-6 h-10 rounded-full hover:opacity-90 transition-opacity">
                Entrar
              </Button>
            </Link>
          ) : (
            <>
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <button className="cursor-pointer">
                    <Avatar className="h-9 w-9 border border-primary/50">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-60 p-4 hidden md:block">
                  {/* Header: avatar + name + uid */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-9 w-9 border border-primary/50">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground leading-tight">{displayName}</span>
                        {uid && <span className="text-[10px] text-muted-foreground leading-tight">UID {uid}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Coin balances */}
                  <div className="grid grid-cols-2 gap-2 text-center border-y border-border py-3 my-3">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-bold text-foreground">{wallet?.balance ?? 0}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Moedas</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-bold text-foreground">0</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Bônus</p>
                    </div>
                  </div>

                  {/* CTA button */}
                  <Link to="/wallet" className="block">
                    <Button className="w-full h-9 text-sm font-bold">
                      Completar
                    </Button>
                  </Link>

                  {/* Admin panel link */}
                  {isAdmin && (
                    <Link to="/admin" className="block mt-2">
                      <Button variant="outline" className="w-full h-9 text-sm font-bold gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Painel Admin
                      </Button>
                    </Link>
                  )}
                </HoverCardContent>
              </HoverCard>

              {/* Mobile: coin balance */}
              <Link to="/wallet" className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors md:hidden">
                <Coins className="h-3.5 w-3.5 text-primary" />
                {wallet?.balance ?? 0}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
