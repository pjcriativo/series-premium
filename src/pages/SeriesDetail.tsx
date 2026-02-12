import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Play, Lock, Coins, Unlock } from "lucide-react";
import { getSeriesCover } from "@/lib/demo-covers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useState } from "react";

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ["episodes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("series_id", id!)
        .order("episode_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: episodeUnlocks } = useQuery({
    queryKey: ["episode-unlocks", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("episode_unlocks")
        .select("episode_id")
        .eq("user_id", user!.id);
      return new Set((data ?? []).map((u) => u.episode_id));
    },
    enabled: !!user,
  });

  const { data: seriesUnlocked } = useQuery({
    queryKey: ["series-unlock", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("series_unlocks")
        .select("id")
        .eq("user_id", user!.id)
        .eq("series_id", id!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const handleUnlock = async (episodeId?: string, seriesId?: string) => {
    if (!user) { navigate("/auth"); return; }
    setUnlocking(episodeId ?? seriesId ?? "series");
    try {
      const { data, error } = await supabase.functions.invoke("unlock-episode", {
        body: episodeId ? { episode_id: episodeId } : { series_id: seriesId },
      });
      if (error) throw error;
      if (data.error) {
        toast({
          title: data.error === "Insufficient balance" ? "Saldo insuficiente" : "Erro",
          description: data.error === "Insufficient balance"
            ? `Necessário: ${data.required} moedas. Saldo: ${data.current}`
            : data.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Desbloqueado!", description: `${data.unlocked} episódio(s). Gasto: ${data.spent} moedas.` });
        queryClient.invalidateQueries({ queryKey: ["episode-unlocks"] });
        queryClient.invalidateQueries({ queryKey: ["series-unlock"] });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setUnlocking(null);
    }
  };

  const isEpisodeAccessible = (ep: any) => {
    if (ep.is_free) return true;
    if (series && ep.episode_number <= series.free_episodes) return true;
    if (seriesUnlocked) return true;
    if (episodeUnlocks?.has(ep.id)) return true;
    return false;
  };

  const handleEpisodeClick = (ep: any) => {
    if (isEpisodeAccessible(ep)) {
      if (!user && !ep.is_free) { navigate("/auth"); return; }
      navigate(`/watch/${ep.id}`);
    } else {
      handleUnlock(ep.id);
    }
  };

  const isLoading = seriesLoading || episodesLoading;
  const categoryName = (series as any)?.categories?.name;

  // Calculate total cost for unlocking remaining episodes
  const paidEpisodes = (episodes ?? []).filter((ep) => !ep.is_free && (!series || ep.episode_number > series.free_episodes));
  const totalSeriesCost = paidEpisodes.reduce((sum, ep) => sum + ep.price_coins, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full aspect-video" />
            <div className="px-4 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : series ? (
          <>
            <div className="relative w-full aspect-video overflow-hidden">
              {(() => {
                const cover = getSeriesCover(series.id, series.cover_url);
                return cover ? (
                  <img src={cover} alt={series.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <span className="text-4xl font-bold text-muted-foreground">{series.title.charAt(0)}</span>
                  </div>
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <Link to="/" className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="px-4 -mt-8 relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
                <span className="text-xs text-muted-foreground">{episodes?.length ?? 0} episódios</span>
                {wallet && (
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Coins className="h-3 w-3" /> {wallet.balance}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-foreground">{series.title}</h1>
              {series.synopsis && (
                <p className="text-sm text-muted-foreground leading-relaxed">{series.synopsis}</p>
              )}
              {totalSeriesCost > 0 && !seriesUnlocked && (
                <Button
                  className="w-full gap-2 mt-2"
                  onClick={() => handleUnlock(undefined, id)}
                  disabled={unlocking === "series"}
                >
                  <Coins className="h-4 w-4" />
                  {unlocking === "series" ? "Desbloqueando..." : `Desbloquear Série — ${totalSeriesCost} moedas`}
                </Button>
              )}
            </div>

            <div className="px-4 mt-6 pb-8 space-y-2">
              <h2 className="text-lg font-bold text-foreground mb-3">Episódios</h2>
              {episodes?.map((ep) => {
                const accessible = isEpisodeAccessible(ep);
                const isFreeByRule = ep.is_free || (series && ep.episode_number <= series.free_episodes);
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleEpisodeClick(ep)}
                    disabled={unlocking === ep.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border text-left hover:bg-accent/50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                      {accessible ? (
                        <Play className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        Ep. {ep.episode_number} — {ep.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isFreeByRule ? "Grátis" : accessible ? "Desbloqueado" : `${ep.price_coins} moedas`}
                        {ep.duration_seconds && ` · ${Math.floor(ep.duration_seconds / 60)}min`}
                      </p>
                    </div>
                    {!accessible && !isFreeByRule && (
                      <Badge variant="outline" className="flex-shrink-0 gap-1">
                        <Coins className="h-3 w-3" />
                        {ep.price_coins}
                      </Badge>
                    )}
                  </button>
                );
              })}
              {(!episodes || episodes.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum episódio disponível.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Série não encontrada.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SeriesDetail;
