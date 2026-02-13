import { Link } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, Loader2, Lock, Heart, Star, Share2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import PaywallModal from "@/components/PaywallModal";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useEpisodePlayer } from "@/hooks/useEpisodePlayer";
import { cn } from "@/lib/utils";

const EpisodePlayer = () => {
  const {
    episode, epLoading, accessLoading, hasAccess,
    videoRef, videoUrl, youtubeId,
    isPlaying, setIsPlaying, isMuted, currentTime, duration, setDuration,
    showEndScreen, showPaywall, setShowPaywall, autoUnlocking,
    nextEpisode, isNextAccessible, walletBalance,
    seriesId, seriesFreeEps,
    allEpisodes, seriesDetail, userEpisodeUnlocks, seriesUnlocked,
    togglePlay, toggleMute, handleTimeUpdate, handleEnded,
    handleReplay, handleNext, handleSeek, formatTime,
    navigate, queryClient,
  } = useEpisodePlayer();

  const isLoading = epLoading || accessLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
            <Skeleton className="lg:w-3/5 aspect-video rounded-lg" />
            <div className="lg:w-2/5 space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const seriesTitle = (episode as any)?.series?.title ?? seriesDetail?.title ?? "";
  const categoryName = (seriesDetail as any)?.categories?.name ?? null;
  const synopsis = seriesDetail?.synopsis ?? "";

  const isEpisodeAccessible = (ep: { id: string; is_free: boolean; episode_number: number }) => {
    if (ep.is_free) return true;
    if (ep.episode_number <= seriesFreeEps) return true;
    if (seriesUnlocked) return true;
    return userEpisodeUnlocks.includes(ep.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16 px-4 lg:px-8 pb-20 md:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
          {/* Left column - Video */}
          <div className="lg:w-3/5">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  frameBorder="0"
                />
              ) : videoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full object-contain"
                    muted={isMuted}
                    playsInline
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleEnded}
                  />

                  {/* Video controls overlay */}
                  {!showEndScreen && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 space-y-2">
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
                        style={{ bottom: "calc(0.75rem + 0.75rem + 0.25rem)" }}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:bg-white/20 h-8 w-8">
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20 h-8 w-8">
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={(e) => { e.stopPropagation(); videoRef.current?.requestFullscreen?.(); }}
                            className="text-white hover:bg-white/20 h-8 w-8"
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* End screen */}
                  {showEndScreen && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="w-full max-w-xs mx-4 space-y-4 text-center">
                        <p className="text-white/60 text-sm">Episódio concluído</p>
                        {nextEpisode ? (
                          <>
                            <p className="text-white font-semibold text-sm">
                              Próximo: Ep. {nextEpisode.episode_number} — {nextEpisode.title}
                            </p>
                            <Button onClick={handleNext} disabled={autoUnlocking} className="w-full rounded-full gap-2">
                              {autoUnlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : isNextAccessible ? <ChevronRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              {isNextAccessible ? "Próximo Episódio" : "Desbloquear Próximo"}
                            </Button>
                          </>
                        ) : (
                          <p className="text-white font-semibold">Você concluiu a série! 🎉</p>
                        )}
                        <Button variant="outline" onClick={handleReplay} className="w-full rounded-full gap-2 border-white/20 text-white hover:bg-white/10">
                          <RotateCcw className="h-4 w-4" /> Rever
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                  <div className="text-center space-y-2">
                    <Play className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground text-sm">Vídeo não disponível ainda</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column - Info & Episode Grid */}
          <div className="lg:w-2/5 space-y-5">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Home</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to={`/series/${seriesId}`}>{seriesTitle}</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Episódio {episode?.episode_number}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Title */}
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Episódio {episode?.episode_number} — {episode?.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{seriesTitle}</p>
            </div>

            {/* Synopsis */}
            {synopsis && (
              <p className="text-sm text-muted-foreground leading-relaxed">{synopsis}</p>
            )}

            {/* Category & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {categoryName && <Badge variant="secondary">{categoryName}</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Star className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Episode Grid */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Episódios</h2>
              <div className="grid grid-cols-6 gap-2">
                {allEpisodes.map((ep) => {
                  const isCurrent = ep.id === episode?.id;
                  const accessible = isEpisodeAccessible(ep);
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        if (ep.id !== episode?.id) navigate(`/watch/${ep.id}`);
                      }}
                      className={cn(
                        "relative aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-colors",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 text-foreground hover:bg-secondary"
                      )}
                    >
                      {ep.episode_number}
                      {!accessible && !isCurrent && (
                        <Lock className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-destructive" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

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

      <BottomNav />
    </div>
  );
};

export default EpisodePlayer;
