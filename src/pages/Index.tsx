import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import HeroSlider from "@/components/HeroSlider";
import CategoryRow from "@/components/CategoryRow";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
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
            {banners && banners.length > 0 && <HeroSlider banners={banners as any} />}

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
