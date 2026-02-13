import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Star, Share2 } from "lucide-react";
import { getSeriesCover } from "@/lib/demo-covers";

interface SeriesCardProps {
  series: {
    id: string;
    title: string;
    cover_url: string | null;
    category_name?: string | null;
    episode_count?: number;
    synopsis?: string | null;
    first_episode_id?: string | null;
    preview_video_url?: string | null;
  };
}

const SeriesCard = React.forwardRef<HTMLAnchorElement, SeriesCardProps>(
  ({ series }, ref) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

    const videoSrc = series.preview_video_url
      ? (series.preview_video_url.startsWith("http")
          ? series.preview_video_url
          : `https://pnuydoujbrpfhohsxndz.supabase.co/storage/v1/object/public/videos/${series.preview_video_url}`)
      : null;

    // Desktop: hover preview
    const handleMouseEnter = useCallback(() => {
      if (!videoSrc) return;
      hoverTimeout.current = setTimeout(() => setShowPreview(true), 400);
    }, [videoSrc]);

    const handleMouseLeave = useCallback(() => {
      clearTimeout(hoverTimeout.current);
      setShowPreview(false);
      setVideoLoaded(false);
    }, []);

    // Mobile: IntersectionObserver preview
    useEffect(() => {
      const card = cardRef.current;
      if (!card || !videoSrc) return;

      // Only on touch devices
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (!isTouchDevice) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShowPreview(true);
          } else {
            setShowPreview(false);
            setVideoLoaded(false);
          }
        },
        { threshold: 0.7 }
      );

      observer.observe(card);
      return () => observer.disconnect();
    }, [videoSrc]);

    // Play/pause video when showPreview changes
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (showPreview) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, [showPreview]);

    const cover = getSeriesCover(series.id, series.cover_url);

    return (
      <Link
        ref={ref}
        to={`/series/${series.id}`}
        className="group block w-full"
      >
        <div
          ref={cardRef}
          className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Cover image */}
          {cover ? (
            <img
              src={cover}
              alt={series.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <span className="text-muted-foreground text-3xl font-bold">
                {series.title.charAt(0)}
              </span>
            </div>
          )}

          {/* Video preview overlay */}
          {videoSrc && showPreview && (
            <video
              ref={videoRef}
              src={videoSrc}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
              muted
              playsInline
              loop
              preload="metadata"
              onLoadedData={() => setVideoLoaded(true)}
            />
          )}

          {/* Hover overlay - desktop only */}
          <div className="absolute inset-0 bg-black/80 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            {series.category_name && (
              <span className="text-xs text-muted-foreground mb-1">
                {series.category_name}
              </span>
            )}
            {series.synopsis && (
              <p className="text-xs text-foreground/80 line-clamp-3 mb-3">
                {series.synopsis}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(series.first_episode_id ? `/watch/${series.first_episode_id}` : `/series/${series.id}`);
                }}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play size={16} fill="currentColor" />
              </button>
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary/50 text-foreground">
                <Star size={14} />
              </span>
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-secondary/50 text-foreground">
                <Share2 size={14} />
              </span>
            </div>
          </div>
        </div>
        <h3 className="text-sm font-medium text-foreground truncate">{series.title}</h3>
        {series.episode_count !== undefined && (
          <p className="text-xs text-muted-foreground">{series.episode_count} ep.</p>
        )}
      </Link>
    );
  }
);

SeriesCard.displayName = "SeriesCard";

export default SeriesCard;
