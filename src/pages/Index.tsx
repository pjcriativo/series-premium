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
import { Flame, Play } from "lucide-react";

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

      if (!data || data.length === 0) return [];

      // Buscar episode_id correspondente a cada (series_id, last_episode_number)
      const seriesIds = data.map((item: any) => item.series_id);
      const { data: episodeData } = await supabase
        .from("episodes")
        .select("id, series_id, episode_number")
        .in("series_id", seriesIds)
        .eq("is_published", true);

      // Mapa: "series_id-episode_number" => episode_id
      const epMap = new Map(
        (episodeData || []).map((ep: any) => [`${ep.series_id}-${ep.episode_number}`, ep.id])
      );

      return data.map((item: any) => ({
        ...item,
        resume_episode_id: epMap.get(`${item.series_id}-${item.last_episode_number}`) || null,
      }));
    },
  });

  const { data: seriesList, isLoading: loadingSeries } = useQuery({
    queryKey: ["browse-series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("series")
        .select("id, title, cover_url, synopsis, category_id, categories:category_id(name), episodes(id)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch first published episode for each series
      const seriesIds = (data || []).map((s: any) => s.id);
      if (seriesIds.length > 0) {
      const { data: firstEpisodes } = await supabase
          .from("episodes")
          .select("id, series_id, video_url")
          .in("series_id", seriesIds)
          .eq("is_published", true)
          .eq("episode_number", 1);

        const episodeMap = new Map(
          (firstEpisodes || []).map((ep: any) => [ep.series_id, { id: ep.id, video_url: ep.video_url }])
        );

        return (data || []).map((s: any) => ({
          ...s,
          first_episode_id: episodeMap.get(s.id)?.id || null,
          preview_video_url: episodeMap.get(s.id)?.video_url || null,
        }));
      }

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

      // Fetch first episode for each banner's series
      const seriesIds = (data || [])
        .map((b: any) => b.link_series_id)
        .filter(Boolean);
      
      if (seriesIds.length > 0) {
        const { data: episodes } = await supabase
          .from("episodes")
          .select("id, series_id")
          .in("series_id", seriesIds)
          .eq("is_published", true)
          .eq("episode_number", 1);
        
        const episodeMap = new Map(
          (episodes || []).map((ep: any) => [ep.series_id, ep.id])
        );
        
        return (data || []).map((b: any) => ({
          ...b,
          first_episode_id: b.link_series_id ? episodeMap.get(b.link_series_id) || null : null,
        }));
      }

      return data;
    },
  });

  // Trending: series with most views in last 7 days
  const { data: trendingSeries } = useQuery({
    queryKey: ["trending-series"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: viewData, error } = await supabase
        .from("views")
        .select("series_id")
        .gte("created_at", sevenDaysAgo.toISOString());
      if (error) throw error;

      // Count views per series
      const counts: Record<string, number> = {};
      (viewData || []).forEach((v: any) => { counts[v.series_id] = (counts[v.series_id] || 0) + 1; });
      const sortedIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
      if (sortedIds.length === 0) return [];

      const { data: seriesData } = await supabase
        .from("series")
        .select("id, title, cover_url, synopsis, category_id, categories:category_id(name), episodes(id)")
        .in("id", sortedIds)
        .eq("is_published", true);

      // Fetch first episodes
      const { data: firstEps } = await supabase
        .from("episodes")
        .select("id, series_id")
        .in("series_id", sortedIds)
        .eq("is_published", true)
        .eq("episode_number", 1);
      const epMap = new Map((firstEps || []).map((ep: any) => [ep.series_id, ep.id]));

      return sortedIds
        .map((id) => (seriesData || []).find((s: any) => s.id === id))
        .filter(Boolean)
        .map((s: any) => ({
          ...s,
          category_name: s.categories?.name || "Outros",
          episode_count: s.episodes?.length || 0,
          first_episode_id: epMap.get(s.id) || null,
        }));
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
        synopsis: s.synopsis,
        first_episode_id: s.first_episode_id || null,
        preview_video_url: s.preview_video_url || null,
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
                          className="w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)] flex-shrink-0"
                        >
                        <Link
                            to={item.resume_episode_id
                              ? `/watch/${item.resume_episode_id}`
                              : `/series/${item.series.id}`}
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
                              {/* Overlay com ícone Play */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                                  <Play className="h-5 w-5 text-white fill-white" />
                                </div>
                              </div>
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

            {/* Trending / Em Alta */}
            {trendingSeries && trendingSeries.length > 0 && (
              <div className="mt-6 w-full flex justify-center px-4 md:px-6">
                <div className="w-full max-w-7xl">
                  <HorizontalCarousel title="🔥 Em Alta">
                    {trendingSeries.map((s: any) => (
                      <div key={s.id} className="w-[calc((100%_-_1rem)/2)] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_5rem)/6)] flex-shrink-0">
                        <Link to={s.first_episode_id ? `/watch/${s.first_episode_id}` : `/series/${s.id}`} className="group block w-full">
                          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
                            {(() => {
                              const cover = getSeriesCover(s.id, s.cover_url);
                              return cover ? (
                                <img src={cover} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-secondary">
                                  <span className="text-muted-foreground text-3xl font-bold">{s.title.charAt(0)}</span>
                                </div>
                              );
                            })()}
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Flame className="h-3 w-3" /> Em Alta
                            </div>
                          </div>
                          <h3 className="text-sm font-medium text-foreground truncate">{s.title}</h3>
                          {s.episode_count > 0 && <p className="text-xs text-muted-foreground">{s.episode_count} ep.</p>}
                        </Link>
                      </div>
                    ))}
                  </HorizontalCarousel>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 w-full flex justify-center px-4 md:px-6">
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
