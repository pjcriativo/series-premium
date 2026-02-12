import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, VolumeX, Volume2, Lock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface ReelCardProps {
  episode: ReelEpisode;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onRequestUnlock: (episode: ReelEpisode) => void;
  isLoggedIn: boolean;
}

const ReelCard = ({ episode, isActive, isMuted, onToggleMute, onRequestUnlock, isLoggedIn }: ReelCardProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const playIconTimeout = useRef<NodeJS.Timeout | null>(null);

  // Autoplay/pause based on isActive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive && episode.isAccessible && episode.signedVideoUrl) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, episode.isAccessible, episode.signedVideoUrl]);

  // Sync mute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    // Flash icon
    setShowPlayIcon(true);
    if (playIconTimeout.current) clearTimeout(playIconTimeout.current);
    playIconTimeout.current = setTimeout(() => setShowPlayIcon(false), 600);
  }, []);

  const handleCTA = () => {
    if (episode.isAccessible) {
      if (episode.signedVideoUrl || episode.video_url) {
        navigate(`/watch/${episode.id}`);
      }
    } else if (!isLoggedIn) {
      navigate("/auth");
    } else {
      onRequestUnlock(episode);
    }
  };

  const ctaLabel = episode.isAccessible
    ? (episode.video_url ? "Continuar" : "Em breve")
    : isLoggedIn
      ? `Desbloquear ${episode.price_coins} moedas`
      : "Entrar para assistir";

  const ctaDisabled = episode.isAccessible && !episode.video_url;

  return (
    <div
      ref={cardRef}
      className="reel-card relative flex-shrink-0 w-full overflow-hidden bg-black"
    >
      {/* Background: cover image */}
      {episode.series_cover_url && (
        <img
          src={episode.series_cover_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
        />
      )}

      {/* Video layer */}
      {episode.isAccessible && episode.signedVideoUrl ? (
        <video
          ref={videoRef}
          src={episode.signedVideoUrl}
          className="absolute inset-0 w-full h-full object-contain z-10"
          loop
          muted={isMuted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
      ) : (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center"
          onClick={handleCTA}
        >
          {!episode.isAccessible && (
            <Lock className="h-16 w-16 text-white/30" />
          )}
        </div>
      )}

      {/* Play/pause flash icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/50 rounded-full p-4 animate-in fade-in zoom-in duration-200">
            {isPlaying ? (
              <Pause className="h-10 w-10 text-white" />
            ) : (
              <Play className="h-10 w-10 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Mute toggle - top right, below navbar */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        className="absolute top-16 right-4 z-30 bg-black/40 backdrop-blur-sm rounded-full p-2"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-white" />
        ) : (
          <Volume2 className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Bottom overlay with info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pb-20 md:pb-6">
        <div className="flex items-center gap-2 mb-2">
          {episode.category_name && (
            <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
              {episode.category_name}
            </Badge>
          )}
          <Badge className="bg-primary/80 text-primary-foreground border-0 text-[10px] flex items-center gap-1">
            <Flame className="h-3 w-3" />
            Em alta
          </Badge>
        </div>

        <h2 className="text-white text-lg font-bold leading-tight">{episode.series_title}</h2>
        <p className="text-white/70 text-sm">Episódio {episode.episode_number} — {episode.title}</p>

        <Button
          onClick={handleCTA}
          disabled={ctaDisabled}
          className={cn(
            "mt-3 w-full rounded-full font-semibold",
            episode.isAccessible
              ? "bg-primary text-primary-foreground"
              : "bg-white text-black hover:bg-white/90"
          )}
        >
          {!episode.isAccessible && <Lock className="h-4 w-4 mr-1" />}
          {ctaLabel}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-16 md:bottom-0 left-0 right-0 z-30 h-[2px] bg-white/20">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ReelCard;
