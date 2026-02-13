import React from "react";
import { Link } from "react-router-dom";
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
  };
}

const SeriesCard = React.forwardRef<HTMLAnchorElement, SeriesCardProps>(
  ({ series }, ref) => {
    return (
      <Link
        ref={ref}
        to={`/series/${series.id}`}
        className="group block w-full"
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
          {(() => {
            const cover = getSeriesCover(series.id, series.cover_url);
            return cover ? (
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
            );
          })()}

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
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                <Play size={16} fill="currentColor" />
              </span>
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
