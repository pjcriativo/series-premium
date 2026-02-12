import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { getSeriesCover } from "@/lib/demo-covers";

interface HeroBannerProps {
  series: Tables<"series">;
}

const HeroBanner = ({ series }: HeroBannerProps) => {
  return (
    <section className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
      {(() => {
        const cover = getSeriesCover(series.id, series.cover_url);
        return cover ? (
          <img src={cover} alt={series.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        );
      })()}

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

      <div className="absolute bottom-6 left-4 right-4 md:bottom-10 md:left-8 md:max-w-lg">
        {series.genre && (
          <span className="inline-block bg-primary/90 text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded mb-2">
            {series.genre}
          </span>
        )}
        <h1 className="text-2xl md:text-4xl font-black text-foreground leading-tight mb-2">
          {series.title}
        </h1>
        {series.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {series.description}
          </p>
        )}
        <Link to={`/series/${series.id}`}>
          <Button className="gap-2">
            <Play className="h-4 w-4" />
            Assistir Agora
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HeroBanner;
