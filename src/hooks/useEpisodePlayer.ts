import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { unlockEpisode as unlockEpisodeService } from "@/lib/unlockService";
import { useEffect, useRef, useState, useCallback } from "react";

export const useEpisodePlayer = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const { user, session, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ytPlayerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [autoUnlocking, setAutoUnlocking] = useState(false);

  // Fetch episode with series info
  const { data: episode, isLoading: epLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, series:series_id(id, title, free_episodes)")
        .eq("id", episodeId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!episodeId,
  });

  const seriesId = episode ? ((episode as any).series?.id ?? episode.series_id) : "";
  const seriesFreeEps = (episode as any)?.series?.free_episodes ?? 0;

  // Access check
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ["episode-access", episodeId, user?.id],
    queryFn: async () => {
      if (!episode) return false;
      if (episode.is_free) return true;
      if (episode.episode_number <= seriesFreeEps) return true;
      if (!user) return false;
      const { data: su } = await supabase
        .from("series_unlocks").select("id")
        .eq("user_id", user.id).eq("series_id", seriesId).maybeSingle();
      if (su) return true;
      const { data: eu } = await supabase
        .from("episode_unlocks").select("id")
        .eq("user_id", user.id).eq("episode_id", episodeId!).maybeSingle();
      return !!eu;
    },
    enabled: !!episode,
  });

  // Saved progress
  const { data: savedProgress } = useQuery({
    queryKey: ["progress", episodeId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress").select("*")
        .eq("user_id", user!.id).eq("series_id", seriesId).maybeSingle();
      return data;
    },
    enabled: !!user && !!episode,
  });

  // Extract YouTube video ID
  const youtubeId = (() => {
    const url = (episode as any)?.youtube_url;
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
    );
    return match ? match[1] : null;
  })();

  // Video signed URL (skip if YouTube)
  const { data: videoUrl } = useQuery({
    queryKey: ["video-url", episode?.video_url],
    queryFn: async () => {
      if (!episode?.video_url) return null;
      const { data, error } = await supabase.storage
        .from("videos").createSignedUrl(episode.video_url, 3600);
      if (error) return null;
      return data.signedUrl;
    },
    enabled: !!episode?.video_url && hasAccess === true && !youtubeId,
  });

  // All episodes of the series
  const { data: allEpisodes } = useQuery({
    queryKey: ["all-episodes", seriesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("episodes")
        .select("id, title, episode_number, price_coins, is_free, is_published")
        .eq("series_id", seriesId)
        .eq("is_published", true)
        .order("episode_number");
      return data ?? [];
    },
    enabled: !!seriesId,
  });

  // Series detail with category
  const { data: seriesDetail } = useQuery({
    queryKey: ["series-detail", seriesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("series")
        .select("id, title, synopsis, slug, categories:category_id(name)")
        .eq("id", seriesId)
        .single();
      return data;
    },
    enabled: !!seriesId,
  });

  // User's episode unlocks for the series
  const { data: userEpisodeUnlocks } = useQuery({
    queryKey: ["user-episode-unlocks", seriesId, user?.id],
    queryFn: async () => {
      const epIds = (allEpisodes ?? []).map((e) => e.id);
      if (epIds.length === 0) return [];
      const { data } = await supabase
        .from("episode_unlocks")
        .select("episode_id")
        .eq("user_id", user!.id)
        .in("episode_id", epIds);
      return data?.map((d) => d.episode_id) ?? [];
    },
    enabled: !!user && !!allEpisodes && allEpisodes.length > 0,
  });

  // Next episode (derived from allEpisodes)
  const nextEpisode = allEpisodes?.find(
    (e) => e.episode_number === (episode?.episode_number ?? 0) + 1
  ) ?? null;

  // Wallet balance
  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets").select("balance")
        .eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Series unlock check
  const { data: seriesUnlocked } = useQuery({
    queryKey: ["series-unlock", seriesId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("series_unlocks").select("id")
        .eq("user_id", user!.id).eq("series_id", seriesId).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!seriesId,
  });

  // Next episode unlock check
  const { data: nextEpisodeUnlocked } = useQuery({
    queryKey: ["episode-unlock", nextEpisode?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("episode_unlocks").select("id")
        .eq("user_id", user!.id).eq("episode_id", nextEpisode!.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!nextEpisode,
  });

  const walletBalance = wallet?.balance ?? 0;

  const isNextAccessible = !!(nextEpisode && (
    nextEpisode.is_free ||
    nextEpisode.episode_number <= seriesFreeEps ||
    seriesUnlocked ||
    nextEpisodeUnlocked
  ));

  // Save progress
  const saveProgress = useCallback(
    async (seconds: number) => {
      if (!user || !episode) return;
      const { data: existing } = await supabase
        .from("user_progress").select("id")
        .eq("user_id", user.id).eq("series_id", seriesId).maybeSingle();

      const payload = {
        last_episode_number: episode.episode_number,
        last_position_seconds: Math.floor(seconds),
      };

      if (existing) {
        await supabase.from("user_progress").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: user.id, series_id: seriesId, ...payload,
        });
      }
    },
    [user, episode, seriesId]
  );

  // Record view
  useEffect(() => {
    if (episode && hasAccess) {
      supabase.from("views").insert({
        user_id: user?.id ?? null,
        series_id: seriesId,
        episode_id: episode.id,
        watched_seconds: 0,
      }).then(() => {});
    }
  }, [episode?.id, hasAccess]);

  // Redirect if no access
  useEffect(() => {
    if (!epLoading && !accessLoading && episode && hasAccess === false) {
      toast({ title: "Acesso negado", description: "Desbloqueie este episódio primeiro.", variant: "destructive" });
      navigate(`/series/${seriesId}`, { replace: true });
    }
  }, [hasAccess, accessLoading, epLoading, episode, navigate, seriesId]);

  // (Restore position is now handled via onLoadedMetadata in EpisodePlayer to avoid race conditions)

  // Auto-save every 5s (native video)
  useEffect(() => {
    if (isPlaying) {
      saveTimerRef.current = setInterval(() => {
        if (videoRef.current) saveProgress(videoRef.current.currentTime);
      }, 5000);
    }
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [isPlaying, saveProgress]);

  // Auto-save every 5s for YouTube episodes
  useEffect(() => {
    if (!youtubeId || !user) return;
    const id = setInterval(() => {
      if (ytPlayerRef.current) {
        const t = ytPlayerRef.current.getCurrentTime?.() ?? 0;
        if (t > 0) saveProgress(t);
      }
    }, 5000);
    return () => {
      clearInterval(id);
      // Save on unmount
      if (ytPlayerRef.current) {
        const t = ytPlayerRef.current.getCurrentTime?.() ?? 0;
        if (t > 0) saveProgress(t);
      }
    };
  }, [youtubeId, user, saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => { if (videoRef.current) saveProgress(videoRef.current.currentTime); };
  }, [saveProgress]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else { videoRef.current.pause(); saveProgress(videoRef.current.currentTime); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowEndScreen(true);
    if (episode) saveProgress(0); // mark completed
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    setShowEndScreen(false);
    videoRef.current.currentTime = 0;
    videoRef.current.play();
  };

  const handleNext = async () => {
    if (!nextEpisode) return;
    if (isNextAccessible) {
      navigate(`/watch/${nextEpisode.id}`);
      return;
    }
    // Locked
    if (profile?.auto_unlock && walletBalance >= nextEpisode.price_coins) {
      setAutoUnlocking(true);
      try {
        await unlockEpisodeService(nextEpisode.id);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["episode-unlock", nextEpisode.id] });
        navigate(`/watch/${nextEpisode.id}`);
      } catch {
        toast({ title: "Erro ao desbloquear", variant: "destructive" });
      } finally {
        setAutoUnlocking(false);
      }
    } else {
      setShowPaywall(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const t = Number(e.target.value);
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const onYTPlayerReady = (player: any) => {
    ytPlayerRef.current = player;
  };

  return {
    episode, epLoading, accessLoading, hasAccess,
    savedProgress,
    videoRef, videoUrl, youtubeId,
    isPlaying, setIsPlaying, isMuted, currentTime, duration, setDuration,
    showEndScreen, showPaywall, setShowPaywall, autoUnlocking,
    nextEpisode, isNextAccessible, walletBalance,
    seriesId, seriesFreeEps,
    allEpisodes: allEpisodes ?? [],
    seriesDetail,
    userEpisodeUnlocks: userEpisodeUnlocks ?? [],
    seriesUnlocked: seriesUnlocked ?? false,
    togglePlay, toggleMute, handleTimeUpdate, handleEnded,
    handleReplay, handleNext, handleSeek, formatTime,
    navigate, queryClient,
    onYTPlayerReady,
  };
};
