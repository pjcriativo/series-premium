import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSeriesCover } from "@/lib/demo-covers";
import HorizontalCarousel from "@/components/HorizontalCarousel";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroSlider from "@/components/HeroSlider";
import ErrorBoundary from "@/components/ErrorBoundary";
import CategoryRow from "@/components/CategoryRow";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { user } = useAuth();

  const { data: continueWatching } = useQuery({
    queryKey: ["continue-watching", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("series_id, last_episode_number, series:series_id(id, title, cover_url)")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: seriesList, isLoading: loadingSeries } = useQuery({
    queryKey: ["browse-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, title, cover_url, category_id, categories:category_id(name), episodes(id)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: banners, isLoading: loadingBanners } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, series:link_series_id(id, title)")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const categoryGroups = useMemo(() => {
    const groups: Record<string, { name: string; series: any[] }> = {};
    (seriesList || []).forEach((s: any) => {
      const catName = s.categories?.name || "Outros";
      if (!groups[catName]) groups[catName] = { name: catName, series: [] };
      groups[catName].series.push({
        ...s,
        category_name: catName,
        episode_count: s.episodes?.length || 0,
      });
    });
    return Object.values(groups);
  }, [seriesList]);

  const isLoading = loadingSeries || loadingBanners;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pb-20">
        {isLoading ? (
          <div className="space-y-6 p-4">
            <Skeleton className="w-full aspect-[16/7] md:aspect-[16/6] rounded-xl" />
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-36 aspect-[2/3] rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {banners && banners.length > 0 && (
              <ErrorBoundary>
                <HeroSlider banners={banners as any} />
              </ErrorBoundary>
            )}

            {user && continueWatching && continueWatching.length > 0 && (
              <div className="mt-6 w-full flex justify-center px-4 md:px-6">
                <div className="w-full max-w-7xl">
                  <HorizontalCarousel title="Continue Assistindo">
                    {continueWatching.map((item: any) => {
                      const cover = getSeriesCover(item.series.id, item.series.cover_url);
                      return (
                        <div
                          key={item.series_id}
                          className="w-[calc((100%-0.75rem)/2)] md:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-4.5rem)/7)] flex-shrink-0"
                        >
                          <Link
                            to={`/series/${item.series.id}`}
                            className="group block w-full transition-transform duration-300 hover:scale-105"
                          >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={item.series.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-secondary">
                                  <span className="text-muted-foreground text-3xl font-bold">
                                    {item.series.title.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                                Ep. {item.last_episode_number}
                              </div>
                            </div>
                            <h3 className="text-sm font-medium text-foreground truncate">{item.series.title}</h3>
                          </Link>
                        </div>
                      );
                    })}
                  </HorizontalCarousel>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2 w-full flex justify-center px-4 md:px-6">
              <div className="w-full max-w-7xl">
                {categoryGroups.map((group) => (
                  <CategoryRow key={group.name} title={group.name} series={group.series} />
                ))}
                {categoryGroups.length === 0 && (
                  <div className="flex items-center justify-center py-20 text-muted-foreground">
                    Nenhuma série disponível ainda.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
