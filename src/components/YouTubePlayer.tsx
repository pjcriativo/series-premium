import { useEffect, useRef } from "react";

interface YouTubePlayerProps {
  youtubeId: string;
  onPlayerReady?: (player: any) => void;
  savedPositionSeconds?: number;
  savedEpisodeNumber?: number;
  currentEpisodeNumber?: number;
}

/**
 * Mounts a fresh YT.Player on every render.
 * The parent must provide key={episodeId} so this component
 * is fully unmounted+remounted when the episode changes.
 */
const YouTubePlayer = ({
  youtubeId,
  onPlayerReady,
  savedPositionSeconds = 0,
  savedEpisodeNumber,
  currentEpisodeNumber,
}: YouTubePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let destroyed = false;

    const initPlayer = () => {
      if (destroyed || !containerRef.current) return;

      // Create a child div — YT.Player replaces it with an iframe,
      // keeping containerRef.current intact for React.
      const mountDiv = document.createElement("div");
      containerRef.current.appendChild(mountDiv);

      playerRef.current = new (window as any).YT.Player(mountDiv, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: any) => {
            if (destroyed) {
              try { e.target.destroy(); } catch { /* ignore */ }
              return;
            }
            onPlayerReady?.(e.target);
            if (
              savedPositionSeconds > 0 &&
              savedEpisodeNumber === currentEpisodeNumber
            ) {
              e.target.seekTo(savedPositionSeconds, true);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      destroyed = true;
      try {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      } catch { /* ignore */ }
      onPlayerReady?.(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once per mount — parent uses key={episodeId} to force remount

  return <div ref={containerRef} className="w-full h-full" />;
};

export default YouTubePlayer;
