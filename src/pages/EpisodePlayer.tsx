import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Play, Pause, Maximize, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef, useState, useCallback } from "react";

const EpisodePlayer = () => {
  const { episodeId } = useParams<{ episodeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch episode
  const { data: episode, isLoading: epLoading } = useQuery({
    queryKey: ["episode", episodeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, series:series_id(id, title)")
        .eq("id", episodeId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!episodeId,
  });

  // Check access
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ["episode-access", episodeId, user?.id],
    queryFn: async () => {
      if (!episode) return false;
      if (episode.is_free) return true;
      if (!user) return false;
      const { data } = await supabase
        .from("user_unlocks")
        .select("id")
        .eq("user_id", user.id)
        .eq("episode_id", episodeId!)
        .maybeSingle();
      return !!data;
    },
    enabled: !!episode,
  });

  // Fetch progress
  const { data: savedProgress } = useQuery({
    queryKey: ["progress", episodeId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("episode_id", episodeId!)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!episodeId,
  });

  // Get signed video URL
  const { data: videoUrl } = useQuery({
    queryKey: ["video-url", episode?.video_url],
    queryFn: async () => {
      if (!episode?.video_url) return null;
      const { data, error } = await supabase.storage
        .from("videos")
        .createSignedUrl(episode.video_url, 3600);
      if (error) return null;
      return data.signedUrl;
    },
    enabled: !!episode?.video_url && hasAccess === true,
  });

  // Save progress
  const saveProgress = useCallback(
    async (seconds: number, completed = false) => {
      if (!user || !episodeId) return;
      const { data: existing } = await supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("episode_id", episodeId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_progress")
          .update({ progress_seconds: Math.floor(seconds), completed })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: user.id,
          episode_id: episodeId,
          progress_seconds: Math.floor(seconds),
          completed,
        });
      }
    },
    [user, episodeId]
  );

  // Redirect if no access
  useEffect(() => {
    if (!epLoading && !accessLoading && episode && hasAccess === false) {
      const seriesId = (episode as any).series?.id ?? episode.series_id;
      toast({ title: "Acesso negado", description: "Desbloqueie este episódio primeiro.", variant: "destructive" });
      navigate(`/series/${seriesId}`, { replace: true });
    }
  }, [hasAccess, accessLoading, epLoading, episode, navigate]);

  // Resume playback
  useEffect(() => {
    if (savedProgress && videoRef.current && savedProgress.progress_seconds > 0) {
      videoRef.current.currentTime = savedProgress.progress_seconds;
    }
  }, [savedProgress, videoUrl]);

  // Auto-save every 10s
  useEffect(() => {
    if (isPlaying) {
      saveTimerRef.current = setInterval(() => {
        if (videoRef.current) saveProgress(videoRef.current.currentTime);
      }, 10000);
    }
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [isPlaying, saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) saveProgress(videoRef.current.currentTime);
    };
  }, [saveProgress]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    // Mark completed at 90%
    if (duration > 0 && videoRef.current.currentTime / duration >= 0.9) {
      saveProgress(videoRef.current.currentTime, true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
      saveProgress(videoRef.current.currentTime);
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

  const isLoading = epLoading || accessLoading;
  const seriesId = episode ? ((episode as any).series?.id ?? episode.series_id) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-full max-w-2xl aspect-video" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <Link to={`/series/${seriesId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            Ep. {episode?.episode_number} — {episode?.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {(episode as any)?.series?.title}
          </p>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full max-h-[70vh] object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-secondary">
            <div className="text-center space-y-2">
              <Play className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground text-sm">Vídeo não disponível ainda</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-card border-t border-border space-y-2">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 accent-primary cursor-pointer"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => videoRef.current?.requestFullscreen()}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {duration > 0 && (
          <Progress value={(currentTime / duration) * 100} className="h-1" />
        )}
      </div>
    </div>
  );
};

export default EpisodePlayer;
