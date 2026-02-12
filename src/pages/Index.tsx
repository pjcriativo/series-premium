import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import CategoryRow from "@/components/CategoryRow";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/integrations/supabase/types";

type SeriesWithCount = Tables<"series"> & { episode_count?: number };

const Index = () => {
  const { data: allSeries, isLoading } = useQuery({
    queryKey: ["published-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"series">[];
    },
  });

  const { data: episodeCounts } = useQuery({
    queryKey: ["episode-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("series_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((ep) => {
        counts[ep.series_id] = (counts[ep.series_id] || 0) + 1;
      });
      return counts;
    },
  });

  const seriesWithCounts: SeriesWithCount[] = (allSeries || []).map((s) => ({
    ...s,
    episode_count: episodeCounts?.[s.id] ?? 0,
  }));

  const featured = seriesWithCounts.filter((s) => s.featured);
  const heroSeries = featured[0];
  const newReleases = seriesWithCounts.slice(0, 10);

  const genres = [...new Set(seriesWithCounts.map((s) => s.genre).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14">
        {isLoading ? (
          <div className="px-4 pt-4 space-y-6">
            <Skeleton className="w-full aspect-[16/9] rounded-lg" />
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-36 aspect-[2/3] rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {heroSeries && <HeroBanner series={heroSeries} />}

            {featured.length > 0 && (
              <CategoryRow title="Em Destaque" series={featured} />
            )}

            {newReleases.length > 0 && (
              <CategoryRow title="Novos Lançamentos" series={newReleases} />
            )}

            {genres.map((genre) => (
              <CategoryRow
                key={genre}
                title={genre}
                series={seriesWithCounts.filter((s) => s.genre === genre)}
              />
            ))}

            {seriesWithCounts.length > 0 && (
              <CategoryRow title="Mais Recomendados" series={seriesWithCounts} />
            )}

            {seriesWithCounts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <p className="text-muted-foreground text-lg">Nenhuma série disponível ainda.</p>
                <p className="text-muted-foreground text-sm mt-1">Volte em breve!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
