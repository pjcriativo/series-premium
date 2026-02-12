import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { getSeriesCover } from "@/lib/demo-covers";

interface SeriesCardProps {
  series: Tables<"series"> & { episode_count?: number };
}

const SeriesCard = ({ series }: SeriesCardProps) => {
  return (
    <Link
      to={`/series/${series.id}`}
      className="group flex-shrink-0 w-36 md:w-44 snap-start"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
        {(() => {
          const cover = getSeriesCover(series.id, series.cover_url);
          return cover ? (
            <img
              src={cover}
              alt={series.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {series.genre && (
          <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded">
            {series.genre}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-foreground truncate">{series.title}</h3>
      {series.episode_count !== undefined && (
        <p className="text-xs text-muted-foreground">{series.episode_count} ep.</p>
      )}
    </Link>
  );
};

export default SeriesCard;
