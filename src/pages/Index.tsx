import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ReelCard from "@/components/ReelCard";
import PaywallModal from "@/components/PaywallModal";
import { Skeleton } from "@/components/ui/skeleton";

interface ReelEpisode {
  id: string;
  title: string;
  episode_number: number;
  is_free: boolean;
  price_coins: number;
  video_url: string | null;
  series_id: string;
  series_title: string;
  series_slug: string;
  series_cover_url: string | null;
  category_name: string | null;
  free_episodes: number;
  isAccessible: boolean;
  signedVideoUrl?: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const feedRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [paywallEpisode, setPaywallEpisode] = useState<ReelEpisode | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Fetch episodes with series + category
  const { data: episodes, isLoading } = useQuery({
    queryKey: ["feed-episodes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, series:series_id(id, title, slug, cover_url, free_episodes, category_id, categories:category_id(name))")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  // Fetch user unlocks
  const { data: unlocks } = useQuery({
    queryKey: ["user-unlocks", user?.id],
    queryFn: async () => {
      const [{ data: eu }, { data: su }] = await Promise.all([
        supabase.from("episode_unlocks").select("episode_id").eq("user_id", user!.id),
        supabase.from("series_unlocks").select("series_id").eq("user_id", user!.id),
      ]);
      return {
        episodes: new Set((eu || []).map((e) => e.episode_id)),
        series: new Set((su || []).map((s) => s.series_id)),
      };
    },
    enabled: !!user,
  });

  // Fetch wallet balance
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Build reel episodes list
  const reelEpisodes: ReelEpisode[] = (episodes || []).map((ep: any) => {
    const series = ep.series;
    const isAccessible =
      ep.is_free ||
      ep.episode_number <= (series?.free_episodes ?? 0) ||
      (unlocks?.series.has(series?.id) ?? false) ||
      (unlocks?.episodes.has(ep.id) ?? false);

    return {
      id: ep.id,
      title: ep.title,
      episode_number: ep.episode_number,
      is_free: ep.is_free,
      price_coins: ep.price_coins,
      video_url: ep.video_url,
      series_id: series?.id ?? ep.series_id,
      series_title: series?.title ?? "",
      series_slug: series?.slug ?? "",
      series_cover_url: series?.cover_url ?? null,
      category_name: series?.categories?.name ?? null,
      free_episodes: series?.free_episodes ?? 0,
      isAccessible,
      signedVideoUrl: signedUrls[ep.id] ?? null,
    };
  });

  // Fetch signed URLs for active + next
  const fetchSignedUrl = useCallback(async (episode: ReelEpisode) => {
    if (!episode.video_url || !episode.isAccessible || signedUrls[episode.id]) return;
    const { data } = await supabase.storage.from("videos").createSignedUrl(episode.video_url, 3600);
    if (data?.signedUrl) {
      setSignedUrls((prev) => ({ ...prev, [episode.id]: data.signedUrl }));
    }
  }, [signedUrls]);

  useEffect(() => {
    if (!reelEpisodes.length) return;
    const current = reelEpisodes[activeIndex];
    const next = reelEpisodes[activeIndex + 1];
    if (current) fetchSignedUrl(current);
    if (next) fetchSignedUrl(next);
  }, [activeIndex, reelEpisodes.length, episodes, unlocks]);

  // IntersectionObserver for snap detection
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const cards = feed.querySelectorAll(".reel-card");
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: feed, threshold: 0.7 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [reelEpisodes.length]);

  const handleUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: ["user-unlocks"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    setPaywallEpisode(null);
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Navbar />
      <div ref={feedRef} className="reel-feed flex-1 overflow-y-scroll snap-y snap-mandatory">
        {isLoading ? (
          <div className="reel-card h-full w-full flex items-end p-4 snap-start">
            <div className="space-y-3 w-full">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-6 w-48 bg-white/10" />
              <Skeleton className="h-4 w-36 bg-white/10" />
              <Skeleton className="h-10 w-full rounded-full bg-white/10" />
            </div>
          </div>
        ) : reelEpisodes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50 text-center px-4">
            <p>Nenhum episódio disponível ainda.<br />Volte em breve!</p>
          </div>
        ) : (
          reelEpisodes.map((ep, i) => (
            <div key={ep.id} data-index={i} className="reel-card h-full snap-start">
              <ReelCard
                episode={ep}
                isActive={i === activeIndex}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted((m) => !m)}
                onRequestUnlock={(ep) => setPaywallEpisode(ep)}
                isLoggedIn={!!user}
              />
            </div>
          ))
        )}
      </div>
      <BottomNav />

      {paywallEpisode && (
        <PaywallModal
          open={!!paywallEpisode}
          onOpenChange={(open) => { if (!open) setPaywallEpisode(null); }}
          episodeTitle={`Ep. ${paywallEpisode.episode_number} — ${paywallEpisode.title}`}
          episodeId={paywallEpisode.id}
          priceCoin={paywallEpisode.price_coins}
          balance={wallet?.balance ?? 0}
          seriesId={paywallEpisode.series_id}
          seriesTitle={paywallEpisode.series_title}
          onUnlocked={handleUnlocked}
        />
      )}
    </div>
  );
};

export default Index;
