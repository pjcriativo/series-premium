import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEpisodeSocial } from "@/hooks/useEpisodeSocial";
import { Heart, Bookmark, Share2, Play, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSeriesCover } from "@/lib/demo-covers";

interface ReelEpisode {
  id: string;
  title: string;
  episode_number: number;
  video_url: string | null;
  youtube_url: string | null;
  is_free: boolean;
  series_id: string;
  series_title: string;
  series_cover: string | null;
  price_coins: number;
}

const ReelItem = ({ episode, isActive }: { episode: ReelEpisode; isActive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const _auth = useAuth();
  const { likeCount, hasLiked, toggleLike, toggleFavorite, hasFavorited, favoriteCount, handleShare, formatCount } = useEpisodeSocial(episode.id);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const videoSrc = episode.video_url
    ? (episode.video_url.startsWith("http") ? episode.video_url : `https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/public/videos/${episode.video_url}`)
    : null;

  const cover = getSeriesCover(episode.series_id, episode.series_cover);

  return (
    <div className="relative w-full h-[100dvh] snap-start snap-always flex-shrink-0 bg-black">
      {videoSrc ? (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-contain"
            loop
            muted
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onClick={togglePlay}
            poster={cover || undefined}
          />
          {!isPlaying && isActive && (
            <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10">
              <Play className="h-16 w-16 text-white/80" fill="white" />
            </button>
          )}
        </>
      ) : episode.youtube_url ? (
        <iframe
          src={`${episode.youtube_url}${episode.youtube_url.includes("?") ? "&" : "?"}autoplay=${isActive ? 1 : 0}&mute=1&controls=0&loop=1&playsinline=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          {cover ? (
            <img src={cover} alt={episode.title} className="w-full h-full object-cover opacity-60" />
          ) : (
            <span className="text-muted-foreground text-6xl font-bold">{episode.series_title.charAt(0)}</span>
          )}
        </div>
      )}

      {/* Bottom overlay - title & series info */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
        <button
          onClick={() => navigate(`/series/${episode.series_id}`)}
          className="text-xs font-semibold text-primary mb-1 hover:underline"
        >
          {episode.series_title}
        </button>
        <h3 className="text-white font-bold text-base leading-tight">
          Ep. {episode.episode_number} - {episode.title}
        </h3>
        {!episode.is_free && (
          <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs">
            <Lock className="h-3 w-3" />
            <span>{episode.price_coins} moedas</span>
          </div>
        )}
      </div>

      {/* Right sidebar - social actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        <button onClick={toggleLike} className="flex flex-col items-center gap-0.5">
          <Heart className={cn("h-7 w-7", hasLiked ? "text-red-500 fill-red-500" : "text-white")} />
          <span className="text-white text-[10px]">{formatCount(likeCount)}</span>
        </button>
        <button onClick={toggleFavorite} className="flex flex-col items-center gap-0.5">
          <Bookmark className={cn("h-7 w-7", hasFavorited ? "text-primary fill-primary" : "text-white")} />
          <span className="text-white text-[10px]">{formatCount(favoriteCount)}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
          <Share2 className="h-7 w-7 text-white" />
          <span className="text-white text-[10px]">Compartilhar</span>
        </button>
        <button
          onClick={() => navigate(`/watch/${episode.id}`)}
          className="flex flex-col items-center gap-0.5"
        >
          <Play className="h-7 w-7 text-white" fill="white" />
          <span className="text-white text-[10px]">Assistir</span>
        </button>
      </div>
    </div>
  );
};

const ReelsFeed = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["reels-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("id, title, episode_number, video_url, youtube_url, is_free, price_coins, series_id, series:series_id(title, cover_url)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []).map((ep: any) => ({
        id: ep.id,
        title: ep.title,
        episode_number: ep.episode_number,
        video_url: ep.video_url,
        youtube_url: ep.youtube_url,
        is_free: ep.is_free,
        series_id: ep.series_id,
        series_title: ep.series?.title || "Série",
        series_cover: ep.series?.cover_url || null,
        price_coins: ep.price_coins,
      })) as ReelEpisode[];
    },
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(index)) setActiveIndex(index);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [episodes]);

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Nenhum episódio disponível.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
    >
      {episodes.map((ep, i) => (
        <div key={ep.id} data-index={i}>
          <ReelItem episode={ep} isActive={i === activeIndex} />
        </div>
      ))}
    </div>
  );
};

export default ReelsFeed;
