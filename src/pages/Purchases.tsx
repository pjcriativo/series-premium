import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Lock, Play, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSeriesCover } from "@/lib/demo-covers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EpisodeUnlockRow {
  id: string;
  unlocked_at: string;
  kind: "episode";
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  seriesId: string;
  seriesTitle: string;
  coverUrl: string | null;
}

interface SeriesUnlockRow {
  id: string;
  unlocked_at: string;
  kind: "series";
  seriesId: string;
  seriesTitle: string;
  coverUrl: string | null;
}

type UnlockItem = EpisodeUnlockRow | SeriesUnlockRow;

// ─── Skeleton card ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-card border border-border">
      <Skeleton className="w-16 h-24 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-8 w-24 rounded-md mt-2" />
      </div>
    </div>
  );
}

// ─── Unlock card ──────────────────────────────────────────────────────────

function UnlockCard({ item }: { item: UnlockItem }) {
  const cover = getSeriesCover(item.seriesId, item.coverUrl);
  const isEpisode = item.kind === "episode";

  const href = isEpisode
    ? `/watch/${(item as EpisodeUnlockRow).episodeId}`
    : `/series/${(item as SeriesUnlockRow).seriesId}`;

  const subtitle = isEpisode
    ? `Ep. ${(item as EpisodeUnlockRow).episodeNumber} — ${(item as EpisodeUnlockRow).episodeTitle}`
    : null;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-card border border-border">
      {/* Cover */}
      <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={item.seriesTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="space-y-1">
          <Badge
            className={
              isEpisode
                ? "text-[10px] px-2 py-0 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20"
                : "text-[10px] px-2 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            }
            variant="outline"
          >
            {isEpisode ? "Episódio" : "Série completa"}
          </Badge>

          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {item.seriesTitle}
          </p>

          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
          )}

          <p className="text-[11px] text-muted-foreground">
            {format(new Date(item.unlocked_at), "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>

        <Link to={href}>
          <Button size="sm" className="mt-2 h-7 text-xs gap-1.5">
            <Play className="h-3 w-3" />
            {isEpisode ? "Assistir" : "Ver série"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Desbloqueie conteúdo para vê-lo aqui.
        </p>
      </div>
      <Link to="/">
        <Button variant="outline" size="sm">
          Explorar séries
        </Button>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

const Purchases = () => {
  const { user } = useAuth();

  // Episode unlocks
  const { data: episodeUnlocks, isLoading: loadingEpisodes } = useQuery({
    queryKey: ["episode-unlocks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_unlocks")
        .select(
          "id, unlocked_at, episodes:episode_id(id, title, episode_number, series_id, series:series_id(id, title, cover_url))"
        )
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row): EpisodeUnlockRow => {
        const ep = row.episodes as {
          id: string;
          title: string;
          episode_number: number;
          series_id: string;
          series: { id: string; title: string; cover_url: string | null } | null;
        } | null;

        return {
          id: row.id,
          unlocked_at: row.unlocked_at,
          kind: "episode",
          episodeId: ep?.id ?? "",
          episodeNumber: ep?.episode_number ?? 0,
          episodeTitle: ep?.title ?? "",
          seriesId: ep?.series?.id ?? ep?.series_id ?? "",
          seriesTitle: ep?.series?.title ?? "Série",
          coverUrl: ep?.series?.cover_url ?? null,
        };
      });
    },
    enabled: !!user,
  });

  // Series unlocks
  const { data: seriesUnlocks, isLoading: loadingSeries } = useQuery({
    queryKey: ["series-unlocks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series_unlocks")
        .select("id, unlocked_at, series:series_id(id, title, cover_url)")
        .eq("user_id", user!.id)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((row): SeriesUnlockRow => {
        const s = row.series as {
          id: string;
          title: string;
          cover_url: string | null;
        } | null;

        return {
          id: row.id,
          unlocked_at: row.unlocked_at,
          kind: "series",
          seriesId: s?.id ?? "",
          seriesTitle: s?.title ?? "Série",
          coverUrl: s?.cover_url ?? null,
        };
      });
    },
    enabled: !!user,
  });

  const isLoading = loadingEpisodes || loadingSeries;

  // Merged & sorted list for "Todos" tab
  const allItems: UnlockItem[] = [
    ...(episodeUnlocks ?? []),
    ...(seriesUnlocks ?? []),
  ].sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());

  const renderSkeletons = () =>
    Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 py-4">
          <Link to="/me">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">Conteúdo Desbloqueado</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              Todos
              {allItems.length > 0 && !isLoading && (
                <span className="ml-1.5 text-[11px] opacity-60">({allItems.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="episodes" className="flex-1">
              Episódios
              {episodeUnlocks && episodeUnlocks.length > 0 && (
                <span className="ml-1.5 text-[11px] opacity-60">({episodeUnlocks.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="series" className="flex-1">
              Séries
              {seriesUnlocks && seriesUnlocks.length > 0 && (
                <span className="ml-1.5 text-[11px] opacity-60">({seriesUnlocks.length})</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All */}
          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-3">{renderSkeletons()}</div>
            ) : allItems.length === 0 ? (
              <EmptyState label="Você ainda não desbloqueou nenhum conteúdo" />
            ) : (
              <div className="space-y-3">
                {allItems.map((item) => (
                  <UnlockCard key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Episodes */}
          <TabsContent value="episodes">
            {loadingEpisodes ? (
              <div className="space-y-3">{renderSkeletons()}</div>
            ) : (episodeUnlocks ?? []).length === 0 ? (
              <EmptyState label="Nenhum episódio desbloqueado ainda" />
            ) : (
              <div className="space-y-3">
                {episodeUnlocks!.map((item) => (
                  <UnlockCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Series */}
          <TabsContent value="series">
            {loadingSeries ? (
              <div className="space-y-3">{renderSkeletons()}</div>
            ) : (seriesUnlocks ?? []).length === 0 ? (
              <EmptyState label="Nenhuma série completa desbloqueada ainda" />
            ) : (
              <div className="space-y-3">
                {seriesUnlocks!.map((item) => (
                  <UnlockCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
};

export default Purchases;
