import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Coins, LogOut, ShieldCheck, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getSeriesCover } from "@/lib/demo-covers";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const reasonLabels: Record<string, string> = {
  purchase: "Compra de moedas",
  episode_unlock: "Desbloqueio de episódio",
  series_unlock: "Desbloqueio de série",
  admin_adjust: "Ajuste admin",
};

const Profile = () => {
  const { user, profile, signOut, isAdmin, refreshProfile } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: progressList } = useQuery({
    queryKey: ["user-progress-all", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("series_id, last_episode_number, last_position_seconds, updated_at")
        .order("updated_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const seriesIds = progressList?.map((p) => p.series_id) ?? [];

  const { data: watchedSeries } = useQuery({
    queryKey: ["watched-series", seriesIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("series")
        .select("id, title, cover_url, total_episodes")
        .in("id", seriesIds);
      return data;
    },
    enabled: seriesIds.length > 0,
  });

  const { data: continueEpisodes } = useQuery({
    queryKey: ["continue-episodes", progressList?.map((p) => `${p.series_id}-${p.last_episode_number}`)],
    queryFn: async () => {
      const promises = progressList!.map((p) =>
        supabase
          .from("episodes")
          .select("id, title, episode_number, series_id")
          .eq("series_id", p.series_id)
          .eq("episode_number", p.last_episode_number)
          .maybeSingle()
      );
      const results = await Promise.all(promises);
      return results.map((r) => r.data).filter(Boolean);
    },
    enabled: !!progressList?.length,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data;
    },
    enabled: !!user,
  });

  const handleAutoUnlockToggle = async (checked: boolean) => {
    const { error } = await supabase.from("profiles").update({ auto_unlock: checked }).eq("id", user!.id);
    if (error) {
      toast.error("Erro ao atualizar preferência");
    } else {
      await refreshProfile();
      toast.success(checked ? "Auto-desbloqueio ativado" : "Auto-desbloqueio desativado");
    }
  };

  const seriesMap = new Map(watchedSeries?.map((s) => [s.id, s]) ?? []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center py-8 gap-3">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {profile?.display_name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground">{profile?.display_name ?? "Usuário"}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Auto-unlock toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border mb-2">
          <div>
            <p className="text-sm font-medium text-foreground">Auto-desbloqueio</p>
            <p className="text-xs text-muted-foreground">Desbloquear episódios automaticamente ao assistir</p>
          </div>
          <Switch checked={profile?.auto_unlock ?? true} onCheckedChange={handleAutoUnlockToggle} />
        </div>

        {/* Wallet row */}
        <Link
          to="/wallet"
          className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors mb-6"
        >
          <Coins className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm font-medium text-foreground">Carteira</span>
          <span className="text-sm font-bold text-foreground">{wallet?.balance ?? 0} moedas</span>
        </Link>

        {/* Continuar Assistindo */}
        {continueEpisodes && continueEpisodes.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Continuar Assistindo</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {continueEpisodes.map((ep) => {
                const series = seriesMap.get(ep.series_id);
                if (!series) return null;
                const cover = getSeriesCover(series.id, series.cover_url);
                return (
                  <Link
                    key={ep.id}
                    to={`/watch/${ep.id}`}
                    className="group flex-shrink-0 w-32 snap-start"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1.5">
                      {cover ? (
                        <img src={cover} alt={series.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <span className="text-muted-foreground text-2xl font-bold">{series.title.charAt(0)}</span>
                        </div>
                      )}
                      <Badge className="absolute bottom-2 left-2 text-[10px]">Ep. {ep.episode_number}</Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{series.title}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Séries Assistidas */}
        {watchedSeries && watchedSeries.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Séries Assistidas</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {watchedSeries.map((series) => {
                const cover = getSeriesCover(series.id, series.cover_url);
                return (
                  <Link
                    key={series.id}
                    to={`/series/${series.id}`}
                    className="group flex-shrink-0 w-32 snap-start"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-1.5">
                      {cover ? (
                        <img src={cover} alt={series.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <span className="text-muted-foreground text-2xl font-bold">{series.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-foreground truncate">{series.title}</p>
                    <p className="text-[10px] text-muted-foreground">{series.total_episodes} ep.</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Histórico */}
        {transactions && transactions.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Histórico</h2>
            <div className="space-y-1">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
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
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === "credit" ? "text-green-500" : "text-destructive"}`}>
                    {tx.type === "credit" ? "+" : "-"}{tx.coins}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Admin link */}
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors mb-2"
          >
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">Painel Admin</span>
          </Link>
        )}

        <Button variant="ghost" className="w-full mt-6 text-muted-foreground gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
