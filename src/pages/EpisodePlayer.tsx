import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PaywallModal from "@/components/PaywallModal";
import { useEpisodePlayer } from "@/hooks/useEpisodePlayer";

const EpisodePlayer = () => {
  const {
    episode, epLoading, accessLoading, hasAccess,
    videoRef, videoUrl, youtubeId,
    isPlaying, setIsPlaying, isMuted, currentTime, duration, setDuration,
    showEndScreen, showPaywall, setShowPaywall, autoUnlocking,
    nextEpisode, isNextAccessible, walletBalance,
    seriesId,
    togglePlay, toggleMute, handleTimeUpdate, handleEnded,
    handleReplay, handleNext, handleSeek, formatTime,
    navigate, queryClient,
  } = useEpisodePlayer();

  const isLoading = epLoading || accessLoading;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Skeleton className="w-full max-w-sm aspect-[9/16]" />
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 flex items-center gap-3">
        <Link to={`/series/${seriesId}`}>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {(episode as any)?.series?.title} • Episódio {episode?.episode_number}
          </p>
          <p className="text-xs text-white/60 truncate">{episode?.title}</p>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center" onClick={youtubeId ? undefined : togglePlay}>
        {youtubeId ? (
          <div className="w-full max-w-sm aspect-[9/16] max-h-screen mx-auto">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              className="w-full h-full rounded-lg"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-contain"
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleEnded}
          />
        ) : (
          <div className="w-full max-w-sm aspect-[9/16] flex items-center justify-center bg-secondary/20 rounded-lg">
            <div className="text-center space-y-2">
              <Play className="h-12 w-12 text-white/40 mx-auto" />
              <p className="text-white/40 text-sm">Vídeo não disponível ainda</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls overlay (hidden for YouTube) */}
      {!showEndScreen && !youtubeId && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10 space-y-2">
          {/* Progress bar */}
          <div className="relative w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute left-4 right-4 opacity-0 h-6 cursor-pointer"
            style={{ bottom: "calc(1.5rem + 0.75rem + 0.25rem)" }}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:bg-white/20">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End screen overlay */}
      {showEndScreen && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-sm mx-4 space-y-4 text-center">
            <p className="text-white/60 text-sm">Episódio concluído</p>

            {nextEpisode ? (
              <>
                <p className="text-white font-semibold">
                  Próximo: Ep. {nextEpisode.episode_number} — {nextEpisode.title}
                </p>
                <Button
                  onClick={handleNext}
                  disabled={autoUnlocking}
                  className="w-full rounded-full gap-2"
                >
                  {autoUnlocking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isNextAccessible ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {isNextAccessible ? "Próximo Episódio" : "Desbloquear Próximo"}
                </Button>
              </>
            ) : (
              <p className="text-white font-semibold">Você concluiu a série! 🎉</p>
            )}

            <Button
              variant="outline"
              onClick={handleReplay}
              className="w-full rounded-full gap-2 border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Rever
            </Button>
          </div>
        </div>
      )}

      {/* Paywall modal */}
      {nextEpisode && (
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          episodeTitle={`Ep. ${nextEpisode.episode_number} — ${nextEpisode.title}`}
          episodeId={nextEpisode.id}
          priceCoin={nextEpisode.price_coins}
          balance={walletBalance}
          onUnlocked={() => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["episode-unlock", nextEpisode.id] });
            setShowPaywall(false);
            navigate(`/watch/${nextEpisode.id}`);
          }}
        />
      )}
    </div>
  );
};

export default EpisodePlayer;
