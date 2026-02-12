import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Lock, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";

const SeriesDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
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

  const isLoading = seriesLoading || episodesLoading;

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
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : series ? (
          <>
            {/* Cover Banner */}
            <div className="relative w-full aspect-video overflow-hidden">
              {series.cover_url ? (
                <img src={series.cover_url} alt={series.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-4xl font-bold text-muted-foreground">{series.title.charAt(0)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <Link to="/" className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Info */}
            <div className="px-4 -mt-8 relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                {series.genre && <Badge variant="secondary">{series.genre}</Badge>}
                <span className="text-xs text-muted-foreground">{episodes?.length ?? 0} episódios</span>
              </div>
              <h1 className="text-2xl font-black text-foreground">{series.title}</h1>
              {series.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{series.description}</p>
              )}
              {series.total_coin_price > 0 && (
                <Button className="w-full gap-2 mt-2">
                  <Coins className="h-4 w-4" />
                  Desbloquear Série — {series.total_coin_price} moedas
                </Button>
              )}
            </div>

            {/* Episode List */}
            <div className="px-4 mt-6 pb-8 space-y-2">
              <h2 className="text-lg font-bold text-foreground mb-3">Episódios</h2>
              {episodes?.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-md bg-secondary flex items-center justify-center">
                    {ep.is_free ? (
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
                      {ep.is_free ? "Grátis" : `${ep.coin_cost} moedas`}
                      {ep.duration_seconds && ` · ${Math.floor(ep.duration_seconds / 60)}min`}
                    </p>
                  </div>
                </div>
              ))}
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
