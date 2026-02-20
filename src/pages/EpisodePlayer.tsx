import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, RotateCcw, ChevronRight, ChevronLeft, Loader2, Lock, Heart, Star, Share2, Maximize } from "lucide-react";
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
import YouTubePlayer from "@/components/YouTubePlayer";
import { useEpisodePlayer } from "@/hooks/useEpisodePlayer";
import { useEpisodeSocial, formatCount } from "@/hooks/useEpisodeSocial";
import { cn } from "@/lib/utils";

const EpisodePlayer = () => {
  const {
    episodeId,
    episode, epLoading, accessLoading, hasAccess,
    savedProgress,
    videoRef, videoUrl, videoUrlLoading, youtubeId,
    isPlaying, setIsPlaying, isMuted, currentTime, duration, setDuration,
    showEndScreen, showPaywall, setShowPaywall, autoUnlocking,
    nextEpisode, isNextAccessible, walletBalance,
    seriesId, seriesFreeEps,
    allEpisodes, seriesDetail, userEpisodeUnlocks, seriesUnlocked,
    togglePlay, toggleMute, handleTimeUpdate, handleEnded,
    handleReplay, handleNext, handleSeek, formatTime,
    navigate, queryClient,
    onYTPlayerReady,
    user,
  } = useEpisodePlayer();

  const { likeCount, favoriteCount, hasLiked, hasFavorited, toggleLike, toggleFavorite, handleShare } = useEpisodeSocial(episode?.id);

  const [paywallEpisode, setPaywallEpisode] = useState<{ id: string; title: string; episode_number: number; price_coins: number } | null>(null);

  const navigateWithTransition = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isLoading = epLoading || accessLoading ||
    (!youtubeId && !!episode?.video_url && videoUrlLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-48 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto lg:items-start">
            <div className="lg:w-[55%] flex justify-center lg:justify-end">
              <Skeleton className="w-full max-w-md rounded-lg" style={{ aspectRatio: '9/16', maxHeight: 'calc(100vh - 5rem)' }} />
            </div>
            <div className="lg:w-[45%] space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── In-page lock screen ──────────────────────────────────────────────────────
  const priceCoin = episode?.price_coins ?? 0;
  const canAfford = walletBalance >= priceCoin;

  if (!epLoading && !accessLoading && episode && hasAccess === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">
            {/* Lock icon */}
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>

            {!user ? (
              /* ── Not logged in ── */
              <>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground">Faça login para assistir</h1>
                  <p className="text-sm text-muted-foreground">Este episódio é exclusivo para usuários cadastrados.</p>
                </div>
                <Button asChild className="w-full rounded-full gap-2" size="lg">
                  <Link to="/auth">Entrar / Criar conta</Link>
                </Button>
                <Button variant="outline" className="w-full rounded-full" onClick={() => navigate(`/series/${seriesId}`)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para a série
                </Button>
              </>
            ) : !canAfford ? (
              /* ── Logged in, insufficient balance ── */
              <>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground">Créditos insuficientes</h1>
                  <p className="text-sm text-muted-foreground">
                    Você precisa de <span className="font-semibold text-foreground">{priceCoin} moedas</span> para assistir este episódio.
                    Seu saldo atual é de <span className="font-semibold text-foreground">{walletBalance} moedas</span>.
                  </p>
                </div>
                <Button asChild className="w-full rounded-full gap-2" size="lg">
                  <Link to="/coin-store">Comprar Créditos</Link>
                </Button>
                <Button variant="outline" className="w-full rounded-full" onClick={() => navigate(`/series/${seriesId}`)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para a série
                </Button>
              </>
            ) : (
              /* ── Logged in, can afford — show unlock prompt ── */
              <>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground">Episódio bloqueado</h1>
                  <p className="text-sm text-muted-foreground">
                    Desbloqueie por <span className="font-semibold text-foreground">{priceCoin} moedas</span>.
                    Seu saldo: <span className="font-semibold text-foreground">{walletBalance} moedas</span>.
                  </p>
                </div>
                <Button
                  className="w-full rounded-full gap-2"
                  size="lg"
                  onClick={() => setShowPaywall(true)}
                >
                  <Lock className="h-4 w-4" />
                  Desbloquear por {priceCoin} moedas
                </Button>
                <Button variant="outline" className="w-full rounded-full" onClick={() => navigate(`/series/${seriesId}`)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar para a série
                </Button>
              </>
            )}
          </div>
        </main>

        {/* Paywall modal triggered from lock screen */}
        {episode && (
          <PaywallModal
            open={showPaywall}
            onOpenChange={setShowPaywall}
            episodeTitle={`Ep. ${episode.episode_number} — ${episode.title}`}
            episodeId={episode.id}
            priceCoin={priceCoin}
            balance={walletBalance}
            seriesId={seriesId}
            seriesTitle={(episode as any)?.series?.title ?? ""}
            seriesTotalCost={priceCoin}
            onUnlocked={() => {
              queryClient.invalidateQueries({ queryKey: ["wallet"] });
              queryClient.invalidateQueries({ queryKey: ["episode-access", episode.id, user?.id] });
              queryClient.invalidateQueries({ queryKey: ["episode-unlock", episode.id] });
              setShowPaywall(false);
            }}
          />
        )}

        <BottomNav />
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const seriesTitle = (episode as any)?.series?.title ?? seriesDetail?.title ?? "";
  const categoryName = (seriesDetail as any)?.categories?.name ?? null;
  const synopsis = seriesDetail?.synopsis ?? "";

  const seriesTotalCost = seriesUnlocked ? 0 :
    allEpisodes
      .filter(ep => !ep.is_free && ep.episode_number > seriesFreeEps && !userEpisodeUnlocks.includes(ep.id))
      .reduce((sum, ep) => sum + ep.price_coins, 0);

  const isEpisodeAccessible = (ep: { id: string; is_free: boolean; episode_number: number }) => {
    if (ep.is_free) return true;
    if (ep.episode_number <= seriesFreeEps) return true;
    if (seriesUnlocked) return true;
    return userEpisodeUnlocks.includes(ep.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className={cn("pt-48 px-4 lg:px-8 pb-20 md:pb-8 animate-fade-in")}>
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto lg:items-start">
          {/* Left column - Vertical Video */}
          <div className="lg:w-[55%] flex justify-center lg:justify-end">
            <div
              className="w-full max-w-md bg-black rounded-lg overflow-hidden relative"
              style={{ aspectRatio: '9/16', maxHeight: 'calc(100vh - 5rem)' }}
            >
              {/* Floating back button */}
              <Link
                to={`/series/${seriesId}`}
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Todos os episódios
              </Link>
              {youtubeId ? (
                <YouTubePlayer
                  key={episodeId}
                  youtubeId={youtubeId}
                  onPlayerReady={onYTPlayerReady}
                  savedPositionSeconds={savedProgress?.last_position_seconds}
                  savedEpisodeNumber={savedProgress?.last_episode_number}
                  currentEpisodeNumber={episode?.episode_number}
                />
              ) : videoUrl ? (
                <>
                  <video
                    key={`${episode?.id}-${videoUrl}`}
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full object-contain"
                    muted={isMuted}
                    playsInline
                    autoPlay
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                      const dur = videoRef.current?.duration ?? 0;
                      setDuration(dur);
                      // Restaurar posição exata — executado quando o vídeo já sabe a duração
                      if (
                        savedProgress &&
                        savedProgress.last_position_seconds > 0 &&
                        savedProgress.last_episode_number === episode?.episode_number &&
                        videoRef.current
                      ) {
                        videoRef.current.currentTime = savedProgress.last_position_seconds;
                      }
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleEnded}
                  />

                  {/* Video controls overlay */}
                  {!showEndScreen && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 space-y-2">
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
                            <Button onClick={() => {
                              if (isNextAccessible) {
                                navigateWithTransition(`/watch/${nextEpisode.id}`);
                              } else {
                                handleNext();
                              }
                            }} disabled={autoUnlocking} className="w-full rounded-full gap-2">
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
          <div className="lg:w-[45%] space-y-5 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
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
              <h1 className="text-xl font-bold text-foreground">
                Episódio {episode?.episode_number} — {episode?.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{seriesTitle}</p>
            </div>

            {/* Plot / Synopsis */}
            {synopsis && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">
                  Sinopse do Episódio {episode?.episode_number}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{synopsis}</p>
              </div>
            )}

            {/* Category Badge */}
            {categoryName && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-md text-xs">{categoryName}</Badge>
              </div>
            )}

            {/* Action Icons with Counters */}
            <div className="flex items-center gap-6">
              <button onClick={toggleLike} className={cn("flex flex-col items-center gap-1 transition-colors", hasLiked ? "text-destructive" : "text-muted-foreground hover:text-foreground")}>
                <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
                <span className="text-xs">{formatCount(likeCount)}</span>
              </button>
              <button onClick={toggleFavorite} className={cn("flex flex-col items-center gap-1 transition-colors", hasFavorited ? "text-yellow-500" : "text-muted-foreground hover:text-foreground")}>
                <Star className={cn("h-5 w-5", hasFavorited && "fill-current")} />
                <span className="text-xs">{formatCount(favoriteCount)}</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Compartilhar</span>
              </button>
            </div>

            {/* Episode Grid */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Episódios</h2>
              <Link
                to={`/series/${seriesId}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Ver página da série
              </Link>
              <div className="grid grid-cols-6 gap-2">
                {allEpisodes.map((ep) => {
                  const isCurrent = ep.id === episode?.id;
                  const accessible = isEpisodeAccessible(ep);
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        if (ep.id === episode?.id) return;
                        if (accessible) {
                          navigateWithTransition(`/watch/${ep.id}`);
                        } else {
                          setPaywallEpisode(ep);
                        }
                      }}
                      className={cn(
                        "relative aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-colors border",
                        isCurrent
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-foreground hover:bg-secondary border-border"
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

      {/* Paywall modal - next episode (end screen) */}
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

      {/* Paywall modal - grid locked episode */}
      {paywallEpisode && (
        <PaywallModal
          open={!!paywallEpisode}
          onOpenChange={(open) => { if (!open) setPaywallEpisode(null); }}
          episodeTitle={`Ep. ${paywallEpisode.episode_number} — ${paywallEpisode.title}`}
          episodeId={paywallEpisode.id}
          priceCoin={paywallEpisode.price_coins}
          balance={walletBalance}
          seriesId={seriesId}
          seriesTitle={seriesTitle}
          seriesTotalCost={seriesTotalCost}
          onUnlocked={() => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["user-episode-unlocks", seriesId] });
            queryClient.invalidateQueries({ queryKey: ["episode-unlock", paywallEpisode.id] });
            setPaywallEpisode(null);
          }}
          onNavigateToWatch={(epId) => navigateWithTransition(`/watch/${epId}`)}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default EpisodePlayer;
