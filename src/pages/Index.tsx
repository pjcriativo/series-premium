import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import CategoryRow from "@/components/CategoryRow";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const { data: allSeries, isLoading } = useQuery({
    queryKey: ["published-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("*, categories(name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: episodeCounts } = useQuery({
    queryKey: ["episode-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("episodes").select("series_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((ep) => {
        counts[ep.series_id] = (counts[ep.series_id] || 0) + 1;
      });
      return counts;
    },
  });

  const seriesWithCounts = (allSeries || []).map((s) => ({
    ...s,
    episode_count: episodeCounts?.[s.id] ?? 0,
    category_name: (s as any).categories?.name ?? null,
  }));

  const heroSeries = seriesWithCounts[0];
  const newReleases = seriesWithCounts.slice(0, 10);

  const categoryNames = [...new Set(seriesWithCounts.map((s) => s.category_name).filter(Boolean))] as string[];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14 pb-16 md:pb-0">
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

            {newReleases.length > 0 && (
              <CategoryRow title="Novos Lançamentos" series={newReleases} />
            )}

            {categoryNames.map((cat) => (
              <CategoryRow
                key={cat}
                title={cat}
                series={seriesWithCounts.filter((s) => s.category_name === cat)}
              />
            ))}

            {seriesWithCounts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <p className="text-muted-foreground text-lg">Nenhuma série disponível ainda.</p>
                <p className="text-muted-foreground text-sm mt-1">Volte em breve!</p>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
